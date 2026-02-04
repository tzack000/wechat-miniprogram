# 服务器资源不足 - 回退指引

## 📋 当前情况

**服务器配置**: 2核1GB  
**问题**: 内存不足，无法构建 Docker 镜像  
**结论**: 该配置不适合运行 Docker 容器化部署

---

## 🔄 回退方案（按优先级）

### 方案 1: 清理服务器并创建 Swap（推荐尝试）⭐

如果您想继续在当前服务器上部署，可以尝试：

#### 步骤 1: 清理服务器资源

```bash
# 停止所有 Docker 容器
docker stop $(docker ps -aq) 2>/dev/null || true

# 清理 Docker 资源（释放磁盘和内存）
docker system prune -a -f --volumes

# 检查内存使用
free -h

# 检查磁盘空间
df -h
```

#### 步骤 2: 创建 Swap 交换空间（2GB）

```bash
# 创建 2GB swap 文件
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress

# 设置权限
sudo chmod 600 /swapfile

# 格式化为 swap
sudo mkswap /swapfile

# 启用 swap
sudo swapon /swapfile

# 验证（应该看到 2GB swap）
free -h

# 设置开机自动挂载
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 优化 swap 使用策略（降低 swappiness）
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

#### 步骤 3: 重新尝试轻量级部署

```bash
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
./deploy_lowmem.sh
```

**预期**: 有了 swap 后，总可用内存变为 **3GB**，应该可以成功构建。

**注意**: 使用 swap 会导致性能下降，但对于 Mock 模式的 API 服务影响不大。

---

### 方案 2: 升级服务器配置（最佳长期方案）💰

#### 推荐配置

| 用途 | 配置 | 腾讯云价格 | 说明 |
|------|------|-----------|------|
| **开发测试** | 2核2GB | ~¥100/月 | Mock 模式足够 |
| **小规模生产** | 2核4GB | ~¥150/月 | Mock 模式流畅 |
| **真实模型（CPU）** | 4核8GB | ~¥280/月 | 支持真实模型 |

#### 升级步骤（腾讯云）

1. **登录腾讯云控制台**
2. 进入 **云服务器 CVM** 管理页面
3. 找到您的实例，点击 **更多** → **调整配置**
4. 选择新配置（建议: **2核2GB** 或 **2核4GB**）
5. 确认费用，立即升级
6. 等待重启完成（约 5 分钟）

**升级后立即可用**，无需重新部署系统。

---

### 方案 3: 本地开发环境运行（临时替代）🏠

如果暂时无法升级服务器，可以在**本地电脑**上运行 API 服务供微信小程序测试：

#### 本地部署步骤

```bash
# 在本地电脑（Mac/Windows/Linux）执行

# 1. 克隆代码
cd ~/Documents/code/wechat-miniprogram/voice_cloner/voice-cloning-server

# 2. 创建 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装轻量级依赖
pip install -r requirements.mock.txt

# 4. 配置环境变量
cp .env.production .env
# 编辑 .env，设置 MODEL_MODE=mock

# 5. 启动服务
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 微信小程序如何访问本地服务

**选项 A: 使用内网穿透（推荐）**

使用 [ngrok](https://ngrok.com/) 或 [frp](https://github.com/fatedier/frp) 将本地服务暴露到公网：

```bash
# 使用 ngrok（免费）
ngrok http 8000

# 会得到一个公网 URL，例如:
# https://abc123.ngrok.io -> http://localhost:8000
```

然后在微信小程序中使用 `https://abc123.ngrok.io` 作为 API 地址。

**选项 B: 局域网访问（仅限同网络）**

```bash
# 获取本机 IP
ifconfig  # Mac/Linux
ipconfig  # Windows

# 假设本机 IP 是 192.168.1.100
# 微信小程序配置 API 地址: http://192.168.1.100:8000
```

**注意**: 微信小程序要求 HTTPS，局域网测试需要在开发者工具中勾选"不校验合法域名"。

---

### 方案 4: 使用 Serverless 部署（按量付费）☁️

使用腾讯云 Serverless（云函数 SCF）部署，**按调用次数计费**，成本极低：

#### 优势
- ✅ **零服务器管理**
- ✅ **按量付费**（每月前 100 万次调用免费）
- ✅ **自动扩缩容**
- ✅ **成本极低**（约 ¥5-10/月）

#### 部署方式

1. 安装 Serverless Framework:
```bash
npm install -g serverless
```

2. 创建 `serverless.yml`:
```yaml
component: fastapi
name: voice-cloning-api

inputs:
  src: ./
  region: ap-guangzhou
  runtime: Python3.9
  apigatewayConf:
    protocols:
      - https
    environment: release
```

3. 部署:
```bash
serverless deploy
```

**缺点**: 冷启动时间较长（首次调用 1-3 秒），适合低频调用场景。

---

### 方案 5: 简化到极致 - 无 Docker 部署（最快）⚡

直接在服务器上用 Python 运行，不使用 Docker：

#### 步骤

```bash
# 在服务器上执行

cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 1. 安装 Python 3.9
sudo apt update
sudo apt install -y python3.9 python3.9-venv python3-pip

# 2. 创建虚拟环境
python3.9 -m venv venv
source venv/bin/activate

# 3. 安装轻量级依赖（只需 1-2 分钟）
pip install -r requirements.mock.txt \
  -i https://mirrors.aliyun.com/pypi/simple/

# 4. 配置环境变量
cp .env.production .env
sed -i 's/MODEL_MODE=.*/MODEL_MODE=mock/' .env

# 5. 后台启动服务
nohup python -m uvicorn src.api.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 1 \
  > logs/api.log 2>&1 &

# 6. 查看进程
ps aux | grep uvicorn

# 7. 测试
curl http://localhost:8000/health
```

#### 管理服务

```bash
# 查看日志
tail -f logs/api.log

# 停止服务
pkill -f uvicorn

# 设置开机自启（使用 systemd）
sudo tee /etc/systemd/system/voice-api.service > /dev/null <<EOF
[Unit]
Description=Voice Cloning API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/wechat-miniprogram/voice_cloner/voice-cloning-server
Environment="PATH=/opt/wechat-miniprogram/voice_cloner/voice-cloning-server/venv/bin"
ExecStart=/opt/wechat-miniprogram/voice_cloner/voice-cloning-server/venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable voice-api
sudo systemctl start voice-api

# 检查状态
sudo systemctl status voice-api
```

**优势**:
- ✅ 内存占用低（约 150-300MB）
- ✅ 安装快速（1-2 分钟）
- ✅ 无 Docker 开销
- ✅ 适合 1GB 内存服务器

---

## 🎯 我的建议（根据您的需求选择）

### 如果只是临时测试（1-2 周）
→ **方案 3**（本地开发 + ngrok）或 **方案 5**（无 Docker）

### 如果长期使用，预算有限
→ **方案 1**（创建 Swap）+ **方案 5**（无 Docker）

### 如果长期使用，预算充足
→ **方案 2**（升级到 2核2GB，约 ¥100/月）

### 如果调用频率很低（< 1000 次/天）
→ **方案 4**（Serverless，约 ¥5-10/月）

---

## 📊 方案对比表

| 方案 | 成本 | 部署时间 | 内存占用 | 维护难度 | 推荐度 |
|------|------|----------|----------|----------|--------|
| Swap + Docker | ¥0 | 5分钟 | ~800MB | 中 | ⭐⭐⭐ |
| 升级服务器 | ¥100/月 | 5分钟 | ~500MB | 低 | ⭐⭐⭐⭐⭐ |
| 本地 + ngrok | ¥0 | 2分钟 | ~300MB | 中 | ⭐⭐⭐⭐ |
| Serverless | ¥5/月 | 10分钟 | 0 | 低 | ⭐⭐⭐⭐ |
| 无 Docker | ¥0 | 2分钟 | ~200MB | 中 | ⭐⭐⭐⭐⭐ |

---

## 🚨 立即行动建议

**最快可行的方案**（5 分钟内完成）：

```bash
# 在服务器上执行 - 方案 5（无 Docker 部署）

cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 安装依赖
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.mock.txt -i https://mirrors.aliyun.com/pypi/simple/

# 启动服务
nohup uvicorn src.api.main:app --host 0.0.0.0 --port 8000 > api.log 2>&1 &

# 测试
curl http://localhost:8000/health

# 查看公网 IP
curl ifconfig.me

# 测试外网访问（需要先配置安全组开放 8000 端口）
# curl http://YOUR_PUBLIC_IP:8000/health
```

---

## ❓ 需要帮助？

告诉我您想选择哪个方案，我可以提供更详细的步骤指导！

**推荐优先尝试**: 
1. **方案 5**（无 Docker，最快）
2. 如果不行，再尝试 **方案 1**（创建 Swap）
3. 如果还不行，考虑 **方案 2**（升级服务器）
