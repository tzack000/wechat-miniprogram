# 腾讯云 Docker 部署指南

本指南将帮助您将语音克隆 API 服务器部署到腾讯云服务器（CVM）。

---

## 前置要求

### 1. 腾讯云 CVM 服务器

**推荐配置**:
- CPU: 2核或更高
- 内存: 4GB 或更高
- 硬盘: 50GB 或更高
- 操作系统: Ubuntu 20.04 LTS / Ubuntu 22.04 LTS
- 网络: 公网带宽建议 3Mbps 或更高

**购买地址**: https://cloud.tencent.com/product/cvm

### 2. 本地环境

- Git
- SSH 客户端
- 腾讯云服务器的 SSH 访问权限

---

## 部署步骤

### 步骤 1: 连接到腾讯云服务器

```bash
# 使用 SSH 连接到服务器
ssh root@your-server-ip

# 或使用密钥
ssh -i /path/to/your-key.pem root@your-server-ip
```

**提示**: 可以在腾讯云控制台的 "实例列表" 中找到您的服务器公网IP。

---

### 步骤 2: 上传代码到服务器

**方式 1: 使用 Git (推荐)**

```bash
# 在服务器上
cd /opt
git clone https://github.com/tzack000/wechat-miniprogram.git
cd wechat-miniprogram/voice_cloner/voice-cloning-server
```

**方式 2: 使用 SCP 上传**

```bash
# 在本地机器上
cd /Users/tangzhenqian/Documents/code/wechat-miniprogram/voice_cloner
tar -czf voice-cloning-server.tar.gz voice-cloning-server/

# 上传到服务器
scp voice-cloning-server.tar.gz root@your-server-ip:/opt/

# 在服务器上解压
ssh root@your-server-ip
cd /opt
tar -xzf voice-cloning-server.tar.gz
cd voice-cloning-server
```

---

### 步骤 3: 配置生产环境变量

```bash
# 编辑生产环境配置
nano .env.production
```

**必须修改的配置项**:
```bash
# 安全密钥 - 必须修改为随机字符串
API_KEY=your-production-secret-key-here

# 允许的来源域名
ALLOWED_ORIGINS=https://yourdomain.com,https://servicewechat.com
```

**生成安全的 API_KEY**:
```bash
# 生成随机密钥
openssl rand -base64 32
```

---

### 步骤 4: 运行部署脚本

```bash
# 确保脚本有执行权限
chmod +x deploy_tencent_cloud.sh

# 运行部署脚本（需要 root 权限）
sudo ./deploy_tencent_cloud.sh
```

部署脚本会自动完成以下操作：
1. ✅ 安装 Docker 和 Docker Compose
2. ✅ 配置防火墙规则
3. ✅ 创建必要的目录
4. ✅ 构建 Docker 镜像
5. ✅ 启动容器
6. ✅ 执行健康检查

**预计时间**: 5-10 分钟

---

### 步骤 5: 配置腾讯云安全组

在腾讯云控制台配置安全组规则：

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)
2. 进入 "云服务器" → "实例列表"
3. 点击您的服务器，进入 "安全组" 标签
4. 添加以下入站规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 8000 | 0.0.0.0/0 | API 服务端口 |
| TCP | 80 | 0.0.0.0/0 | HTTP (可选) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (可选) |
| TCP | 22 | 您的IP | SSH 访问 |

**安全建议**: 
- 生产环境建议限制 API 端口只允许微信云开发服务器 IP 访问
- SSH 端口建议只允许特定 IP 访问

---

### 步骤 6: 验证部署

**1. 检查容器状态**
```bash
docker-compose ps
```

预期输出：
```
NAME                  IMAGE                     STATUS
voice-cloning-api     voice-cloning-api:latest  Up (healthy)
```

**2. 测试健康检查**
```bash
curl http://localhost:8000/health
```

预期输出：
```json
{
    "status": "healthy",
    "models_loaded": true,
    "version": "1.0.0",
    "mode": "mock"
}
```

**3. 从外网访问**
```bash
# 在本地机器上测试
curl http://your-server-ip:8000/health
```

**4. 访问 API 文档**

在浏览器中打开：`http://your-server-ip:8000/docs`

---

## 管理和维护

### 查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定容器日志
docker logs -f voice-cloning-api
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 只重启 API 服务
docker-compose restart voice-api
```

### 停止服务

```bash
# 停止并删除容器
docker-compose down

# 停止但保留容器
docker-compose stop
```

### 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose build

# 3. 重启服务
docker-compose up -d
```

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats voice-cloning-api

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 故障排查

### 问题 1: 容器无法启动

**检查日志**:
```bash
docker-compose logs voice-api
```

**常见原因**:
- 端口 8000 被占用
- 环境配置文件格式错误
- 依赖安装失败

**解决方法**:
```bash
# 检查端口占用
netstat -tlnp | grep 8000

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

### 问题 2: 外网无法访问

**检查清单**:
1. ✓ 容器正在运行: `docker-compose ps`
2. ✓ 本地可以访问: `curl http://localhost:8000/health`
3. ✓ 防火墙已开放: `ufw status`
4. ✓ 安全组已配置: 检查腾讯云控制台
5. ✓ 公网 IP 正确: `curl http://checkip.amazonaws.com`

---

### 问题 3: API 响应慢

**优化建议**:
1. 增加 Worker 数量（在 Dockerfile 中修改）
2. 升级服务器配置
3. 使用 Nginx 反向代理和缓存
4. 启用 CDN 加速

---

## 配置 HTTPS (可选)

### 使用 Let's Encrypt 免费证书

**1. 安装 Certbot**
```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

**2. 获取证书**
```bash
certbot --nginx -d api.yourdomain.com
```

**3. 自动续期**
```bash
# Certbot 会自动添加 cron 任务
# 可以手动测试续期
certbot renew --dry-run
```

---

## 监控和告警

### 设置日志轮转

编辑 `/etc/logrotate.d/voice-api`:
```
/opt/wechat-miniprogram/voice_cloner/voice-cloning-server/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

### 配置腾讯云监控

1. 在腾讯云控制台开启 "云监控"
2. 配置告警策略：
   - CPU 使用率 > 80%
   - 内存使用率 > 85%
   - 磁盘使用率 > 90%

---

## 性能优化

### 1. 使用 Nginx 反向代理

参考 `nginx.conf.example` 配置文件

### 2. 启用 Docker 日志驱动

在 `docker-compose.yml` 中添加：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 配置 Docker 资源限制

已在 `docker-compose.yml` 中配置，根据实际情况调整。

---

## 备份和恢复

### 备份

```bash
# 备份配置文件
tar -czf backup-$(date +%Y%m%d).tar.gz .env.production docker-compose.yml

# 备份日志
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### 恢复

```bash
# 解压备份
tar -xzf backup-20260203.tar.gz

# 重新部署
docker-compose up -d
```

---

## 安全建议

1. ✅ 定期更新系统和 Docker: `apt-get update && apt-get upgrade`
2. ✅ 使用强密码和 SSH 密钥认证
3. ✅ 配置防火墙限制访问
4. ✅ 定期备份数据和配置
5. ✅ 监控服务器日志和资源使用
6. ✅ 启用 HTTPS 加密通信
7. ✅ 定期更换 API_KEY

---

## 下一步

部署完成后：

1. **测试 API**: 使用 Postman 或 curl 测试所有端点
2. **更新云函数**: 修改云函数中的 `API_BASE_URL` 为服务器地址
3. **集成测试**: 从微信小程序测试完整流程
4. **性能测试**: 使用 Apache Bench 或 wrk 进行压力测试
5. **监控上线**: 配置监控和告警

---

## 获取帮助

- **项目 Issues**: https://github.com/tzack000/wechat-miniprogram/issues
- **腾讯云文档**: https://cloud.tencent.com/document/product/213
- **Docker 文档**: https://docs.docker.com

---

**部署成功！** 🎉

您的语音克隆 API 现在已经运行在腾讯云上了！
