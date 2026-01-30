# Python环境和模型依赖准备

## 概述

本文档说明如何准备语音克隆服务所需的Python环境、模型文件和依赖库。

## 目录结构

```
voice-cloning-server/
├── models/                      # 模型文件
│   ├── encoder/
│   │   └── encoder.pt          # 声纹编码器 (~17MB)
│   ├── synthesizer/
│   │   └── synthesizer.pt      # 梅尔频谱合成器 (~370MB)
│   └── vocoder/
│       └── vocoder.pt          # 声码器 (~54MB)
├── src/                         # 源代码
│   ├── api/                     # API服务
│   ├── encoder/                 # 编码器模块
│   ├── synthesizer/             # 合成器模块
│   └── vocoder/                 # 声码器模块
├── tests/                       # 测试脚本
├── requirements.txt             # Python依赖
├── Dockerfile                   # Docker配置
└── README.md
```

## Python环境准备

### 方式1: 使用 venv（推荐用于开发）

```bash
# 创建项目目录
mkdir -p voice-cloning-server
cd voice-cloning-server

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 升级pip
pip install --upgrade pip
```

### 方式2: 使用 conda（推荐用于数据科学）

```bash
# 创建conda环境
conda create -n voice-cloning python=3.8

# 激活环境
conda activate voice-cloning

# 安装基础包
conda install numpy scipy
```

### 方式3: 使用 Docker（推荐用于部署）

见"Docker部署"章节。

## 依赖安装

### requirements.txt

创建 `requirements.txt` 文件：

```txt
# 深度学习框架
torch==1.9.0
torchaudio==0.9.0

# 音频处理
librosa==0.9.1
soundfile==0.10.3.post1
scipy==1.7.3
numpy==1.21.0
resampy==0.2.2

# Web框架
fastapi==0.68.0
uvicorn[standard]==0.15.0
python-multipart==0.0.5

# 工具库
pydantic==1.8.2
python-dotenv==0.19.0
loguru==0.5.3

# 文本处理
pypinyin==0.44.0
jieba==0.42.1

# 其他
matplotlib==3.4.3
Pillow==8.3.2
tqdm==4.62.3
```

### 安装命令

```bash
# 基础安装
pip install -r requirements.txt

# 如果使用GPU（CUDA 11.x）
pip install torch==1.9.0+cu111 torchaudio==0.9.0 -f https://download.pytorch.org/whl/torch_stable.html

# 如果只用CPU
pip install torch==1.9.0 torchaudio==0.9.0

# 国内镜像（加速）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 模型文件准备

### 下载预训练模型

#### 选项1: 使用脚本自动下载

创建 `download_models.sh`:

```bash
#!/bin/bash

echo "开始下载模型文件..."

# 创建目录
mkdir -p models/encoder models/synthesizer models/vocoder

# MockingBird 中文模型
BASE_URL="https://github.com/babysor/MockingBird/releases/download/v0.0.1"

# 下载编码器
echo "下载编码器模型..."
wget -O models/encoder/encoder.pt "${BASE_URL}/encoder.pt"

# 下载合成器
echo "下载合成器模型..."
wget -O models/synthesizer/synthesizer.pt "${BASE_URL}/synthesizer.pt"

# 下载声码器
echo "下载声码器模型..."
wget -O models/vocoder/vocoder.pt "${BASE_URL}/vocoder.pt"

echo "模型下载完成！"
```

运行：
```bash
chmod +x download_models.sh
./download_models.sh
```

#### 选项2: 手动下载

访问以下链接手动下载：

1. **Encoder** (声纹编码器)
   - URL: https://github.com/babysor/MockingBird/releases
   - 文件名: encoder.pt
   - 大小: ~17MB
   - 放置位置: `models/encoder/encoder.pt`

2. **Synthesizer** (梅尔频谱合成器)
   - URL: https://github.com/babysor/MockingBird/releases
   - 文件名: synthesizer.pt
   - 大小: ~370MB
   - 放置位置: `models/synthesizer/synthesizer.pt`

3. **Vocoder** (声码器)
   - URL: https://github.com/babysor/MockingBird/releases
   - 文件名: vocoder.pt
   - 大小: ~54MB
   - 放置位置: `models/vocoder/vocoder.pt`

#### 选项3: 使用百度网盘（国内用户）

如果GitHub下载慢，可以从以下网盘下载：
- 链接：见项目README
- 提取码：见项目README

### 验证模型文件

```python
# verify_models.py
import os
import torch

def verify_models():
    """验证模型文件是否正确"""
    
    models = {
        'encoder': 'models/encoder/encoder.pt',
        'synthesizer': 'models/synthesizer/synthesizer.pt',
        'vocoder': 'models/vocoder/vocoder.pt'
    }
    
    print("检查模型文件...\n")
    
    all_ok = True
    for name, path in models.items():
        if not os.path.exists(path):
            print(f"✗ {name}: 文件不存在 ({path})")
            all_ok = False
            continue
        
        try:
            # 尝试加载模型
            checkpoint = torch.load(path, map_location='cpu')
            size_mb = os.path.getsize(path) / (1024 * 1024)
            print(f"✓ {name}: OK ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"✗ {name}: 加载失败 ({e})")
            all_ok = False
    
    print()
    if all_ok:
        print("所有模型文件验证通过！")
        return True
    else:
        print("部分模型文件有问题，请重新下载。")
        return False

if __name__ == "__main__":
    verify_models()
```

运行验证：
```bash
python verify_models.py
```

## 源代码准备

### 从MockingBird提取核心代码

```bash
# 克隆MockingBird项目
git clone https://github.com/babysor/MockingBird.git temp_mockingbird

# 复制核心模块
cp -r temp_mockingbird/encoder src/
cp -r temp_mockingbird/synthesizer src/
cp -r temp_mockingbird/vocoder src/

# 删除临时目录
rm -rf temp_mockingbird
```

### 或者使用子模块

```bash
# 添加为git子模块
git submodule add https://github.com/babysor/MockingBird.git lib/MockingBird
git submodule update --init --recursive
```

## Docker环境准备

### Dockerfile

```dockerfile
FROM python:3.8-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt \
    -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制应用代码
COPY src/ ./src/
COPY models/ ./models/

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  voice-cloning-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs
    environment:
      - PYTHONUNBUFFERED=1
      - MODEL_PATH=/app/models
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 构建和运行

```bash
# 构建镜像
docker build -t voice-cloning-server .

# 运行容器
docker run -p 8000:8000 -v $(pwd)/models:/app/models voice-cloning-server

# 或使用docker-compose
docker-compose up -d
```

## 环境变量配置

创建 `.env` 文件：

```env
# 模型路径
MODEL_ENCODER_PATH=models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=models/vocoder/vocoder.pt

# 服务配置
API_HOST=0.0.0.0
API_PORT=8000
WORKERS=4

# 性能配置
USE_GPU=false
BATCH_SIZE=1
MAX_AUDIO_LENGTH=300

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/voice-cloning.log

# 安全配置
API_KEY=your-secret-api-key
ALLOWED_ORIGINS=*
```

## 依赖版本兼容性

### PyTorch版本选择

| Python | PyTorch | CUDA | 推荐场景 |
|--------|---------|------|---------|
| 3.8 | 1.9.0 | 11.1 | 最稳定 ✓ |
| 3.9 | 1.10.0 | 11.3 | 新特性 |
| 3.7 | 1.8.0 | 10.2 | 旧系统 |

### 音频库版本

- `librosa >= 0.9.0`: 音频加载和处理
- `soundfile >= 0.10.0`: 音频文件读写
- `resampy >= 0.2.0`: 音频重采样

## 性能优化建议

### CPU优化

```bash
# 安装Intel MKL加速
pip install intel-extension-for-pytorch
```

### GPU优化

```bash
# 确保CUDA版本匹配
nvidia-smi  # 查看CUDA版本

# 安装对应版本的PyTorch
pip install torch==1.9.0+cu111 -f https://download.pytorch.org/whl/torch_stable.html
```

### 内存优化

```python
# 在代码中添加
import torch
torch.set_num_threads(4)  # 限制线程数
```

## 故障排查

### 常见问题

1. **ImportError: No module named 'torch'**
   ```bash
   pip install torch torchaudio
   ```

2. **OSError: cannot load library 'libsndfile.so'**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libsndfile1
   
   # macOS
   brew install libsndfile
   ```

3. **CUDA out of memory**
   - 减小batch size
   - 使用CPU模式
   - 增加GPU显存

4. **模型加载失败**
   - 检查文件路径
   - 验证文件完整性
   - 重新下载模型

## 验证安装

运行完整验证脚本：

```python
# validate_setup.py
import sys
import torch
import librosa
import soundfile

def validate_setup():
    print("=== 环境验证 ===\n")
    
    # Python版本
    print(f"Python: {sys.version}")
    
    # PyTorch
    print(f"PyTorch: {torch.__version__}")
    print(f"CUDA可用: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA版本: {torch.version.cuda}")
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # 音频库
    print(f"librosa: {librosa.__version__}")
    print(f"soundfile: {soundfile.__version__}")
    
    # 模型文件
    import os
    models = ['models/encoder/encoder.pt', 
              'models/synthesizer/synthesizer.pt',
              'models/vocoder/vocoder.pt']
    
    print("\n模型文件:")
    for model in models:
        exists = "✓" if os.path.exists(model) else "✗"
        print(f"  {exists} {model}")
    
    print("\n=== 验证完成 ===")

if __name__ == "__main__":
    validate_setup()
```

```bash
python validate_setup.py
```

## 下一步

环境准备完成后：
1. 运行本地测试
2. 部署到云服务器
3. 实现API接口
4. 集成到小程序
