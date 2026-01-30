# 云服务器部署指南

## 概述

本文档说明如何将语音克隆服务部署到云服务器（阿里云、腾讯云、AWS等）。

## 部署架构

```
用户(小程序) → 云函数 → API服务器(Docker) → MockingBird模型
                ↓
            云数据库
```

## 服务器选择

### 推荐配置

| 方案 | CPU | 内存 | GPU | 磁盘 | 成本/月 | 适用场景 |
|------|-----|------|-----|------|---------|---------|
| 基础 | 4核 | 8GB | 无 | 40GB | ¥200 | 测试/小规模 |
| 标准 | 8核 | 16GB | T4 | 100GB | ¥800 | 生产环境 |
| 高配 | 16核 | 32GB | V100 | 200GB | ¥2000+ | 高并发 |

### 云厂商对比

| 厂商 | GPU实例 | 价格优势 | 网络 | 推荐度 |
|------|---------|---------|------|--------|
| 阿里云 | ECS GPU | 中等 | 国内快 | ⭐⭐⭐⭐⭐ |
| 腾讯云 | CVM GPU | 较低 | 国内快 | ⭐⭐⭐⭐⭐ |
| AWS | EC2 P3 | 较高 | 全球好 | ⭐⭐⭐⭐ |
| Google Cloud | Compute Engine | 中等 | 全球好 | ⭐⭐⭐⭐ |

## 部署步骤

### 方案1: Docker部署（推荐）

#### 1.1 准备服务器

```bash
# 购买云服务器（Ubuntu 20.04）
# 配置安全组：开放 8000 端口

# SSH登录
ssh root@your-server-ip
```

#### 1.2 安装Docker

```bash
# 更新系统
apt-get update
apt-get upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker服务
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
```

#### 1.3 安装Docker Compose

```bash
# 下载Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 1.4 部署应用

```bash
# 创建项目目录
mkdir -p /opt/voice-cloning
cd /opt/voice-cloning

# 上传项目文件（使用 scp 或 git clone）
# 方式1: git clone
git clone https://your-repo/voice-cloning-server.git .

# 方式2: scp上传
# 本地执行: scp -r voice-cloning-server/* root@your-server-ip:/opt/voice-cloning/

# 下载模型文件
mkdir -p models/{encoder,synthesizer,vocoder}
# ... 手动上传模型或使用下载脚本

# 配置环境变量
cp .env.example .env
nano .env  # 修改配置

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 1.5 配置Nginx反向代理

```bash
# 安装Nginx
apt-get install nginx -y

# 配置反向代理
cat > /etc/nginx/sites-available/voice-cloning <<'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（语音合成可能需要较长时间）
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/voice-cloning /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 1.6 配置SSL证书（可选但推荐）

```bash
# 安装certbot
apt-get install certbot python3-certbot-nginx -y

# 申请证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 方案2: 直接部署（不使用Docker）

#### 2.1 安装Python环境

```bash
# 安装Python 3.8
apt-get install python3.8 python3.8-venv python3.8-dev -y

# 创建虚拟环境
python3.8 -m venv /opt/voice-cloning/venv
source /opt/voice-cloning/venv/bin/activate
```

#### 2.2 安装依赖

```bash
cd /opt/voice-cloning
pip install -r requirements.txt
```

#### 2.3 下载模型

```bash
./download_models.sh
```

#### 2.4 配置系统服务

```bash
# 创建systemd服务
cat > /etc/systemd/system/voice-cloning.service <<'EOF'
[Unit]
Description=Voice Cloning API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/voice-cloning
Environment="PATH=/opt/voice-cloning/venv/bin"
ExecStart=/opt/voice-cloning/venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl start voice-cloning
systemctl enable voice-cloning

# 查看状态
systemctl status voice-cloning
```

### 方案3: 使用GPU加速

#### 3.1 安装NVIDIA驱动

```bash
# 检查GPU
lspci | grep -i nvidia

# 安装驱动
apt-get install nvidia-driver-470 -y

# 重启
reboot

# 验证安装
nvidia-smi
```

#### 3.2 安装NVIDIA Docker

```bash
# 添加NVIDIA Docker仓库
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list

# 安装nvidia-docker2
apt-get update
apt-get install -y nvidia-docker2

# 重启Docker
systemctl restart docker

# 测试
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

#### 3.3 修改docker-compose.yml

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
      - USE_GPU=true
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 性能优化

### 1. 使用Redis缓存

```bash
# 安装Redis
apt-get install redis-server -y

# 修改配置
nano /etc/redis/redis.conf
# 设置: maxmemory 2gb
# 设置: maxmemory-policy allkeys-lru

# 重启Redis
systemctl restart redis
```

在代码中添加缓存：

```python
import redis
import hashlib

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_embedding(audio_hash):
    """从缓存获取声纹"""
    return redis_client.get(f"embedding:{audio_hash}")

def cache_embedding(audio_hash, embedding):
    """缓存声纹（24小时）"""
    redis_client.setex(
        f"embedding:{audio_hash}",
        86400,  # 24小时
        embedding.tobytes()
    )
```

### 2. 使用任务队列

```bash
# 安装RabbitMQ
apt-get install rabbitmq-server -y
systemctl start rabbitmq-server
```

使用Celery处理异步任务：

```python
from celery import Celery

celery_app = Celery('voice_cloning', broker='amqp://localhost')

@celery_app.task
def synthesize_voice_async(audio_data, text):
    """异步合成任务"""
    # ... 合成逻辑
    return result
```

### 3. 负载均衡

使用多个worker：

```bash
# 在docker-compose.yml中
services:
  voice-cloning-api:
    deploy:
      replicas: 4
```

或使用Nginx负载均衡：

```nginx
upstream voice_cloning_backend {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
    server 127.0.0.1:8004;
}

server {
    location / {
        proxy_pass http://voice_cloning_backend;
    }
}
```

## 监控和日志

### 1. 配置日志

```python
# 在main.py中
from loguru import logger
import sys

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)
logger.add(
    "/app/logs/voice-cloning.log",
    rotation="500 MB",
    retention="10 days",
    compression="zip"
)
```

### 2. 使用Prometheus监控

```bash
# 安装Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# 配置prometheus.yml
cat > prometheus.yml <<'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'voice-cloning'
    static_configs:
      - targets: ['localhost:8000']
EOF

# 启动
./prometheus --config.file=prometheus.yml &
```

### 3. 使用Grafana可视化

```bash
# 安装Grafana
apt-get install -y software-properties-common
add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
apt-get update
apt-get install grafana -y

# 启动
systemctl start grafana-server
systemctl enable grafana-server

# 访问: http://your-server-ip:3000
# 默认账号: admin/admin
```

## 安全配置

### 1. 配置防火墙

```bash
# 使用ufw
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 禁止直接访问8000端口
ufw deny 8000/tcp
```

### 2. 添加API认证

```python
from fastapi import Security, HTTPException
from fastapi.security.api_key import APIKeyHeader

API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# 在路由中使用
@app.post("/api/v1/clone-voice", dependencies=[Security(verify_api_key)])
async def clone_voice(...):
    ...
```

### 3. 限流

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/clone-voice")
@limiter.limit("10/minute")
async def clone_voice(...):
    ...
```

## 备份和恢复

```bash
# 备份脚本
cat > /opt/voice-cloning/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/voice-cloning"

mkdir -p $BACKUP_DIR

# 备份模型
tar -czf $BACKUP_DIR/models-$DATE.tar.gz models/

# 备份日志
tar -czf $BACKUP_DIR/logs-$DATE.tar.gz logs/

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/voice-cloning/backup.sh

# 添加到crontab（每天凌晨2点备份）
crontab -e
# 添加: 0 2 * * * /opt/voice-cloning/backup.sh
```

## 故障排查

### 常见问题

1. **容器无法启动**
   ```bash
   docker-compose logs
   docker-compose down && docker-compose up -d
   ```

2. **模型加载失败**
   ```bash
   # 检查模型文件
   ls -lh models/*/
   # 检查权限
   chmod -R 755 models/
   ```

3. **内存不足**
   ```bash
   # 增加swap
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

4. **GPU不可用**
   ```bash
   nvidia-smi
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```

## 成本优化

1. **使用按量计费**: 测试阶段使用按量计费
2. **使用预留实例**: 长期使用购买预留实例
3. **合理选择区域**: 选择离用户近的区域
4. **关闭闲置资源**: 非工作时间停止实例
5. **使用CDN**: 静态资源使用CDN

## 下一步

部署完成后：
1. 测试API接口
2. 集成到小程序云函数
3. 配置监控告警
4. 编写运维文档
