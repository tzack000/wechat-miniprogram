# 语音克隆API服务器

FastAPI-based voice cloning API server using MockingBird models.

## 功能

- 声纹特征提取（Encoder）
- 文本转梅尔频谱（Synthesizer）
- 频谱转音频（Vocoder）
- 端到端语音克隆

## 快速开始

### 1. 安装依赖

```bash
cd voice-cloning-server
pip install -r requirements.txt
```

### 2. 下载模型

```bash
./download_models.sh
```

### 3. 启动服务

```bash
# 开发模式
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 访问文档

打开浏览器访问：http://localhost:8000/docs

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

```bash
# 构建镜像
docker build -t voice-cloning-api .

# 运行容器
docker run -p 8000:8000 -v $(pwd)/models:/app/models voice-cloning-api
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
