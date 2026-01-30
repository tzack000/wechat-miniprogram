# 语音克隆模型性能优化指南

## 概述

本文档说明如何优化MockingBird模型的推理性能，包括量化、剪枝、批处理等技术。

## 性能基准

### 未优化性能（基准）

| 指标 | CPU (4核8GB) | GPU (Tesla T4) |
|------|-------------|---------------|
| 5秒音频合成 | 20-30秒 | 5-8秒 |
| 10秒音频合成 | 35-50秒 | 10-15秒 |
| RTF (实时因子) | 4-6x | 1-2x |
| 内存使用 | 3-4GB | 4-6GB |
| 批处理(batch=4) | N/A | 15-20秒 |

### 优化目标

- RTF < 2x (CPU)
- RTF < 0.5x (GPU, 实时以上)
- 内存使用 < 2GB
- 支持并发请求

## 优化策略

### 1. 模型量化 (Quantization)

将FP32模型转换为INT8，减少模型大小和推理时间。

#### PyTorch动态量化

```python
import torch

def quantize_model(model, model_path_out):
    """
    动态量化模型
    """
    # 仅量化Linear层
    quantized_model = torch.quantization.quantize_dynamic(
        model,
        {torch.nn.Linear},
        dtype=torch.qint8
    )
    
    # 保存量化模型
    torch.save(quantized_model.state_dict(), model_path_out)
    
    return quantized_model

# 使用示例
from synthesizer.inference import Synthesizer

# 加载原始模型
original_model = Synthesizer("models/synthesizer/synthesizer.pt")

# 量化
quantized_model = quantize_model(
    original_model.model,
    "models/synthesizer/synthesizer_quantized.pt"
)

# 性能提升: ~2x faster, ~4x smaller
```

#### 静态量化（需要校准数据）

```python
import torch
from torch.quantization import prepare, convert

def static_quantize_model(model, calibration_data):
    """
    静态量化（需要校准数据）
    """
    model.eval()
    
    # 配置量化
    model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
    
    # 准备量化
    model_prepared = prepare(model)
    
    # 校准（使用代表性数据）
    with torch.no_grad():
        for data in calibration_data:
            model_prepared(data)
    
    # 转换为量化模型
    model_quantized = convert(model_prepared)
    
    return model_quantized

# 性能提升: ~3x faster, ~4x smaller
```

### 2. 模型剪枝 (Pruning)

移除不重要的权重，减少计算量。

```python
import torch.nn.utils.prune as prune

def prune_model(model, amount=0.3):
    """
    剪枝模型（移除30%的权重）
    """
    for name, module in model.named_modules():
        if isinstance(module, torch.nn.Linear):
            prune.l1_unstructured(module, name='weight', amount=amount)
            prune.remove(module, 'weight')
    
    return model

# 使用示例
pruned_model = prune_model(synthesizer.model, amount=0.3)

# 性能提升: ~1.5x faster, 略小
# 注意: 可能轻微降低质量
```

### 3. 批处理优化

同时处理多个请求，提高GPU利用率。

```python
class BatchSynthesizer:
    """
    批处理合成器
    """
    def __init__(self, model_path, batch_size=4):
        self.synthesizer = Synthesizer(model_path)
        self.batch_size = batch_size
    
    def synthesize_batch(self, texts, embeddings):
        """
        批量合成
        """
        # 确保batch大小一致
        assert len(texts) == len(embeddings)
        
        # 分批处理
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch_texts = texts[i:i+self.batch_size]
            batch_embeds = embeddings[i:i+self.batch_size]
            
            # 批量推理
            specs = self.synthesizer.synthesize_spectrograms(
                batch_texts, 
                batch_embeds
            )
            results.extend(specs)
        
        return results

# 使用示例
batch_synth = BatchSynthesizer("models/synthesizer/synthesizer.pt", batch_size=4)
texts = ["文本1", "文本2", "文本3", "文本4"]
embeds = [embed1, embed2, embed3, embed4]
results = batch_synth.synthesize_batch(texts, embeds)

# GPU性能提升: ~3x throughput
```

### 4. 使用ONNX Runtime

将PyTorch模型转换为ONNX格式，使用优化的推理引擎。

#### 导出ONNX模型

```python
import torch

def export_to_onnx(model, dummy_input, output_path):
    """
    导出PyTorch模型为ONNX
    """
    model.eval()
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    print(f"Model exported to {output_path}")

# 示例：导出Encoder
encoder_model = ...  # 加载编码器
dummy_audio = torch.randn(1, 16000)  # 1秒音频
export_to_onnx(
    encoder_model,
    dummy_audio,
    "models/encoder/encoder.onnx"
)
```

#### 使用ONNX Runtime推理

```python
import onnxruntime as ort
import numpy as np

class ONNXEncoder:
    """
    ONNX Encoder推理
    """
    def __init__(self, model_path):
        self.session = ort.InferenceSession(
            model_path,
            providers=['CPUExecutionProvider']  # 或 'CUDAExecutionProvider'
        )
    
    def embed_utterance(self, audio):
        """
        提取声纹（使用ONNX）
        """
        # 准备输入
        audio_input = audio.astype(np.float32).reshape(1, -1)
        
        # 推理
        outputs = self.session.run(
            None,
            {'input': audio_input}
        )
        
        return outputs[0][0]  # 返回embedding

# 使用示例
onnx_encoder = ONNXEncoder("models/encoder/encoder.onnx")
embedding = onnx_encoder.embed_utterance(audio_data)

# 性能提升: ~2-3x faster (CPU), ~1.5x faster (GPU)
```

### 5. 使用TensorRT（NVIDIA GPU）

TensorRT提供最优的GPU推理性能。

```python
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit

class TensorRTInference:
    """
    TensorRT推理引擎
    """
    def __init__(self, onnx_path, engine_path=None):
        self.logger = trt.Logger(trt.Logger.WARNING)
        
        if engine_path and os.path.exists(engine_path):
            # 加载已有引擎
            self.engine = self.load_engine(engine_path)
        else:
            # 从ONNX构建引擎
            self.engine = self.build_engine(onnx_path)
            if engine_path:
                self.save_engine(self.engine, engine_path)
        
        self.context = self.engine.create_execution_context()
    
    def build_engine(self, onnx_path):
        """
        从ONNX构建TensorRT引擎
        """
        builder = trt.Builder(self.logger)
        network = builder.create_network(
            1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        )
        parser = trt.OnnxParser(network, self.logger)
        
        # 解析ONNX
        with open(onnx_path, 'rb') as model:
            parser.parse(model.read())
        
        # 配置
        config = builder.create_builder_config()
        config.max_workspace_size = 1 << 30  # 1GB
        config.set_flag(trt.BuilderFlag.FP16)  # 使用FP16
        
        # 构建引擎
        engine = builder.build_engine(network, config)
        return engine
    
    def infer(self, input_data):
        """
        推理
        """
        # 分配GPU内存
        d_input = cuda.mem_alloc(input_data.nbytes)
        d_output = cuda.mem_alloc(...)  # 根据输出大小
        
        # 复制数据到GPU
        cuda.memcpy_htod(d_input, input_data)
        
        # 执行推理
        self.context.execute_v2([int(d_input), int(d_output)])
        
        # 复制结果回CPU
        output = np.empty(...)  # 输出形状
        cuda.memcpy_dtoh(output, d_output)
        
        return output

# 使用示例
trt_encoder = TensorRTInference(
    "models/encoder/encoder.onnx",
    "models/encoder/encoder.trt"
)
embedding = trt_encoder.infer(audio_data)

# 性能提升: ~5-10x faster (GPU)
```

### 6. 缓存优化

#### 声纹缓存

```python
import hashlib
import pickle
from functools import lru_cache

class CachedEncoder:
    """
    带缓存的编码器
    """
    def __init__(self, encoder, cache_dir="cache/embeddings"):
        self.encoder = encoder
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def _get_audio_hash(self, audio):
        """
        计算音频哈希
        """
        return hashlib.md5(audio.tobytes()).hexdigest()
    
    def embed_utterance(self, audio):
        """
        提取声纹（带缓存）
        """
        audio_hash = self._get_audio_hash(audio)
        cache_path = f"{self.cache_dir}/{audio_hash}.pkl"
        
        # 尝试从缓存加载
        if os.path.exists(cache_path):
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        
        # 提取声纹
        embedding = self.encoder.embed_utterance(audio)
        
        # 保存到缓存
        with open(cache_path, 'wb') as f:
            pickle.dump(embedding, f)
        
        return embedding

# 性能提升: 缓存命中时几乎0延迟
```

#### Redis缓存

```python
import redis
import json

class RedisCache:
    """
    Redis缓存管理
    """
    def __init__(self, host='localhost', port=6379):
        self.redis = redis.Redis(host=host, port=port, db=0)
    
    def get_embedding(self, audio_hash):
        """
        获取缓存的声纹
        """
        data = self.redis.get(f"embed:{audio_hash}")
        if data:
            return np.frombuffer(data, dtype=np.float32)
        return None
    
    def set_embedding(self, audio_hash, embedding, ttl=86400):
        """
        缓存声纹（默认24小时）
        """
        self.redis.setex(
            f"embed:{audio_hash}",
            ttl,
            embedding.tobytes()
        )

# 使用示例
cache = RedisCache()
audio_hash = hashlib.md5(audio.tobytes()).hexdigest()

# 尝试从缓存获取
cached = cache.get_embedding(audio_hash)
if cached is not None:
    embedding = cached
else:
    embedding = encoder.embed_utterance(audio)
    cache.set_embedding(audio_hash, embedding)
```

### 7. 并发优化

#### 使用异步处理

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AsyncVoiceCloner:
    """
    异步语音克隆器
    """
    def __init__(self, num_workers=4):
        self.executor = ThreadPoolExecutor(max_workers=num_workers)
        self.encoder = None
        self.synthesizer = None
        self.vocoder = None
    
    async def load_models(self):
        """
        异步加载模型
        """
        loop = asyncio.get_event_loop()
        
        # 并行加载三个模型
        await asyncio.gather(
            loop.run_in_executor(self.executor, self._load_encoder),
            loop.run_in_executor(self.executor, self._load_synthesizer),
            loop.run_in_executor(self.executor, self._load_vocoder)
        )
    
    async def clone_voice_async(self, audio, text):
        """
        异步语音克隆
        """
        loop = asyncio.get_event_loop()
        
        # 1. 提取声纹
        embedding = await loop.run_in_executor(
            self.executor,
            self.encoder.embed_utterance,
            audio
        )
        
        # 2. 合成频谱
        spec = await loop.run_in_executor(
            self.executor,
            self.synthesizer.synthesize_spectrograms,
            [text], [embedding]
        )
        
        # 3. 生成音频
        audio_out = await loop.run_in_executor(
            self.executor,
            self.vocoder.infer_waveform,
            spec[0]
        )
        
        return audio_out

# 使用示例
async def main():
    cloner = AsyncVoiceCloner(num_workers=4)
    await cloner.load_models()
    
    # 并发处理多个请求
    tasks = [
        cloner.clone_voice_async(audio1, text1),
        cloner.clone_voice_async(audio2, text2),
        cloner.clone_voice_async(audio3, text3)
    ]
    
    results = await asyncio.gather(*tasks)
    return results

# 吞吐量提升: ~3-4x
```

### 8. 混合精度推理（Mixed Precision）

```python
import torch

# 启用自动混合精度
scaler = torch.cuda.amp.GradScaler()

def infer_with_amp(model, input_data):
    """
    使用混合精度推理
    """
    with torch.cuda.amp.autocast():
        output = model(input_data)
    return output

# 性能提升: ~1.5-2x faster (GPU)
# 内存使用: ~50% reduction
```

## 优化效果对比

| 优化方法 | CPU加速 | GPU加速 | 内存减少 | 质量损失 | 实施难度 |
|---------|---------|---------|---------|---------|---------|
| 动态量化 | 2x | 1.2x | 4x | <5% | ⭐ |
| 静态量化 | 3x | 1.5x | 4x | <10% | ⭐⭐ |
| 模型剪枝 | 1.5x | 1.3x | 1.2x | <15% | ⭐⭐⭐ |
| 批处理 | 1x | 3x | 1x | 0% | ⭐ |
| ONNX Runtime | 2-3x | 1.5x | 1x | 0% | ⭐⭐ |
| TensorRT | N/A | 5-10x | 1.5x | <5% | ⭐⭐⭐⭐ |
| 缓存 | ∞ | ∞ | N/A | 0% | ⭐ |
| 混合精度 | N/A | 1.5-2x | 2x | <5% | ⭐⭐ |

## 推荐优化路线

### 阶段1: 快速优化（1-2天）
```
1. 实施缓存（Redis）
2. 启用批处理
3. 配置并发处理
```
预期效果: 3-5x 吞吐量提升

### 阶段2: 模型优化（1周）
```
1. 动态量化模型
2. 导出ONNX格式
3. 测试性能和质量
```
预期效果: 2-3x 推理加速

### 阶段3: 深度优化（2-4周）
```
1. TensorRT优化（GPU）
2. 模型剪枝和微调
3. 自定义算子优化
```
预期效果: 5-10x 推理加速

## 监控和分析

```python
import time
from functools import wraps

def profile_inference(func):
    """
    性能分析装饰器
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        start_mem = torch.cuda.memory_allocated() if torch.cuda.is_available() else 0
        
        result = func(*args, **kwargs)
        
        elapsed = time.time() - start_time
        mem_used = torch.cuda.memory_allocated() - start_mem if torch.cuda.is_available() else 0
        
        print(f"{func.__name__}: {elapsed:.2f}s, Memory: {mem_used/1024**2:.1f}MB")
        
        return result
    return wrapper

# 使用示例
@profile_inference
def synthesize_voice(text, embedding):
    ...
```

## 下一步

1. 选择合适的优化策略
2. 在测试环境验证
3. 部署到生产环境
4. 持续监控性能
