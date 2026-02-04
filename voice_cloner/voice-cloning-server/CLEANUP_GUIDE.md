# 服务器环境清理指引

## 📋 清理说明

本文档提供完整的服务器环境清理步骤，帮助您安全地清理部署相关的文件和服务。

---

## 🧹 快速清理（一键脚本）

### 选项 1: 完全清理（推荐）

清理所有部署相关内容，包括代码、Docker、日志等。

```bash
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 下载并运行清理脚本
chmod +x cleanup.sh 2>/dev/null || true

# 或手动执行完全清理
bash << 'EOF'
#!/bin/bash

echo "=========================================="
echo "  开始清理环境"
echo "=========================================="
echo ""

# 1. 停止所有运行的服务
echo "[1/6] 停止运行的服务..."
pkill -f 'uvicorn src.api.main:app' 2>/dev/null || true
docker compose -f docker-compose.yml down 2>/dev/null || true
docker compose -f docker-compose.mock.yml down 2>/dev/null || true
echo "✓ 服务已停止"
echo ""

# 2. 删除 Python 虚拟环境
echo "[2/6] 删除 Python 虚拟环境..."
rm -rf venv/
echo "✓ 虚拟环境已删除"
echo ""

# 3. 清理 Docker 资源
echo "[3/6] 清理 Docker 资源..."
if command -v docker &> /dev/null; then
    # 停止所有容器
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # 删除项目相关容器
    docker rm voice-cloning-api voice-nginx 2>/dev/null || true
    
    # 删除项目镜像
    docker rmi voice-cloning-server-voice-api 2>/dev/null || true
    docker rmi voice-cloning-api 2>/dev/null || true
    
    # 清理未使用的资源
    docker system prune -f 2>/dev/null || true
    
    echo "✓ Docker 资源已清理"
else
    echo "✓ Docker 未安装，跳过"
fi
echo ""

# 4. 删除日志文件
echo "[4/6] 删除日志文件..."
rm -rf logs/*.log
rm -f api.log nohup.out
echo "✓ 日志已删除"
echo ""

# 5. 删除临时文件
echo "[5/6] 删除临时文件..."
rm -f .env.bak .env.production.bak
rm -f *.pyc
rm -rf __pycache__/
rm -rf src/**/__pycache__/
rm -f test_embedding.json output_batch.zip
echo "✓ 临时文件已删除"
echo ""

# 6. 显示清理结果
echo "[6/6] 清理完成"
echo ""
echo "=========================================="
echo "  清理结果"
echo "=========================================="
echo ""

# 检查残留进程
if pgrep -f uvicorn > /dev/null; then
    echo "⚠ 警告: 仍有 uvicorn 进程在运行"
    ps aux | grep uvicorn | grep -v grep
else
    echo "✓ 无残留的 Python 服务进程"
fi

# 检查 Docker 容器
if command -v docker &> /dev/null; then
    CONTAINERS=$(docker ps -a --filter "name=voice" --format "{{.Names}}" 2>/dev/null)
    if [ -z "$CONTAINERS" ]; then
        echo "✓ 无残留的 Docker 容器"
    else
        echo "⚠ 警告: 仍有 Docker 容器"
        echo "$CONTAINERS"
    fi
fi

# 检查磁盘使用
echo ""
echo "当前目录磁盘使用:"
du -sh . 2>/dev/null || echo "无法统计"

echo ""
echo "=========================================="
echo "✓ 环境清理完成！"
echo "=========================================="
echo ""
echo "提示:"
echo "  - 代码仓库保留（可通过 git 恢复）"
echo "  - 配置文件保留（.env.production）"
echo "  - 如需完全删除项目，执行:"
echo "    cd /opt && rm -rf wechat-miniprogram/"
echo ""
EOF
```

---

## 🔧 分步清理（手动操作）

如果您想逐步清理，可以按以下步骤操作：

### 步骤 1: 停止所有服务

```bash
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server

# 停止 Python 服务（无 Docker 部署）
pkill -f 'uvicorn src.api.main:app'

# 停止 Docker 服务
docker compose down
docker compose -f docker-compose.mock.yml down

# 验证服务已停止
ps aux | grep uvicorn
docker ps -a | grep voice
```

### 步骤 2: 清理 Python 环境

```bash
# 删除虚拟环境
rm -rf venv/

# 删除 Python 缓存
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete
```

### 步骤 3: 清理 Docker 资源

```bash
# 停止所有 Docker 容器
docker stop $(docker ps -aq) 2>/dev/null

# 删除项目相关容器
docker rm voice-cloning-api voice-nginx 2>/dev/null

# 删除项目镜像
docker rmi voice-cloning-server-voice-api 2>/dev/null
docker rmi voice-cloning-api 2>/dev/null

# 清理未使用的 Docker 资源（可选）
docker system prune -a -f --volumes

# 验证清理结果
docker ps -a
docker images
```

### 步骤 4: 删除日志文件

```bash
# 删除日志目录
rm -rf logs/*.log

# 删除其他日志
rm -f api.log nohup.out

# 或保留日志目录但清空内容
> logs/api.log
```

### 步骤 5: 删除临时文件

```bash
# 删除备份文件
rm -f .env.bak .env.production.bak

# 删除测试输出
rm -f test_embedding.json output_batch.zip
rm -f output.wav test_audio.wav

# 删除 swap 文件（如果创建过）
sudo swapoff /swapfile 2>/dev/null
sudo rm -f /swapfile
# 编辑 /etc/fstab 删除 swap 条目
sudo sed -i '/swapfile/d' /etc/fstab
```

### 步骤 6: 清理系统服务（如果配置过）

```bash
# 停止并删除 systemd 服务
sudo systemctl stop voice-api 2>/dev/null
sudo systemctl disable voice-api 2>/dev/null
sudo rm -f /etc/systemd/system/voice-api.service
sudo systemctl daemon-reload
```

### 步骤 7: 清理网络和端口

```bash
# 检查端口占用
sudo lsof -i :8000
sudo netstat -tlnp | grep 8000

# 如果有进程占用，杀死它
sudo kill -9 <PID>

# 清理防火墙规则（可选）
sudo ufw status numbered
# 找到 8000 端口的规则编号，然后删除
sudo ufw delete <规则编号>
```

---

## 🗑️ 完全删除项目

如果您不再需要这个项目，可以完全删除：

```bash
# 停止所有服务
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
pkill -f uvicorn
docker compose down 2>/dev/null

# 删除整个项目目录
cd /opt
rm -rf wechat-miniprogram/

# 验证删除
ls -la /opt/
```

---

## 🔍 清理验证检查清单

清理完成后，请验证以下项目：

```bash
# 1. 检查进程
ps aux | grep uvicorn
# 预期: 无输出（或只有 grep 自身）

# 2. 检查端口
sudo netstat -tlnp | grep 8000
# 预期: 无输出

# 3. 检查 Docker 容器
docker ps -a | grep voice
# 预期: 无输出

# 4. 检查 Docker 镜像
docker images | grep voice
# 预期: 无输出

# 5. 检查磁盘空间
df -h
# 预期: 可用空间增加

# 6. 检查项目目录大小
du -sh /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
# 预期: 减少到 ~50MB（仅代码）
```

---

## 📦 保留配置（可选）

如果您将来可能重新部署，建议保留以下文件：

```bash
# 备份配置文件
mkdir -p ~/backup/voice-cloning-server
cp .env.production ~/backup/voice-cloning-server/
cp docker-compose.yml ~/backup/voice-cloning-server/

# 备份 API_KEY
grep "API_KEY=" .env.production > ~/backup/voice-cloning-server/api_key.txt

echo "配置已备份到: ~/backup/voice-cloning-server/"
```

---

## 🔄 快速重新部署

如果您将来需要重新部署，只需：

```bash
# 1. 拉取代码（如果已删除）
cd /opt
git clone https://github.com/tzack000/wechat-miniprogram.git

# 2. 恢复配置（如果有备份）
cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server
cp ~/backup/voice-cloning-server/.env.production .

# 3. 运行部署脚本
./deploy_no_docker.sh
```

---

## 🆘 清理失败？强制清理

如果常规清理失败，使用强制清理：

```bash
# 强制停止所有相关进程
sudo pkill -9 -f uvicorn
sudo pkill -9 -f python

# 强制删除 Docker 资源
docker rm -f $(docker ps -aq) 2>/dev/null
docker rmi -f $(docker images -q) 2>/dev/null
docker volume rm -f $(docker volume ls -q) 2>/dev/null

# 强制删除目录
sudo rm -rf /opt/wechat-miniprogram/voice_cloner/voice-cloning-server/venv
sudo rm -rf /opt/wechat-miniprogram/voice_cloner/voice-cloning-server/logs

# 重启服务器（最后手段）
sudo reboot
```

---

## 📊 清理前后对比

| 项目 | 清理前 | 清理后 |
|------|--------|--------|
| **磁盘占用** | ~2-3 GB | ~50 MB（仅代码） |
| **内存占用** | ~200-800 MB | 0 MB |
| **运行进程** | uvicorn, docker | 无 |
| **端口占用** | 8000 | 无 |
| **Docker 镜像** | 1-2 个 | 0 个 |

---

## ⚠️ 注意事项

1. **备份重要数据**：清理前确保已备份重要的配置和数据
2. **检查依赖**：确认没有其他服务依赖此项目
3. **安全组规则**：清理后可以在腾讯云控制台删除 8000 端口的安全组规则
4. **DNS/域名**：如果配置了域名，记得更新 DNS 记录
5. **监控告警**：如果配置了监控，记得删除相关的告警规则

---

## 🎯 清理完成后的建议

### 如果将来要在其他服务器部署：

1. **升级服务器配置**：建议至少 2核2GB
2. **使用 Docker 部署**：资源充足时 Docker 更规范
3. **配置域名和 HTTPS**：生产环境必须使用 HTTPS
4. **设置监控**：使用腾讯云监控或其他监控服务

### 如果暂时不部署：

1. **关闭服务器**：节省费用（按量付费）
2. **创建快照**：保留当前系统状态
3. **降低配置**：改为最低配置节省成本

---

## 📞 需要帮助？

如果清理过程中遇到问题：

1. 查看错误日志：`tail -f /var/log/syslog`
2. 检查磁盘空间：`df -h`
3. 检查内存使用：`free -h`
4. 列出所有进程：`ps aux | less`

---

**清理完成后，您的服务器将回到干净的状态，随时可以用于其他用途！** 🎉
