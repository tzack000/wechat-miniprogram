# Docker 安装错误修复指南

## 问题描述

错误信息:
```
E: The repository 'https://download.docker.com/linux/ubuntu bookworm Release' does not have a Release file.
```

**原因**: 服务器运行的是 Debian 系统（bookworm = Debian 12），但脚本使用了 Ubuntu 的 Docker 仓库配置。

---

## 解决方案

### 方案 1: 使用改进的部署脚本（推荐）

我已经创建了一个新的改进脚本 `deploy_cloud.sh`，它能自动检测系统类型：

```bash
# 1. 下载最新代码
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
git pull

# 2. 使用新脚本部署
chmod +x deploy_cloud.sh
sudo ./deploy_cloud.sh
```

新脚本的改进:
- ✅ 自动检测 Ubuntu/Debian 系统
- ✅ 使用正确的 Docker 仓库源
- ✅ 更好的错误处理
- ✅ 自动生成随机 API_KEY
- ✅ 详细的健康检查

---

### 方案 2: 手动安装 Docker（如果方案1失败）

```bash
# 1. 卸载旧版本
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# 2. 更新系统
sudo apt-get update
sudo apt-get upgrade -y

# 3. 安装依赖
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 4. 添加 Docker GPG 密钥 (Debian)
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 5. 配置 Docker 仓库 (Debian)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 6. 设置权限
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 7. 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 8. 验证安装
sudo docker run hello-world

# 9. 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 10. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

安装完成后，继续部署:

```bash
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 配置环境变量
nano .env.production
# 修改 API_KEY 和 ALLOWED_ORIGINS

# 构建并启动
docker-compose build
docker-compose up -d

# 检查状态
docker-compose ps
curl http://localhost:8000/health
```

---

### 方案 3: 使用 Docker 便捷安装脚本

```bash
# 1. 下载并运行 Docker 官方安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 验证
docker --version
docker-compose --version

# 5. 继续部署
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
docker-compose up -d
```

---

## 验证系统信息

在执行修复前，先确认您的系统信息:

```bash
# 查看系统信息
cat /etc/os-release

# 查看内核版本
uname -a

# 查看 Debian/Ubuntu 版本
lsb_release -a
```

---

## 常见问题

### Q1: 如何确认是 Debian 还是 Ubuntu？

```bash
cat /etc/os-release | grep "^ID="
```

输出:
- `ID=debian` → Debian 系统
- `ID=ubuntu` → Ubuntu 系统

### Q2: Docker 仓库配置错误怎么办？

```bash
# 删除错误的仓库配置
sudo rm /etc/apt/sources.list.d/docker.list

# 清理 APT 缓存
sudo apt-get clean
sudo apt-get update

# 重新添加正确的仓库（使用方案2的步骤）
```

### Q3: GPG 密钥错误？

```bash
# 删除旧密钥
sudo rm /etc/apt/keyrings/docker.gpg

# 重新下载（Debian）
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置权限
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### Q4: 网络连接问题？

如果无法访问 Docker 官方源，可以使用国内镜像:

```bash
# 使用阿里云镜像（Debian）
echo \
  "deb [arch=$(dpkg --print-architecture)] https://mirrors.aliyun.com/docker-ce/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
```

---

## 推荐步骤（最快解决）

1. **使用新的部署脚本** (方案1)
2. 如果失败，查看日志找出具体错误
3. 使用 Docker 官方便捷脚本 (方案3)
4. 最后考虑手动安装 (方案2)

---

## 部署后验证

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version

# 检查 Docker 服务状态
sudo systemctl status docker

# 测试 Docker
docker run hello-world

# 检查容器状态
docker-compose ps

# 测试 API
curl http://localhost:8000/health
```

---

## 需要帮助？

如果问题仍未解决，请提供以下信息:

```bash
# 系统信息
cat /etc/os-release

# Docker 状态
systemctl status docker

# Docker 日志
journalctl -u docker.service --no-pager | tail -50

# 容器日志
docker-compose logs
```

---

**建议**: 使用改进后的 `deploy_cloud.sh` 脚本，它会自动处理这些问题！
