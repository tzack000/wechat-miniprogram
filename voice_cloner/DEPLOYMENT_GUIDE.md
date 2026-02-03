# 声音特征提取服务 - 部署和测试指南

## 📋 目录

1. [系统架构](#系统架构)
2. [部署步骤](#部署步骤)
3. [配置说明](#配置说明)
4. [测试流程](#测试流程)
5. [故障排查](#故障排查)

---

## 系统架构

```
┌─────────────────┐
│   微信小程序     │
│  (录音功能)     │
└────────┬────────┘
         │ 1. 上传音频到云存储
         ↓
┌─────────────────┐
│   云存储         │
│  (音频文件)     │
└────────┬────────┘
         │ 2. 获取文件ID
         ↓
┌─────────────────┐
│  extract云函数   │
│  (协调器)       │
└────────┬────────┘
         │ 3. 下载音频
         │ 4. 调用API
         ↓
┌─────────────────┐
│  FastAPI后端     │
│  (AI模型)       │
└────────┬────────┘
         │ 5. 返回声纹向量
         ↓
┌─────────────────┐
│   MongoDB        │
│  (声纹档案)     │
└─────────────────┘
```

---

## 部署步骤

### 第一步：部署后端 API 服务器

#### 选项 A：本地部署（开发测试）

1. **安装 Python 环境**
   ```bash
   # 需要 Python 3.8+
   python --version
   ```

2. **安装依赖**
   ```bash
   cd voice-cloning-server
   pip install -r requirements.txt
   ```

3. **下载模型文件**
   
   由于模型文件较大，需要手动下载：
   
   ```bash
   mkdir -p models/encoder models/synthesizer models/vocoder
   ```
   
   下载地址（需要根据实际情况提供）：
   - Encoder: [下载链接]
   - Synthesizer: [下载链接]
   - Vocoder: [下载链接]
   
   放置位置：
   ```
   models/
   ├── encoder/
   │   └── encoder.pt
   ├── synthesizer/
   │   └── synthesizer.pt
   └── vocoder/
       └── vocoder.pt
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

5. **启动服务**
   ```bash
   # 开发模式
   uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
   
   # 访问 http://localhost:8000/docs 查看 API 文档
   ```

#### 选项 B：云服务器部署（生产环境）

1. **选择云服务商**
   - 阿里云 ECS
   - 腾讯云 CVM
   - AWS EC2
   
   **推荐配置**:
   - CPU: 4核+
   - 内存: 8GB+
   - 存储: 50GB+
   - （可选）GPU: NVIDIA T4 或更好

2. **使用 Docker 部署**
   ```bash
   # 构建镜像
   docker build -t voice-cloning-api:latest .
   
   # 运行容器
   docker run -d \
     --name voice-api \
     -p 8000:8000 \
     -v $(pwd)/models:/app/models \
     -e API_BASE_URL=http://your-domain:8000 \
     voice-cloning-api:latest
   ```

3. **配置域名和 HTTPS**
   ```bash
   # 使用 Nginx 反向代理
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **设置开机自启动**
   ```bash
   # 使用 systemd
   sudo systemctl enable voice-api
   sudo systemctl start voice-api
   ```

### 第二步：配置云函数

1. **在云开发控制台配置环境变量**
   
   进入：云开发控制台 → 云函数 → extract → 配置 → 环境变量
   
   添加：
   ```
   API_BASE_URL = http://your-api-server:8000
   ```
   
   或者（如果使用域名）：
   ```
   API_BASE_URL = https://api.yourdomain.com
   ```

2. **部署 extract 云函数**
   
   在微信开发者工具中：
   - 右键 `cloudfunctions/extract` 文件夹
   - 选择「上传并部署：云端安装依赖」
   - 等待部署完成

3. **配置超时时间**
   
   云开发控制台 → 云函数 → extract → 配置
   - 超时时间：120 秒
   - 内存：256MB

### 第三步：创建数据库集合和索引

在云开发控制台 → 数据库：

1. **创建集合**
   ```
   voice_profiles
   voice_profile_history
   audit_logs
   ```

2. **设置权限**
   
   `voice_profiles`:
   ```json
   {
     "read": "doc._openid == auth.openid",
     "write": "doc._openid == auth.openid"
   }
   ```
   
   `voice_profile_history`:
   ```json
   {
     "read": "doc._openid == auth.openid",
     "write": false
   }
   ```
   
   `audit_logs`:
   ```json
   {
     "read": false,
     "write": true
   }
   ```

3. **创建索引**
   
   `voice_profiles`:
   - `_openid` (升序)
   - `status` (升序)
   - `createdTime` (降序)
   
   `voice_profile_history`:
   - `voiceProfileId` (升序)
   - `version` (降序)

---

## 配置说明

### 后端服务配置 (.env)

```bash
# API 服务器配置
API_HOST=0.0.0.0
API_PORT=8000

# 模型路径
MODEL_ENCODER_PATH=models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=models/vocoder/vocoder.pt

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/api.log

# 性能配置
MAX_WORKERS=4
ENABLE_GPU=false  # 如果有 GPU，设置为 true

# 安全配置
API_KEY=your-secret-api-key
ALLOWED_ORIGINS=*  # 生产环境应限制域名
```

### 云函数配置

在云开发控制台配置：

| 变量名 | 值 | 说明 |
|--------|---|------|
| API_BASE_URL | http://your-server:8000 | 后端 API 地址 |

---

## 测试流程

### 1. 测试后端 API 服务器

#### 健康检查

```bash
curl http://localhost:8000/health
```

期望输出：
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0"
}
```

#### 测试声纹提取

```bash
curl -X POST http://localhost:8000/api/v1/extract-embedding \
  -F "audio=@test_audio.wav" \
  -H "Content-Type: multipart/form-data"
```

期望输出：
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "dimension": 256
}
```

### 2. 测试云函数

#### 方法 A：云开发控制台测试

1. 打开云开发控制台
2. 云函数 → extract
3. 点击「测试」标签
4. 输入测试参数：
   ```json
   {
     "audioFileId": "cloud://test-env.74xx-test-env-123456/audio/test.wav",
     "voiceProfileId": "test_profile_123",
     "action": "extract"
   }
   ```
5. 点击「运行测试」

#### 方法 B：小程序端测试

在小程序页面中添加测试代码：

```javascript
// pages/test/test.js
Page({
  testExtract() {
    wx.showLoading({ title: '测试中...' });
    
    wx.cloud.callFunction({
      name: 'extract',
      data: {
        audioFileId: 'cloud://xxx.wav', // 替换为实际文件ID
        voiceProfileId: 'test_profile',
        action: 'extract'
      },
      success: (res) => {
        console.log('测试成功:', res);
        wx.hideLoading();
        wx.showModal({
          title: '测试结果',
          content: JSON.stringify(res.result, null, 2),
          showCancel: false
        });
      },
      fail: (err) => {
        console.error('测试失败:', err);
        wx.hideLoading();
        wx.showModal({
          title: '测试失败',
          content: JSON.stringify(err, null, 2),
          showCancel: false
        });
      }
    });
  }
});
```

### 3. 端到端测试

完整流程测试：

```javascript
// 1. 录音
const recorderManager = wx.getRecorderManager();
recorderManager.start({
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3'
});

// 2. 停止录音
setTimeout(() => {
  recorderManager.stop();
}, 5000);

// 3. 上传音频
recorderManager.onStop((res) => {
  const { tempFilePath } = res;
  
  wx.cloud.uploadFile({
    cloudPath: `audio/${Date.now()}.mp3`,
    filePath: tempFilePath,
    success: (uploadRes) => {
      const audioFileId = uploadRes.fileID;
      
      // 4. 创建声纹档案
      const db = wx.cloud.database();
      db.collection('voice_profiles').add({
        data: {
          status: 'pending',
          audioFileId: audioFileId,
          createdTime: new Date()
        },
        success: (addRes) => {
          const voiceProfileId = addRes._id;
          
          // 5. 提取声纹
          wx.cloud.callFunction({
            name: 'extract',
            data: {
              audioFileId: audioFileId,
              voiceProfileId: voiceProfileId,
              action: 'extract'
            },
            success: (extractRes) => {
              console.log('声纹提取成功:', extractRes);
              wx.showToast({
                title: '声纹提取成功',
                icon: 'success'
              });
            }
          });
        }
      });
    }
  });
});
```

### 4. 性能测试

测试并发处理能力：

```bash
# 使用 Apache Bench
ab -n 10 -c 2 -p test_audio.wav \
   -T 'multipart/form-data; boundary=----WebKitFormBoundary' \
   http://localhost:8000/api/v1/extract-embedding

# 查看响应时间和成功率
```

---

## 故障排查

### 问题 1：后端 API 无法启动

**症状**：
```
ModuleNotFoundError: No module named 'xxx'
```

**解决**：
```bash
pip install -r requirements.txt
```

**症状**：
```
FileNotFoundError: [Errno 2] No such file or directory: 'models/encoder/encoder.pt'
```

**解决**：
1. 确认模型文件已下载
2. 检查路径配置
3. 查看 .env 文件中的路径设置

### 问题 2：云函数调用失败

**症状**：
```json
{
  "success": false,
  "error": "无法连接到 API 服务器"
}
```

**解决**：
1. 检查 API_BASE_URL 配置
2. 确认后端服务器正在运行
3. 测试网络连接：
   ```bash
   curl http://your-server:8000/health
   ```
4. 检查防火墙设置

### 问题 3：声纹提取超时

**症状**：
```
云函数执行超时
```

**解决**：
1. 增加云函数超时时间（最大 60秒）
2. 优化后端处理速度
3. 使用 GPU 加速
4. 考虑异步处理方案

### 问题 4：声纹特征无效

**症状**：
```json
{
  "error": "声纹特征方差过小"
}
```

**解决**：
1. 检查音频质量
2. 确认录音时长（建议 30秒以上）
3. 降低背景噪音
4. 重新录制

### 问题 5：权限错误

**症状**：
```
errCode: -502001 database permission denied
```

**解决**：
1. 检查数据库权限规则
2. 确认用户已登录
3. 验证 openid 正确

---

## 监控和日志

### 后端日志

查看后端日志：
```bash
tail -f logs/api.log
```

关键日志标记：
- `✓` - 成功操作
- `开始` - 操作开始
- `失败` - 操作失败

### 云函数日志

1. 云开发控制台 → 云函数 → extract
2. 点击「日志」标签
3. 实时查看日志

### 数据库审计

查询审计日志：
```javascript
db.collection('audit_logs')
  .where({
    action: 'voice_profile_extraction',
    timestamp: _.gte(new Date(Date.now() - 24*60*60*1000)) // 最近24小时
  })
  .orderBy('timestamp', 'desc')
  .get()
```

---

## 性能优化建议

### 1. 使用 GPU 加速

```python
# 在后端代码中
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
```

### 2. 模型量化

```python
# 减小模型大小，提升推理速度
quantized_model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
```

### 3. 批量处理

支持批量提取声纹，提高吞吐量

### 4. 缓存机制

对相同音频文件缓存结果

### 5. 异步队列

使用消息队列处理大量请求：
- Redis + Bull
- RabbitMQ
- AWS SQS

---

## 安全建议

1. **API 密钥认证**
   ```python
   # 在后端添加 API Key 验证
   @app.middleware("http")
   async def verify_api_key(request: Request, call_next):
       api_key = request.headers.get("X-API-Key")
       if api_key != os.getenv("API_KEY"):
           return JSONResponse({"error": "Invalid API key"}, status_code=401)
       return await call_next(request)
   ```

2. **HTTPS 加密**
   - 使用 SSL 证书
   - 强制 HTTPS 访问

3. **限流保护**
   ```python
   # 使用 slowapi 限流
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/api/v1/extract-embedding")
   @limiter.limit("10/minute")
   async def extract_embedding(...):
       ...
   ```

4. **输入验证**
   - 验证文件格式
   - 限制文件大小
   - 检查音频时长

---

## 下一步

完成声音特征提取服务后，您可以继续：

1. ✅ [实现用户声纹档案管理](../TODO.md#sprint-3)
2. ✅ [实现文本转语音合成服务](../TODO.md#sprint-2)
3. ✅ [完善前端界面](../TODO.md#sprint-5)

---

## 相关文档

- [Extract 云函数 README](README.md)
- [后端 API 服务器文档](../../voice-cloning-server/README.md)
- [开发进度报告](../../DEVELOPMENT_PROGRESS.md)
- [快速 TODO 列表](../../TODO.md)

---

**祝您部署顺利！🚀**
