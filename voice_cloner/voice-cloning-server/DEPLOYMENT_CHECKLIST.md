# 快速部署清单

## 部署前检查

- [ ] 已购买腾讯云 CVM 服务器（2核4G或以上）
- [ ] 已获得服务器公网 IP 和 SSH 访问权限
- [ ] 本地已安装 Git 和 SSH 客户端
- [ ] 已了解基本的 Linux 命令

---

## 快速部署（5个步骤）

### 1️⃣ 连接服务器

```bash
ssh root@YOUR_SERVER_IP
```

### 2️⃣ 克隆代码

```bash
cd /opt
git clone https://github.com/tzack000/wechat-miniprogram.git
cd wechat-miniprogram/voice_cloner/voice-cloning-server
```

### 3️⃣ 配置环境

```bash
# 生成随机密钥
openssl rand -base64 32

# 编辑配置文件
nano .env.production

# 修改以下内容:
# API_KEY=刚才生成的随机密钥
# ALLOWED_ORIGINS=你的域名或 * (所有来源)
```

### 4️⃣ 运行部署

```bash
chmod +x deploy_tencent_cloud.sh
sudo ./deploy_tencent_cloud.sh
```

### 5️⃣ 配置安全组

登录腾讯云控制台 → 云服务器 → 安全组 → 添加规则:

| 类型 | 端口 | 来源 | 说明 |
|------|------|------|------|
| 自定义TCP | 8000 | 0.0.0.0/0 | API端口 |

---

## 验证部署

### 在服务器上测试

```bash
curl http://localhost:8000/health
```

### 从外网测试

```bash
# 在本地机器上
curl http://YOUR_SERVER_IP:8000/health
```

### 预期输出

```json
{
    "status": "healthy",
    "models_loaded": true,
    "version": "1.0.0",
    "mode": "mock"
}
```

---

## 获取服务器信息

```bash
# 查看公网IP
curl http://checkip.amazonaws.com

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs --tail=50
```

---

## 常见命令

```bash
# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 查看实时日志
docker-compose logs -f

# 更新代码
git pull && docker-compose up -d --build
```

---

## 下一步

- [ ] 测试所有 API 端点
- [ ] 更新云函数配置
- [ ] 进行端到端测试
- [ ] 配置域名和 HTTPS (可选)
- [ ] 设置监控和告警

---

## 遇到问题？

1. 查看详细文档: `TENCENT_CLOUD_DEPLOYMENT.md`
2. 检查日志: `docker-compose logs`
3. 验证防火墙: `ufw status`
4. 检查端口: `netstat -tlnp | grep 8000`

---

## API 地址

部署成功后，您的 API 地址为:

```
http://YOUR_SERVER_IP:8000
```

API 文档地址:

```
http://YOUR_SERVER_IP:8000/docs
```

---

**✅ 完成部署后，记得保存服务器 IP 和 API_KEY!**
