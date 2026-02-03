# 真实语音克隆模型部署指南

## 📋 目录
1. [当前实现说明](#当前实现说明)
2. [真实模型需求](#真实模型需求)
3. [模型下载方案](#模型下载方案)
4. [部署步骤](#部署步署)
5. [性能优化](#性能优化)
6. [成本估算](#成本估算)

---

## 1. 当前实现说明

### 🔸 Mock 模式（当前）

**位置**: `src/utils/model_loader.py`

当前实现使用完全模拟的模型：
- `MockEncoder`: 基于音频统计特征生成假的声纹向量
- `MockSynthesizer`: 生成随机梅尔频谱图
- `MockVocoder`: 生成简单的正弦波模拟语音

**适用场景**：
- ✅ API 接口开发和测试
- ✅ 微信小程序前端联调
- ✅ 项目演示和原型验证
- ❌ **不适合**：真实的语音克隆应用

**优势**：
- 零模型文件，部署快速
- 无 GPU 需求，成本低
- 响应速度快

---

## 2. 真实模型需求

### 🎯 需要的模型组件

#### A. Encoder（声纹编码器）
- **模型**: SV2TTS Encoder (基于 GE2E)
- **大小**: ~17 MB
- **功能**: 从音频中提取 256 维声纹特征向量
- **依赖**: PyTorch, numpy

#### B. Synthesizer（频谱合成器）
- **模型**: Tacotron2 变体
- **大小**: ~370 MB
- **功能**: 根据文本和声纹生成梅尔频谱图
- **依赖**: PyTorch, numpy

#### C. Vocoder（声码器）
- **模型**: HiFi-GAN / WaveGlow
- **大小**: ~50 MB
- **功能**: 将频谱图转换为音频波形
- **依赖**: PyTorch

**总计**: 约 **437 MB**

### 🖥️ 硬件要求

| 配置项 | CPU 模式 | GPU 模式（推荐） |
|--------|----------|------------------|
| **CPU** | 4核+ | 2核+ |
| **内存** | 4GB+ | 4GB+ |
| **GPU** | - | NVIDIA GPU 4GB+ VRAM |
| **存储** | 5GB+ | 5GB+ |
| **推理速度** | 1x - 2x 实时 | 5x - 10x 实时 |

---

## 3. 模型下载方案

### 方案 A: 从官方源下载（推荐用于国外服务器）

```bash
# MockingBird 官方模型
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 创建模型目录
mkdir -p models/{encoder,synthesizer,vocoder}

# 下载模型（需要科学上网）
# Encoder
wget https://github.com/babysor/MockingBird/releases/download/v0.0.1/encoder.pt \
  -O models/encoder/encoder.pt

# Synthesizer
wget https://github.com/babysor/MockingBird/releases/download/v0.0.1/synthesizer.pt \
  -O models/synthesizer/synthesizer.pt

# Vocoder
wget https://github.com/babysor/MockingBird/releases/download/v0.0.1/vocoder.pt \
  -O models/vocoder/vocoder.pt
```

### 方案 B: 使用腾讯云 COS（推荐用于中国大陆）

**步骤**：

1. **本地下载模型**（在可以科学上网的机器上）
   ```bash
   # 从 GitHub Release 或 Google Drive 下载
   ```

2. **上传到腾讯云 COS**
   ```bash
   # 安装 COSCMD
   pip install coscmd
   
   # 配置 COSCMD
   coscmd config -a <SecretId> -s <SecretKey> \
     -b <BucketName> -r <Region>
   
   # 上传模型
   coscmd upload models/encoder/encoder.pt /models/encoder/
   coscmd upload models/synthesizer/synthesizer.pt /models/synthesizer/
   coscmd upload models/vocoder/vocoder.pt /models/vocoder/
   ```

3. **在服务器上下载**
   ```bash
   # 从 COS 下载（使用内网地址，免流量费）
   wget https://your-bucket.cos-internal.ap-guangzhou.myqcloud.com/models/encoder/encoder.pt \
     -O models/encoder/encoder.pt
   
   wget https://your-bucket.cos-internal.ap-guangzhou.myqcloud.com/models/synthesizer/synthesizer.pt \
     -O models/synthesizer/synthesizer.pt
   
   wget https://your-bucket.cos-internal.ap-guangzhou.myqcloud.com/models/vocoder/vocoder.pt \
     -O models/vocoder/vocoder.pt
   ```

### 方案 C: 打包到 Docker 镜像（不推荐）

**优点**: 部署简单，不需要单独下载
**缺点**: 
- Docker 镜像体积增大 ~500MB
- 构建时间长
- 镜像推送/拉取慢

```dockerfile
# Dockerfile
COPY models/ ./models/
```

---

## 4. 部署步骤

### Step 1: 安装真实模型依赖

更新 `requirements.txt`：

```txt
# 现有依赖...

# 真实模型所需
torch==1.13.1  # 或更高版本
torchaudio==0.13.1
librosa>=0.9.0
numba==0.56.4  # librosa 依赖
webrtcvad>=2.0.10
```

### Step 2: 下载模型文件

选择上述方案 A、B 或 C 下载模型。

### Step 3: 替换 Mock 实现

创建 `src/utils/real_model_loader.py`:

```python
"""
真实的语音克隆模型加载器
基于 MockingBird/SV2TTS
"""

import torch
import numpy as np
from pathlib import Path
from loguru import logger

class RealEncoder:
    """真实的 Encoder 模型"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        logger.info(f"Encoder 设备: {self.device}")
    
    def load_model(self, model_path: str):
        """加载预训练模型"""
        logger.info(f"加载 Encoder: {model_path}")
        
        if not Path(model_path).exists():
            raise FileNotFoundError(f"模型文件不存在: {model_path}")
        
        # 加载模型
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model = checkpoint['model']
        self.model.eval()
        
        logger.info("✓ Encoder 模型加载成功")
    
    def embed_utterance(self, audio: np.ndarray) -> np.ndarray:
        """提取声纹特征"""
        with torch.no_grad():
            # 预处理音频
            audio_tensor = torch.from_numpy(audio).float().to(self.device)
            
            # 提取特征
            embedding = self.model(audio_tensor)
            
            # 转换为 numpy
            embedding = embedding.cpu().numpy()
            
        return embedding

# 类似地实现 RealSynthesizer 和 RealVocoder
# ...
```

### Step 4: 更新配置

修改 `.env.production`:

```bash
# 模型模式
MODEL_MODE=real  # 或 mock

# 真实模型路径
MODEL_ENCODER_PATH=/app/models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=/app/models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=/app/models/vocoder/vocoder.pt

# GPU 配置
ENABLE_GPU=true  # 如果有 GPU
CUDA_VISIBLE_DEVICES=0
```

### Step 5: 修改启动逻辑

更新 `src/api/main.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

MODEL_MODE = os.getenv("MODEL_MODE", "mock")

if MODEL_MODE == "real":
    from utils.real_model_loader import load_all_models, get_encoder, get_synthesizer, get_vocoder
else:
    from utils.model_loader import load_all_models, get_encoder, get_synthesizer, get_vocoder
```

### Step 6: 重新构建和部署

```bash
# 重新构建 Docker 镜像
docker compose build

# 重启服务
docker compose up -d

# 检查日志
docker compose logs -f
```

---

## 5. 性能优化

### 🚀 优化建议

#### A. 使用 GPU 加速

如果使用腾讯云 GPU 实例：

```dockerfile
# Dockerfile
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04

# 安装 Python 和依赖
RUN apt-get update && apt-get install -y python3.8 python3-pip

# 安装 PyTorch (GPU 版本)
RUN pip3 install torch==1.13.1+cu118 -f https://download.pytorch.org/whl/torch_stable.html \
    -i https://pypi.tuna.tsinghua.edu.cn/simple
```

**docker-compose.yml** 添加 GPU 支持：

```yaml
services:
  voice-api:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### B. 模型量化（减少内存占用）

```python
# 使用 INT8 量化
model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
```

#### C. 批处理优化

```python
# 批量处理多个请求
def batch_synthesize(texts, embeddings, batch_size=8):
    results = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        batch_embeddings = embeddings[i:i+batch_size]
        batch_results = model.synthesize(batch_texts, batch_embeddings)
        results.extend(batch_results)
    return results
```

---

## 6. 成本估算

### 腾讯云 CVM 价格参考（广州区）

| 配置 | 规格 | 价格 | 适用场景 |
|------|------|------|----------|
| **基础型** | 2核4GB | ~¥80/月 | Mock 模式 |
| **标准型** | 4核8GB | ~¥280/月 | CPU 推理（轻量） |
| **计算型** | 8核16GB | ~¥560/月 | CPU 推理（高负载） |
| **GPU 型** | 4核16GB + T4 | ~¥1600/月 | GPU 推理（推荐） |

### 流量成本

- **出网流量**: ¥0.8/GB（前10GB免费）
- **每次语音合成**: 约 100KB - 500KB
- **估算**: 1000次合成 ≈ 0.5GB ≈ ¥0.4

---

## 🎯 推荐部署策略

### 阶段 1: 开发测试（当前）
- ✅ 使用 **Mock 模式**
- ✅ 部署在 **2核4GB** 基础型 CVM
- ✅ 成本低，适合前端联调

### 阶段 2: 小规模试用
- 🔸 使用 **真实模型 + CPU**
- 🔸 部署在 **4核8GB** 标准型 CVM
- 🔸 支持少量用户（<100/天）

### 阶段 3: 生产环境
- 🔹 使用 **真实模型 + GPU**
- 🔹 部署在 **GPU 实例**（T4/V100）
- 🔹 支持大量用户，低延迟

---

## 📝 快速切换命令

### 从 Mock 切换到真实模型

```bash
# 1. 下载模型（见方案 B）
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 2. 更新配置
sed -i 's/MODEL_MODE=.*/MODEL_MODE=real/' .env.production

# 3. 重新部署
docker compose down
docker compose build
docker compose up -d

# 4. 验证
curl http://localhost:8000/health
```

### 从真实模型切换回 Mock

```bash
sed -i 's/MODEL_MODE=.*/MODEL_MODE=mock/' .env.production
docker compose restart
```

---

## ❓ 常见问题

### Q1: 模型下载失败怎么办？
**A**: 使用方案 B（腾讯云 COS），提前在本地下载后上传。

### Q2: 内存不足怎么办？
**A**: 
1. 使用模型量化
2. 减少 worker 数量
3. 升级服务器内存

### Q3: GPU 推理报错？
**A**: 
1. 检查 CUDA 版本兼容性
2. 确保安装了 GPU 版本的 PyTorch
3. 检查 `nvidia-docker` 是否正确安装

### Q4: 推理速度太慢？
**A**:
1. CPU → 使用更多核心，或升级到 GPU
2. GPU → 检查批处理大小，使用 FP16 混合精度

---

## 📚 参考资源

- [MockingBird 项目](https://github.com/babysor/MockingBird)
- [SV2TTS 论文](https://arxiv.org/abs/1806.04558)
- [腾讯云 GPU 实例文档](https://cloud.tencent.com/document/product/560)
- [PyTorch 优化指南](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)

---

## ✅ 检查清单

部署真实模型前，请确认：

- [ ] 已下载所有 3 个模型文件（encoder, synthesizer, vocoder）
- [ ] 服务器内存 ≥ 4GB
- [ ] 已更新 `requirements.txt` 添加 PyTorch
- [ ] 已配置 `.env.production` 中的模型路径
- [ ] 已更新 `model_loader.py` 或创建 `real_model_loader.py`
- [ ] 已测试模型加载和推理
- [ ] 已配置监控和日志
- [ ] 已准备回滚方案（可切回 Mock 模式）

---

**文档版本**: v1.0  
**最后更新**: 2026-02-03  
**维护者**: Voice Cloning Team
