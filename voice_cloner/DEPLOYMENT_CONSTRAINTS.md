# 项目部署约束和环境要求

本文档记录了本项目在中国大陆部署时的特殊约束和环境要求，所有开发和部署工作都应遵循这些约束。

---

## 🌐 网络环境约束

### 部署地区
- **主要部署地区**: 中国大陆
- **云服务商**: 腾讯云 CVM (Cloud Virtual Machine)
- **操作系统**: Debian 12 (bookworm) / Ubuntu 20.04+

### 网络限制和解决方案

#### 1. Docker 安装
**问题**: 
- Docker 官方源 `download.docker.com` 在中国大陆访问不稳定
- GPG 密钥下载经常失败: `Connection reset by peer`

**解决方案**:
- ✅ **使用国内镜像源** (优先级顺序):
  1. 阿里云: `mirrors.aliyun.com/docker-ce`
  2. 清华大学: `mirrors.tuna.tsinghua.edu.cn/docker-ce`
  3. 中科大: `mirrors.ustc.edu.cn/docker-ce`
- ✅ **使用脚本**: `install_docker_china.sh`
- ❌ **禁止使用**: `deploy_tencent_cloud.sh` (使用官方源，会失败)

#### 2. Docker 镜像拉取
**问题**:
- Docker Hub 在中国大陆访问缓慢或失败
- 镜像下载超时

**解决方案**:
- ✅ **配置镜像加速器** (已在 `install_docker_china.sh` 中自动配置):
  ```json
  {
    "registry-mirrors": [
      "https://mirror.ccs.tencentyun.com",
      "https://docker.mirrors.ustc.edu.cn",
      "https://hub-mirror.c.163.com"
    ]
  }
  ```
- ✅ **使用国内镜像仓库**:
  - 阿里云: `registry.cn-hangzhou.aliyuncs.com`
  - 腾讯云: `mirror.ccs.tencentyun.com`

#### 3. Python 包安装
**问题**:
- PyPI 官方源 `pypi.org` 在中国大陆访问缓慢

**解决方案**:
- ✅ **使用国内镜像** (已在 `Dockerfile` 中配置):
  ```bash
  pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
  ```
- ✅ **推荐镜像源**:
  - 清华大学: `https://pypi.tuna.tsinghua.edu.cn/simple`
  - 阿里云: `https://mirrors.aliyun.com/pypi/simple/`
  - 中科大: `https://pypi.mirrors.ustc.edu.cn/simple/`

#### 4. GitHub 访问
**问题**:
- GitHub 访问不稳定，git clone 可能失败或超时
- GitHub Releases 下载缓慢

**解决方案**:
- ✅ **使用 GitHub 镜像**:
  - Gitee 导入: `https://gitee.com/`
  - FastGit: `https://hub.fastgit.xyz/`
  - GHProxy: `https://ghproxy.com/`
- ✅ **Docker Compose 安装**:
  ```bash
  # 使用 GHProxy 镜像
  curl -L "https://ghproxy.com/https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  ```

#### 5. NPM 包管理 (微信小程序)
**问题**:
- npm 官方源访问缓慢

**解决方案**:
- ✅ **使用淘宝镜像**:
  ```bash
  npm config set registry https://registry.npmmirror.com
  # 或
  npm install --registry=https://registry.npmmirror.com
  ```

---

## 🏗️ 技术栈约束

### 后端服务器
- **框架**: FastAPI (Python 3.8+)
- **Web 服务器**: Uvicorn
- **容器化**: Docker + Docker Compose
- **云服务商**: 腾讯云 CVM
- **操作系统**: Debian 12 (bookworm) 或 Ubuntu 20.04+

### 微信小程序
- **开发框架**: 微信小程序原生框架
- **云服务**: 微信云开发
- **云函数**: Node.js 16
- **云存储**: 腾讯云 COS (对象存储)

### 数据库 (规划中)
- **推荐**: MongoDB (腾讯云 MongoDB)
- **备选**: MySQL 5.7+ (腾讯云 TencentDB)

---

## 🔧 开发和部署工具

### 必须使用的脚本

| 脚本名称 | 用途 | 适用场景 |
|---------|------|---------|
| `install_docker_china.sh` | 安装 Docker | ✅ 中国大陆首选 |
| `deploy_cloud.sh` | 通用部署脚本 | ⚠️ 可能在中国失败 |
| `fix_docker.sh` | 清理 Docker 环境 | ✅ 故障修复 |
| `test_external_access.sh` | 测试外网访问 | ✅ 部署验证 |

### 禁止使用的操作

❌ **不要使用官方 Docker 源**:
```bash
# 错误示例
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor
```

❌ **不要直接 git clone GitHub**:
```bash
# 可能失败
git clone https://github.com/user/repo.git
# 推荐使用镜像或提前下载
```

❌ **不要使用默认 PyPI 源**:
```bash
# 错误示例
pip install package
# 正确做法
pip install package -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 🛡️ 安全和访问控制

### 腾讯云安全组
**必须开放的端口**:
- TCP 22: SSH 访问
- TCP 8000: API 服务端口
- TCP 80: HTTP (可选)
- TCP 443: HTTPS (推荐)

**配置位置**: 
腾讯云控制台 → 云服务器 → 实例列表 → 更多 → 安全组 → 配置安全组

### 防火墙配置
```bash
# 在 Debian/Ubuntu 服务器上
sudo ufw allow 22/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

---

## 📋 标准部署流程

### 1. 服务器初始化 (一次性)

```bash
# 1. 连接服务器
ssh root@YOUR_SERVER_IP

# 2. 克隆代码
cd /opt
git clone https://github.com/tzack000/wechat-miniprogram.git
cd wechat-miniprogram/voice_cloner/voice-cloning-server

# 3. 安装 Docker (使用国内源)
chmod +x install_docker_china.sh
sudo ./install_docker_china.sh

# 4. 配置环境变量
nano .env.production
# 修改 API_KEY 和 ALLOWED_ORIGINS
```

### 2. 部署应用

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 验证
docker compose ps
curl http://localhost:8000/health
```

### 3. 配置外网访问

```bash
# 1. 腾讯云控制台配置安全组 (开放 8000 端口)
# 2. 测试外网访问
curl http://SERVER_IP:8000/health
```

---

## 🚨 常见问题和解决方案

### 问题 1: Docker GPG 密钥下载失败
**错误**: `Connection reset by peer`

**解决**: 使用 `install_docker_china.sh` 脚本，自动尝试多个国内镜像源

---

### 问题 2: Docker 镜像拉取超时
**错误**: `timeout while waiting for image`

**解决**: 
```bash
# 配置镜像加速
sudo nano /etc/docker/daemon.json
# 添加国内镜像源
sudo systemctl restart docker
```

---

### 问题 3: pip 安装超时
**错误**: `Read timed out`

**解决**:
```bash
# 使用国内源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

### 问题 4: 外网无法访问 API
**原因**: 安全组未配置

**解决**: 按照 `SECURITY_GROUP_GUIDE.md` 配置腾讯云安全组

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `DEPLOYMENT_CONSTRAINTS.md` | 本文档 |
| `install_docker_china.sh` | Docker 安装脚本 (国内优化) |
| `SECURITY_GROUP_GUIDE.md` | 安全组配置指南 |
| `DOCKER_FIX.md` | Docker 问题排查 |
| `TENCENT_CLOUD_DEPLOYMENT.md` | 完整部署指南 |
| `API_TEST_REPORT.md` | API 测试报告 |

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-02-03 | 1.0 | 初始版本，记录中国网络环境约束 |

---

## 👥 贡献指南

### 添加新的约束或解决方案

当遇到新的网络或部署问题时:

1. 记录问题描述和错误信息
2. 记录解决方案和替代方案
3. 更新本文档
4. 创建或更新相关脚本
5. 提交 git commit 说明变更

### 文档维护

- 所有中国特有的网络问题都应记录在本文档
- 所有解决方案都应提供可执行的脚本或命令
- 保持文档与脚本同步更新

---

**重要提示**: 本项目的所有开发和部署工作都应考虑中国网络环境的特殊性，优先使用国内镜像源和服务。
