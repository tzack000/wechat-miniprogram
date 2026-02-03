# Extract 云函数 - 声音特征提取

## 功能说明

extract 云函数负责从用户录音中提取声纹特征向量，这是语音克隆的核心步骤。

### 主要功能

1. **从云存储下载音频文件** - 获取用户上传的录音
2. **调用后端 API 提取声纹** - 使用 SV2TTS Encoder 模型提取 256 维声纹向量
3. **验证声纹有效性** - 检查声纹的统计特性
4. **保存到数据库** - 将声纹向量存储到 MongoDB
5. **版本管理** - 支持声纹更新和历史版本备份
6. **错误处理和重试** - 自动重试失败的请求

## 依赖项

```json
{
  "wx-server-sdk": "~2.6.1",  // 微信云开发 SDK
  "axios": "^1.6.0",          // HTTP 客户端
  "form-data": "^4.0.0"       // 表单数据处理
}
```

## 配置

### 环境变量

在云开发控制台配置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `API_BASE_URL` | 后端 API 服务器地址 | `http://your-server.com:8000` |

### 配置步骤

1. 打开微信开发者工具
2. 进入「云开发」→「云函数」
3. 找到 `extract` 云函数
4. 点击「配置」→「环境变量」
5. 添加 `API_BASE_URL` 变量

## 调用方式

### 参数

```javascript
{
  audioFileId: string,      // 必填 - 云存储中的音频文件ID
  voiceProfileId: string,   // 必填 - 声纹档案ID
  action: string            // 可选 - 操作类型：'extract'(默认) 或 'update'
}
```

### 返回值

**成功**:
```javascript
{
  success: true,
  data: {
    voiceProfileId: string,         // 声纹档案ID
    embeddingDimension: number,     // 声纹维度（256）
    version: number,                // 版本号
    status: 'ready',                // 状态
    validation: {                   // 验证信息
      mean: number,
      std: number,
      min: number,
      max: number
    }
  },
  message: '声纹特征提取成功'
}
```

**失败**:
```javascript
{
  success: false,
  error: string,           // 错误信息
  errorDetails: string     // 详细错误
}
```

### 示例代码

**小程序端调用**:

```javascript
// 提取声纹特征
wx.cloud.callFunction({
  name: 'extract',
  data: {
    audioFileId: 'cloud://xxx.wav',
    voiceProfileId: 'profile_123',
    action: 'extract'
  },
  success: (res) => {
    if (res.result.success) {
      console.log('声纹提取成功:', res.result.data);
      // 跳转到成功页面或进行下一步操作
    } else {
      console.error('声纹提取失败:', res.result.error);
      wx.showToast({
        title: res.result.error,
        icon: 'none'
      });
    }
  },
  fail: (err) => {
    console.error('调用云函数失败:', err);
  }
});

// 更新声纹特征
wx.cloud.callFunction({
  name: 'extract',
  data: {
    audioFileId: 'cloud://xxx.wav',
    voiceProfileId: 'profile_123',
    action: 'update'  // 更新模式，会备份旧版本
  },
  success: (res) => {
    if (res.result.success) {
      console.log('声纹更新成功，新版本:', res.result.data.version);
    }
  }
});
```

## 数据库结构

### voice_profiles 集合

```javascript
{
  _id: string,
  _openid: string,
  status: 'pending' | 'processing' | 'ready' | 'failed',
  embedding: number[],           // 256维声纹向量
  embeddingDimension: number,    // 维度（256）
  version: number,               // 版本号
  audioFileId: string,           // 音频文件ID
  createdTime: Date,
  lastUpdated: Date,
  processingStartTime: Date,
  processingEndTime: Date,
  lastError: string,
  validation: {
    mean: number,
    std: number,
    min: number,
    max: number
  }
}
```

### voice_profile_history 集合（历史版本）

```javascript
{
  _id: string,
  voiceProfileId: string,        // 关联的声纹档案ID
  _openid: string,
  version: number,               // 版本号
  embedding: number[],
  embeddingDimension: number,
  createdTime: Date,
  backedUpTime: Date
}
```

## 工作流程

```
1. 用户调用云函数
   ↓
2. 验证参数和权限
   ↓
3. 更新状态为 'processing'
   ↓
4. 从云存储下载音频文件
   ↓
5. 调用后端 API 提取声纹（带重试机制）
   ↓
6. 验证声纹有效性
   ↓
7. 备份旧版本（如果是更新操作）
   ↓
8. 保存到数据库
   ↓
9. 更新状态为 'ready'
   ↓
10. 记录审计日志
   ↓
11. 返回结果
```

## 错误处理

### 重试机制

- **最大重试次数**: 3 次
- **重试延迟**: 2 秒
- **适用场景**: 网络错误、API 暂时不可用

### 错误类型

| 错误类型 | 原因 | 解决方法 |
|---------|------|---------|
| `缺少音频文件ID` | 参数缺失 | 检查调用参数 |
| `声纹档案不存在` | 无效的档案ID | 先创建声纹档案 |
| `无权访问此声纹档案` | 权限错误 | 确认用户身份 |
| `下载音频文件失败` | 云存储问题 | 检查文件是否存在 |
| `无法连接到 API 服务器` | 网络/服务器问题 | 检查 API_BASE_URL 配置 |
| `声纹特征维度错误` | 模型输出异常 | 检查后端模型 |
| `声纹特征方差过小` | 音频质量差 | 重新录制 |

## 部署步骤

### 1. 安装依赖

```bash
cd cloudfunctions/extract
npm install
```

### 2. 配置环境变量

在云开发控制台配置 `API_BASE_URL`

### 3. 上传云函数

在微信开发者工具中：
- 右键 `extract` 文件夹
- 选择「上传并部署：云端安装依赖」

### 4. 配置云函数超时

由于声纹提取可能需要较长时间，建议设置超时时间：

- 进入云开发控制台
- 云函数 → extract → 配置
- 超时时间：设置为 120 秒

### 5. 测试

在云开发控制台测试云函数：

```json
{
  "audioFileId": "cloud://test.wav",
  "voiceProfileId": "test_profile_id",
  "action": "extract"
}
```

## 性能优化

### 1. 音频预处理

在上传前进行音频预处理：
- 转换为 WAV 格式
- 采样率 16kHz
- 单声道
- 控制文件大小

### 2. 并发控制

云函数自动处理并发，但建议：
- 控制单用户请求频率
- 使用队列处理批量请求

### 3. 缓存策略

- 成功提取的声纹会缓存在数据库
- 避免重复提取相同音频

## 监控和日志

### 审计日志

所有操作都会记录到 `audit_logs` 集合：

```javascript
{
  _openid: string,
  action: 'voice_profile_extraction',
  resourceType: 'voice_profile',
  resourceId: string,
  details: {
    action: 'extract' | 'update',
    audioFileId: string,
    embeddingDimension: number,
    version: number
  },
  timestamp: Date,
  success: boolean
}
```

### 查看日志

1. 云开发控制台 → 云函数 → extract
2. 点击「日志」标签
3. 查看实时日志和历史日志

### 关键日志标记

- `[Extract]` - 功能日志
- `✓` - 成功操作
- `✗` - 失败操作

## 安全考虑

1. **权限验证** - 只能提取自己的声纹
2. **数据隔离** - 使用 `_openid` 隔离用户数据
3. **审计追踪** - 记录所有操作日志
4. **错误信息** - 避免泄露敏感信息

## 故障排查

### 问题：调用云函数超时

**可能原因**:
- 后端 API 服务器响应慢
- 音频文件过大
- 网络连接问题

**解决方法**:
1. 检查后端服务器状态
2. 增加云函数超时时间
3. 优化音频文件大小

### 问题：声纹提取失败

**可能原因**:
- API_BASE_URL 配置错误
- 后端服务未启动
- 音频格式不支持

**解决方法**:
1. 验证 API_BASE_URL 配置
2. 检查后端服务日志
3. 确认音频格式正确

### 问题：声纹特征无效

**可能原因**:
- 录音质量差
- 录音时长过短
- 背景噪音过大

**解决方法**:
1. 引导用户重新录制
2. 提高录音质量要求
3. 添加音频质量检测

## 后续优化

1. **异步任务队列** - 使用消息队列处理大量请求
2. **缓存机制** - 缓存热点数据
3. **批量处理** - 支持批量提取
4. **进度通知** - 实时推送处理进度
5. **模型优化** - 提升提取速度和质量

## 相关文档

- [后端 API 服务器文档](../../voice-cloning-server/README.md)
- [数据库设计文档](../database-init.md)
- [开发进度报告](../../DEVELOPMENT_PROGRESS.md)

## 许可证

MIT
