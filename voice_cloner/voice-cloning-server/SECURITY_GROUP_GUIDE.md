# 配置安全组和外网访问指南

本指南将帮助您配置腾讯云安全组，开放 API 端口，并测试外网访问。

---

## 📋 前提条件

- ✅ Docker 和服务已成功安装并运行
- ✅ 在服务器上可以访问 `http://localhost:8000/health`
- ✅ 已知服务器的公网 IP 地址

---

## 🔍 步骤 1: 确认服务状态和公网 IP

在您的服务器上运行：

```bash
# 1. 查看容器状态
docker compose ps

# 预期输出:
# NAME                  STATUS
# voice-cloning-api     Up (healthy)

# 2. 测试本地访问
curl http://localhost:8000/health

# 预期输出:
# {"status":"healthy","models_loaded":true,"version":"1.0.0","mode":"mock"}

# 3. 获取公网 IP
curl http://checkip.amazonaws.com

# 记下输出的 IP 地址，例如: 43.xxx.xxx.xxx
```

**记录您的公网 IP**: `___________________`

---

## 🛡️ 步骤 2: 配置腾讯云安全组

### 方法 1: 通过腾讯云控制台（推荐）

#### 2.1 登录控制台

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/cvm/instance)
2. 登录您的账号

#### 2.2 找到您的服务器

1. 在左侧菜单选择 **云服务器** → **实例列表**
2. 找到您的服务器实例（通过公网 IP 识别）
3. 记下服务器名称和状态

#### 2.3 进入安全组配置

**方式 A - 从实例详情进入**:
1. 点击实例 ID 或名称，进入实例详情页
2. 点击 **安全组** 标签
3. 找到关联的安全组，点击安全组 ID（如 `sg-xxxxxxxx`）

**方式 B - 从实例操作进入**:
1. 在实例列表中，点击右侧 **更多** → **安全组** → **配置安全组**
2. 选择要修改的安全组

#### 2.4 修改入站规则

1. 在安全组详情页，点击 **入站规则** 标签
2. 点击 **添加规则**
3. 添加以下规则：

| 类型 | 来源 | 协议端口 | 策略 | 备注 |
|------|------|---------|------|------|
| 自定义 | 0.0.0.0/0 | TCP:8000 | 允许 | API服务端口 |
| SSH | 0.0.0.0/0 | TCP:22 | 允许 | SSH访问（可选限制IP） |
| HTTP | 0.0.0.0/0 | TCP:80 | 允许 | HTTP（可选） |
| HTTPS | 0.0.0.0/0 | TCP:443 | 允许 | HTTPS（可选） |

**填写示例（8000端口）**:
- **类型**: 自定义
- **来源**: `0.0.0.0/0` （或点击"所有"）
- **协议端口**: `TCP:8000`
- **策略**: 允许
- **备注**: `语音克隆API端口`

#### 2.5 保存规则

1. 点击 **完成** 按钮
2. 规则会立即生效，无需重启服务器

---

### 方法 2: 使用服务器防火墙（备用）

如果安全组配置需要时间审批，可以先临时在服务器上配置防火墙：

```bash
# 检查防火墙状态
sudo ufw status

# 允许 8000 端口
sudo ufw allow 8000/tcp

# 允许 SSH（重要！避免被锁定）
sudo ufw allow 22/tcp

# 如果防火墙未启用，启用它
sudo ufw enable

# 查看规则
sudo ufw status numbered

# 重新加载防火墙
sudo ufw reload
```

**注意**: 
- 这只是临时方案
- 腾讯云安全组是主要的访问控制
- 两者都需要正确配置

---

## 🌐 步骤 3: 测试外网访问

### 3.1 快速测试（命令行）

**在您的本地电脑上运行**（替换 IP 地址）:

```bash
# 替换为您的服务器 IP
SERVER_IP="43.xxx.xxx.xxx"

# 测试健康检查
curl http://$SERVER_IP:8000/health

# 测试根路径
curl http://$SERVER_IP:8000/

# 测试网络连接
ping -c 3 $SERVER_IP
```

**预期输出**:
```json
{
    "status": "healthy",
    "models_loaded": true,
    "version": "1.0.0",
    "mode": "mock"
}
```

---

### 3.2 使用测试脚本（推荐）

```bash
# 在本地机器上
cd /Users/tangzhenqian/Documents/code/wechat-miniprogram/voice_cloner/voice-cloning-server

# 运行测试脚本（替换为您的 IP）
./test_external_access.sh 43.xxx.xxx.xxx
```

这个脚本会自动测试：
1. ✅ 根路径访问
2. ✅ 健康检查
3. ✅ API 文档
4. ✅ 声纹提取 API
5. ✅ 网络延迟

---

### 3.3 浏览器测试

在浏览器中打开以下地址（替换为您的 IP）:

1. **API 文档**: `http://43.xxx.xxx.xxx:8000/docs`
   - 应该看到 Swagger UI 交互式文档
   
2. **健康检查**: `http://43.xxx.xxx.xxx:8000/health`
   - 应该显示 JSON 响应
   
3. **根路径**: `http://43.xxx.xxx.xxx:8000/`
   - 应该显示 API 信息

---

## ✅ 验证清单

在继续之前，确保：

- [ ] 服务器上 `docker compose ps` 显示容器运行中
- [ ] 服务器上 `curl http://localhost:8000/health` 返回正常
- [ ] 腾讯云安全组已添加 8000 端口入站规则
- [ ] 服务器防火墙允许 8000 端口（如果启用了 ufw）
- [ ] 本地能够 `curl http://SERVER_IP:8000/health` 成功
- [ ] 浏览器能够访问 `http://SERVER_IP:8000/docs`

---

## 🐛 故障排查

### 问题 1: 本地无法访问服务器 IP

**症状**: `curl: (7) Failed to connect`

**检查清单**:
```bash
# 1. 在服务器上确认服务运行
docker compose ps
curl http://localhost:8000/health

# 2. 检查服务器防火墙
sudo ufw status

# 3. 检查端口监听
sudo netstat -tlnp | grep 8000
# 或
sudo ss -tlnp | grep 8000

# 4. 测试网络连通性
ping SERVER_IP
telnet SERVER_IP 8000
```

**解决方法**:
1. 确认腾讯云安全组已开放 8000 端口
2. 检查服务器防火墙: `sudo ufw allow 8000/tcp`
3. 查看容器日志: `docker compose logs`

---

### 问题 2: 安全组规则已添加但仍无法访问

**可能原因**:
1. 规则未生效（等待 1-2 分钟）
2. 选错了安全组
3. 出站规则限制了响应

**解决方法**:
```bash
# 在服务器上测试从外部访问
curl http://SERVER_PUBLIC_IP:8000/health

# 检查出站规则
# 在腾讯云控制台查看安全组的"出站规则"
# 确保允许所有出站流量或至少允许 TCP:8000
```

---

### 问题 3: 502 Bad Gateway 或 504 Gateway Timeout

**症状**: API 返回错误或超时

**检查**:
```bash
# 查看容器状态
docker compose ps

# 查看容器日志
docker compose logs --tail=100

# 重启容器
docker compose restart

# 检查资源使用
docker stats voice-cloning-api
```

---

### 问题 4: 端口冲突

**症状**: 服务无法启动，提示端口被占用

**解决**:
```bash
# 查看端口占用
sudo lsof -i :8000
# 或
sudo netstat -tlnp | grep 8000

# 停止占用端口的进程
sudo kill <PID>

# 修改端口（在 docker-compose.yml 中）
# ports:
#   - "9000:8000"  # 使用 9000 而不是 8000
```

---

## 📊 成功标志

当所有配置正确时，您应该看到：

**1. 服务器端**:
```bash
$ docker compose ps
NAME                  STATUS
voice-cloning-api     Up (healthy)

$ curl http://localhost:8000/health
{"status":"healthy","models_loaded":true,"version":"1.0.0","mode":"mock"}
```

**2. 本地测试**:
```bash
$ curl http://43.xxx.xxx.xxx:8000/health
{"status":"healthy","models_loaded":true,"version":"1.0.0","mode":"mock"}
```

**3. 浏览器访问**:
- 打开 `http://43.xxx.xxx.xxx:8000/docs` 显示 Swagger UI

---

## 📝 记录部署信息

部署成功后，请记录以下信息：

```
部署时间: ___________________
服务器IP: ___________________
API地址: http://___________________:8000
API文档: http://___________________:8000/docs
API_KEY: ___________________ (在 .env.production 中)
```

---

## 🎯 下一步

外网访问成功后：

1. ✅ **更新云函数配置** - 修改云函数中的 `API_BASE_URL`
2. ✅ **端到端测试** - 从微信小程序测试完整流程
3. ⭕ **配置域名和 HTTPS** (可选但推荐)
4. ⭕ **设置监控告警** (可选)
5. ⭕ **配置 Nginx 反向代理** (可选)

---

## 📚 相关文档

- **TENCENT_CLOUD_DEPLOYMENT.md** - 完整部署指南
- **DOCKER_FIX.md** - Docker 问题排查
- **API_TEST_REPORT.md** - API 测试报告

---

## 🆘 需要帮助？

如果遇到问题，请提供：
1. 错误信息的完整输出
2. 安全组规则截图
3. 服务器日志: `docker compose logs`
4. 网络测试结果: `curl -v http://SERVER_IP:8000/health`

---

**配置完成！** 您的 API 现在可以从外网访问了！🎉
