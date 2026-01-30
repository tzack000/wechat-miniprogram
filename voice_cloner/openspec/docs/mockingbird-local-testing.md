# MockingBird 本地测试指南

## 环境要求

- Python 3.8 或 3.9
- pip
- Git
- 至少 8GB 内存
- 20GB 磁盘空间（用于模型）
- （可选）NVIDIA GPU with CUDA

## 安装步骤

### 1. 克隆项目

```bash
cd ~/Documents/code
git clone https://github.com/babysor/MockingBird.git
cd MockingBird
```

### 2. 创建虚拟环境

```bash
# 使用 venv
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 或使用 conda
conda create -n mockingbird python=3.8
conda activate mockingbird
```

### 3. 安装依赖

```bash
# 基础依赖
pip install -r requirements.txt

# 如果有GPU（CUDA 11.x）
pip install torch==1.9.0+cu111 torchvision==0.10.0+cu111 torchaudio==0.9.0 -f https://download.pytorch.org/whl/torch_stable.html

# 如果只用CPU（macOS）
pip install torch==1.9.0 torchvision==0.10.0 torchaudio==0.9.0
```

### 4. 下载预训练模型

创建模型下载脚本：

```bash
mkdir -p models/encoder
mkdir -p models/synthesizer
mkdir -p models/vocoder

# 下载编码器模型（声纹提取）
curl -L -o models/encoder/encoder.pt \
  https://github.com/babysor/MockingBird/releases/download/v0.0.1/encoder.pt

# 下载合成器模型（梅尔频谱生成）
curl -L -o models/synthesizer/synthesizer.pt \
  https://github.com/babysor/MockingBird/releases/download/v0.0.1/synthesizer.pt

# 下载声码器模型（音频生成）
curl -L -o models/vocoder/vocoder.pt \
  https://github.com/babysor/MockingBird/releases/download/v0.0.1/vocoder.pt
```

注意：如果下载链接失效，请访问项目 Release 页面获取最新链接。

## 快速测试

### 测试1：运行Web界面

```bash
# 启动Web UI
python web.py

# 打开浏览器访问
# http://localhost:8080
```

在Web界面中：
1. 上传一段5-30秒的录音
2. 输入要合成的文本
3. 点击"合成"
4. 等待生成结果

### 测试2：运行命令行脚本

创建测试脚本 `test_inference.py`：

```python
import torch
from encoder import inference as encoder
from synthesizer.inference import Synthesizer
from vocoder import inference as vocoder
import librosa
import soundfile as sf
import numpy as np

# 配置
ENCODER_PATH = "models/encoder/encoder.pt"
SYNTHESIZER_PATH = "models/synthesizer/synthesizer.pt"
VOCODER_PATH = "models/vocoder/vocoder.pt"

def test_voice_cloning(audio_path, text):
    """
    测试语音克隆
    """
    print("=== 开始测试语音克隆 ===")
    
    # 1. 加载模型
    print("1. 加载模型...")
    encoder.load_model(ENCODER_PATH)
    synthesizer = Synthesizer(SYNTHESIZER_PATH)
    vocoder.load_model(VOCODER_PATH)
    print("✓ 模型加载完成")
    
    # 2. 加载录音
    print(f"2. 加载录音: {audio_path}")
    audio, sr = librosa.load(audio_path, sr=16000)
    print(f"✓ 录音加载完成，时长: {len(audio)/sr:.2f}秒")
    
    # 3. 提取声纹特征
    print("3. 提取声纹特征...")
    embed = encoder.embed_utterance(audio)
    print(f"✓ 声纹特征提取完成，维度: {embed.shape}")
    
    # 4. 合成梅尔频谱
    print(f"4. 合成梅尔频谱: {text}")
    specs = synthesizer.synthesize_spectrograms([text], [embed])
    spec = specs[0]
    print(f"✓ 梅尔频谱生成完成，形状: {spec.shape}")
    
    # 5. 生成音频
    print("5. 生成音频...")
    generated_audio = vocoder.infer_waveform(spec)
    print(f"✓ 音频生成完成，长度: {len(generated_audio)}")
    
    # 6. 保存结果
    output_path = "output_test.wav"
    sf.write(output_path, generated_audio, 16000)
    print(f"✓ 音频已保存: {output_path}")
    
    print("=== 测试完成 ===")
    return output_path

if __name__ == "__main__":
    # 测试参数
    test_audio = "test_samples/sample.wav"  # 替换为你的测试音频
    test_text = "今天天气真不错，我们一起去公园散步吧。"
    
    try:
        output = test_voice_cloning(test_audio, test_text)
        print(f"\n成功！生成的音频保存在: {output}")
    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()
```

运行测试：

```bash
# 准备测试音频（或使用自己的录音）
mkdir -p test_samples

# 运行测试
python test_inference.py
```

## 性能测试

创建性能测试脚本 `benchmark.py`：

```python
import time
import torch
import psutil
import os
from test_inference import test_voice_cloning

def benchmark():
    """
    性能基准测试
    """
    print("=== 性能测试开始 ===\n")
    
    # 系统信息
    print("系统信息:")
    print(f"  CPU: {psutil.cpu_count()} cores")
    print(f"  内存: {psutil.virtual_memory().total / (1024**3):.1f} GB")
    print(f"  GPU: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"  GPU型号: {torch.cuda.get_device_name(0)}")
    print()
    
    # 测试用例
    test_cases = [
        ("短句", "今天天气很好。", 5),
        ("中句", "今天天气真不错，我们一起去公园散步吧。", 10),
        ("长句", "在这个美好的春天里，阳光明媚，鸟语花香，我们一起去公园散步，享受大自然的美好时光。", 20)
    ]
    
    test_audio = "test_samples/sample.wav"
    
    for name, text, expected_len in test_cases:
        print(f"测试 [{name}]: {text}")
        
        # 记录开始时间和内存
        start_time = time.time()
        start_mem = psutil.Process(os.getpid()).memory_info().rss / (1024**2)
        
        try:
            # 执行合成
            output = test_voice_cloning(test_audio, text)
            
            # 记录结束时间和内存
            end_time = time.time()
            end_mem = psutil.Process(os.getpid()).memory_info().rss / (1024**2)
            
            elapsed = end_time - start_time
            mem_used = end_mem - start_mem
            
            print(f"  ✓ 耗时: {elapsed:.2f}秒")
            print(f"  ✓ 内存增量: {mem_used:.1f} MB")
            print(f"  ✓ RTF: {elapsed/expected_len:.2f}x")
            print()
            
        except Exception as e:
            print(f"  ✗ 失败: {e}\n")
    
    print("=== 性能测试完成 ===")

if __name__ == "__main__":
    benchmark()
```

## 测试清单

### 功能测试
- [ ] 模型加载成功
- [ ] 声纹提取正常
- [ ] 梅尔频谱生成正常
- [ ] 音频合成正常
- [ ] 输出音频可播放

### 质量测试
- [ ] 音色相似度（主观评价 1-10分）
- [ ] 音质清晰度（主观评价 1-10分）
- [ ] 发音准确度（识别错误字数）
- [ ] 自然度（是否有机械感）

### 性能测试
- [ ] 短句合成时间 < 10秒
- [ ] 中句合成时间 < 20秒
- [ ] 长句合成时间 < 40秒
- [ ] 内存使用 < 4GB
- [ ] CPU使用率

## 常见问题

### Q1: 模型下载失败
**解决方案**:
1. 使用VPN或代理
2. 从国内镜像下载
3. 手动下载后放到正确目录

### Q2: 依赖安装失败
**解决方案**:
```bash
# 升级pip
pip install --upgrade pip

# 使用国内源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q3: 音频无法加载
**解决方案**:
```bash
# 安装额外的音频处理库
pip install ffmpeg-python
brew install ffmpeg  # macOS
```

### Q4: 内存不足
**解决方案**:
- 减小batch size
- 使用较短的录音（5-10秒）
- 升级系统内存

### Q5: 生成的音频有噪音
**解决方案**:
- 使用更高质量的输入录音
- 确保录音是单声道16kHz WAV
- 调整vocoder参数

## 测试报告模板

```markdown
# MockingBird 测试报告

## 测试环境
- 操作系统: macOS 13.0 / Ubuntu 20.04 / Windows 11
- Python版本: 3.8.10
- CPU: Apple M1 / Intel i7 / AMD Ryzen
- 内存: 16GB
- GPU: None / NVIDIA RTX 3060

## 测试结果

### 功能测试
| 项目 | 结果 | 备注 |
|-----|------|-----|
| 模型加载 | ✓ | 3.2秒 |
| 声纹提取 | ✓ | 0.5秒 |
| 频谱合成 | ✓ | 8.3秒 |
| 音频生成 | ✓ | 2.1秒 |

### 性能测试
| 句子长度 | 耗时 | RTF |
|---------|------|-----|
| 短句(5秒) | 12.3秒 | 2.46x |
| 中句(10秒) | 18.7秒 | 1.87x |
| 长句(20秒) | 35.2秒 | 1.76x |

### 质量评价
- 音色相似度: 7/10
- 音质清晰度: 6/10
- 发音准确度: 8/10
- 自然度: 6/10

## 结论
- 模型可用于MVP开发
- 建议使用GPU加速
- 音质需要进一步优化
```

## 下一步

测试完成后：
1. 记录测试结果
2. 准备模型部署
3. 设计API接口
4. 集成到小程序后端
