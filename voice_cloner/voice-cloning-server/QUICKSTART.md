# 语音克隆 API 服务器 - 快速开始指南

## 📋 简介

这是一个用于语音克隆的 FastAPI 后端服务器。

**当前模式**: Mock（模拟）- 用于开发和测试
- ✅ 完整的 API 接口实现
- ✅ 音频处理和验证
- ✅ 模拟的声纹提取和语音合成
- ⚠️ 不需要真实的 AI 模型文件
- ⚠️ 生成的音频是模拟数据（简单正弦波）

## 🚀 快速开始（5分钟）

### 1. 安装依赖

```bash
# 给脚本添加执行权限
chmod +x install.sh start_server.sh

# 运行安装脚本
./install.sh
```

这将：
- ✅ 检查 Python 版本（需要 3.8+）
- ✅ （可选）创建虚拟环境
- ✅ 安装所有依赖包
- ✅ 创建必要的目录结构
- ✅ 创建环境配置文件

### 2. 启动服务器

```bash
./start_server.sh
```

服务器将在 `http://localhost:8000` 启动

### 3. 测试 API

打开新终端，运行测试脚本：

```bash
python test_api.py
```

或者访问 API 文档：
```
http://localhost:8000/docs
```

## 📖 详细步骤

### 手动安装（如果脚本无法运行）

```bash
# 1. 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 2. 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 3. 创建目录
mkdir -p models/encoder models/synthesizer models/vocoder logs

# 4. 创建 __init__.py 文件
touch src/__init__.py
touch src/api/__init__.py
touch src/utils/__init__.py
touch src/encoder/__init__.py
touch src/synthesizer/__init__.py
touch src/vocoder/__init__.py

# 5. 复制环境配置
cp .env.example .env

# 6. 编辑 .env 文件（可选）
nano .env
```

### 手动启动服务器

```bash
# 方式 1: 使用脚本中的主程序
cd src/api
python main.py

# 方式 2: 使用 uvicorn
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# 方式 3: 指定日志级别
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --log-level info
```

## 🔧 配置

编辑 `.env` 文件：

```bash
# API 服务器配置
API_HOST=0.0.0.0
API_PORT=8000

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/api.log

# 模型路径（Mock 模式下不需要）
MODEL_ENCODER_PATH=models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=models/vocoder/vocoder.pt
```

## 📡 API 接口

### 1. 健康检查

```bash
curl http://localhost:8000/health
```

响应：
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0",
  "mode": "mock"
}
```

### 2. 提取声纹特征

```bash
curl -X POST http://localhost:8000/api/v1/extract-embedding \
  -F "audio=@test_audio.wav"
```

响应：
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "dimension": 256
}
```

### 3. 语音克隆

```bash
curl -X POST http://localhost:8000/api/v1/clone-voice \
  -F "audio=@reference.wav" \
  -F "text=你好，这是测试文本" \
  -o output.wav
```

### 4. 使用声纹合成

```bash
curl -X POST http://localhost:8000/api/v1/synthesize-with-embedding \
  -F "embedding=[0.1,0.2,...]" \
  -F "text=要合成的文本" \
  -o synthesized.wav
```

## 🧪 测试

### 自动化测试

```bash
python test_api.py
```

这将测试所有API接口并显示结果。

### 手动测试

#### 1. 测试健康检查

```bash
curl http://localhost:8000/health | jq
```

#### 2. 测试声纹提取

创建测试音频：
```bash
# 使用 Python 创建测试音频
python3 << EOF
import numpy as np
import soundfile as sf

sr = 16000
duration = 2
t = np.linspace(0, duration, int(sr * duration))
audio = np.sin(2 * np.pi * 440 * t) * 0.5
sf.write('test_audio.wav', audio, sr)
print("✓ 测试音频已创建: test_audio.wav")
EOF

# 测试 API
curl -X POST http://localhost:8000/api/v1/extract-embedding \
  -F "audio=@test_audio.wav" | jq
```

#### 3. 测试语音克隆

```bash
curl -X POST http://localhost:8000/api/v1/clone-voice \
  -F "audio=@test_audio.wav" \
  -F "text=你好世界" \
  -o cloned.wav

# 播放生成的音频（Mac）
afplay cloned.wav

# 播放生成的音频（Linux）
aplay cloned.wav
```

## 📊 目录结构

```
voice-cloning-server/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py           # FastAPI 主应用
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── audio_utils.py    # 音频处理工具
│   │   └── model_loader.py   # 模型加载（Mock）
│   ├── encoder/              # Encoder 模块（占位）
│   ├── synthesizer/          # Synthesizer 模块（占位）
│   └── vocoder/              # Vocoder 模块（占位）
├── models/                   # 模型文件目录
│   ├── encoder/
│   ├── synthesizer/
│   └── vocoder/
├── logs/                     # 日志文件
├── requirements.txt          # Python 依赖
├── .env                      # 环境配置
├── .env.example              # 环境配置模板
├── Dockerfile                # Docker 配置
├── install.sh                # 安装脚本
├── start_server.sh           # 启动脚本
├── test_api.py               # 测试脚本
└── README.md                 # 本文档
```

## 🐛 故障排查

### 问题 1: 端口被占用

```
ERROR:    [Errno 48] Address already in use
```

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8000

# 杀死进程
kill -9 <PID>

# 或者使用不同端口
API_PORT=8001 ./start_server.sh
```

### 问题 2: 依赖安装失败

```
ERROR: Could not find a version that satisfies the requirement...
```

**解决**:
```bash
# 升级 pip
pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或者使用阿里云镜像
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

### 问题 3: ModuleNotFoundError

```
ModuleNotFoundError: No module named 'xxx'
```

**解决**:
```bash
# 确保在正确的目录
pwd  # 应该在 voice-cloning-server 目录

# 确保虚拟环境已激活
source venv/bin/activate

# 重新安装依赖
pip install -r requirements.txt

# 创建 __init__.py 文件
find src -type d -exec touch {}/__init__.py \;
```

### 问题 4: 测试脚本失败

```
Connection refused
```

**解决**:
1. 确保服务器正在运行
2. 检查端口号是否正确
3. 检查防火墙设置

## 🔄 从 Mock 模式升级到真实模型

当您准备好使用真实的 AI 模型时：

1. **下载模型文件**
   - SV2TTS Encoder
   - SV2TTS Synthesizer
   - HiFi-GAN Vocoder

2. **放置模型文件**
   ```
   models/
   ├── encoder/
   │   └── encoder.pt
   ├── synthesizer/
   │   └── synthesizer.pt
   └── vocoder/
       └── vocoder.pt
   ```

3. **替换模型加载代码**
   - 修改 `src/utils/model_loader.py`
   - 使用真实的模型加载和推理代码
   - 参考 MockingBird 或 Real-Time-Voice-Cloning 项目

4. **重启服务器**
   ```bash
   ./start_server.sh
   ```

## 📚 相关资源

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [MockingBird 项目](https://github.com/babysor/MockingBird)
- [Real-Time-Voice-Cloning](https://github.com/CorentinJ/Real-Time-Voice-Cloning)
- [部署指南](../../DEPLOYMENT_GUIDE.md)

## 📞 需要帮助？

如果遇到问题：
1. 查看日志文件 `logs/api.log`
2. 运行测试脚本诊断问题
3. 查看部署指南的故障排查部分

---

**当前状态**: Mock 模式 - 完全功能正常，可用于开发和测试！✅
