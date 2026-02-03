# 语音克隆API服务器

FastAPI-based voice cloning API server using MockingBird models.

## ⚠️ 重要说明

本项目支持**两种模式**：

### 🧪 Mock 模式（当前默认）
- **用途**：开发测试、API 接口联调、原型演示
- **特点**：
  - ✅ 无需下载模型文件
  - ✅ 低资源占用（2核4GB 即可）
  - ✅ 快速部署和响应
  - ❌ 生成假数据（正弦波音频）
  - ❌ **不能用于真实的语音克隆**

### 🎯 真实模型模式
- **用途**：生产环境、真实的语音克隆应用
- **特点**：
  - ✅ 高质量语音合成
  - ✅ 真实的声音克隆效果
  - ⚠️ 需要下载模型文件（~437MB）
  - ⚠️ 需要较多资源（4GB+ RAM，推荐 GPU）
  - ⚠️ 推理速度较慢（CPU 模式）

**📖 详细说明请参考**: [REAL_MODEL_DEPLOYMENT.md](./REAL_MODEL_DEPLOYMENT.md)

---

## 功能

- 声纹特征提取（Encoder）
- 文本转梅尔频谱（Synthesizer）
- 频谱转音频（Vocoder）
- 端到端语音克隆
- 批量语音合成

## 快速开始

### 方式一：Docker 部署（推荐）

#### Mock 模式（快速测试）

```bash
# 一键部署（使用 Mock 模式）
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server && 
  git pull && 
  chmod +x install_docker_china.sh && 
  sudo ./install_docker_china.sh && 
  echo "" && 
  echo "配置 API_KEY..." && 
  API_KEY=$(openssl rand -base64 32) && 
  sed -i "s|API_KEY=.*|API_KEY=$API_KEY|" .env.production && 
  echo "API_KEY: $API_KEY" && 
  echo "" && 
  echo "开始构建和部署..." && 
  docker compose build && 
  docker compose up -d && 
  sleep 15 && 
  echo "" && 
  echo "服务状态:" && 
  docker compose ps && 
  echo "" && 
  echo "健康检查:" && 
  curl http://localhost:8000/health
```

#### 真实模型模式（生产环境）

```bash
# 1. 下载模型文件（需要先配置 COS 地址）
./download_models_from_cos.sh

# 2. 切换到真实模型模式
./switch_model_mode.sh real

# 3. 重新构建和部署
docker compose build
docker compose up -d
```

#### 模式切换

```bash
# 切换到 Mock 模式
./switch_model_mode.sh mock

# 切换到真实模型模式
./switch_model_mode.sh real
```

### 方式二：本地开发

### 1. 安装依赖

```bash
cd voice-cloning-server
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp .env.production .env

# 编辑配置
vim .env
```

### 3. （可选）下载模型

如果使用真实模型：

```bash
# 选项 A: 从 COS 下载
./download_models_from_cos.sh

# 选项 B: 手动下载并放置到 models/ 目录
# models/encoder/encoder.pt
# models/synthesizer/synthesizer.pt
# models/vocoder/vocoder.pt
```

### 4. 启动服务

```bash
# 开发模式
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 访问文档

打开浏览器访问：http://localhost:8000/docs

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目概述和快速开始（本文档） |
| [REAL_MODEL_DEPLOYMENT.md](./REAL_MODEL_DEPLOYMENT.md) | 真实模型部署详细指南 ⭐ |
| [SECURITY_GROUP_GUIDE.md](./SECURITY_GROUP_GUIDE.md) | 腾讯云安全组配置指南 |
| [DEPLOYMENT_CONSTRAINTS.md](../DEPLOYMENT_CONSTRAINTS.md) | 中国大陆部署约束说明 |

## 🛠️ 实用脚本

| 脚本 | 用途 |
|------|------|
| `install_docker_china.sh` | Docker 安装（中国镜像源） |
| `download_models_from_cos.sh` | 从腾讯云 COS 下载模型 |
| `switch_model_mode.sh` | Mock/真实模型快速切换 |
| `test_external_access.sh` | 外网访问测试 |

## API接口

### 1. 健康检查

```bash
GET /health
```

### 2. 提取声纹特征

```bash
POST /api/v1/extract-embedding
Content-Type: multipart/form-data

audio: <audio file>
```

响应：
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "dimension": 256
}
```

### 3. 语音克隆（端到端）

```bash
POST /api/v1/clone-voice
Content-Type: multipart/form-data

audio: <reference audio file>
text: "要合成的文本"
```

响应：音频文件（audio/wav）

### 4. 批量合成

```bash
POST /api/v1/batch-synthesize
Content-Type: application/json

{
  "embedding": [0.123, 0.456, ...],
  "texts": ["文本1", "文本2", "文本3"]
}
```

## Docker部署

### 使用 docker-compose（推荐）

```bash
# Mock 模式（默认）
docker compose up -d

# 真实模型模式（需先下载模型）
# 1. 确保模型文件在 models/ 目录
# 2. 设置 MODEL_MODE=real in .env.production
# 3. 构建和启动
docker compose build
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 手动 Docker 部署

```bash
# 构建镜像
docker build -t voice-cloning-api .

# Mock 模式运行
docker run -p 8000:8000 voice-cloning-api

# 真实模型模式运行（挂载模型目录）
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  -e MODEL_MODE=real \
  voice-cloning-api
```

## 🔧 配置说明

### 环境变量

在 `.env.production` 中配置：

```bash
# 模型模式
MODEL_MODE=mock  # 或 real

# API 服务器配置
API_HOST=0.0.0.0
API_PORT=8000

# 模型路径（真实模型模式）
MODEL_ENCODER_PATH=models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=models/vocoder/vocoder.pt

# GPU 配置（如果有）
ENABLE_GPU=false  # 或 true
CUDA_VISIBLE_DEVICES=0

# 安全配置
API_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com

# 性能配置
MAX_WORKERS=4
LOG_LEVEL=INFO
```

## 项目结构

```
voice-cloning-server/
├── src/
│   ├── api/            # API路由和控制器
│   ├── encoder/        # 声纹编码器
│   ├── synthesizer/    # 梅尔频谱合成器
│   ├── vocoder/        # 声码器
│   └── utils/          # 工具函数
├── models/             # 模型文件
├── tests/              # 测试
├── logs/               # 日志
├── requirements.txt
├── Dockerfile
└── README.md
```

## 开发

```bash
# 运行测试
pytest tests/

# 代码格式化
black src/

# 类型检查
mypy src/
```

## 许可证

MIT
