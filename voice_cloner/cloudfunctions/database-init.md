# 云开发数据库初始化配置

## 数据库集合 (Collections)

### 1. voice_profiles (用户声纹档案)
```json
{
  "_id": "auto-generated",
  "userId": "string",           // 微信用户 openId
  "voiceProfileId": "string",   // 声纹档案 ID
  "embeddingVector": [],        // 声纹特征向量 (256维)
  "recordingUrls": [],          // 录音样本 URL 列表
  "status": "string",           // 状态: processing | ready | updating | failed
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "metadata": {
    "version": "number",        // 版本号
    "recordingDuration": "number", // 总录音时长(秒)
    "sampleRate": "number"      // 采样率
  }
}
```

索引:
- userId (升序,唯一)
- voiceProfileId (升序,唯一)
- status (升序)

### 2. tts_tasks (TTS 任务记录)
```json
{
  "_id": "auto-generated",
  "taskId": "string",           // 任务 ID
  "userId": "string",           // 用户 ID
  "voiceProfileId": "string",   // 声纹档案 ID
  "inputText": "string",        // 输入文本
  "outputAudioUrl": "string",   // 生成的音频 URL
  "duration": "number",         // 音频时长(秒)
  "status": "string",           // pending | processing | completed | failed
  "errorMessage": "string",     // 错误信息
  "createdAt": "timestamp",
  "completedAt": "timestamp"
}
```

索引:
- userId (升序)
- taskId (升序,唯一)
- status (升序)
- createdAt (降序)

### 3. audio_files (音频文件记录)
```json
{
  "_id": "auto-generated",
  "audioId": "string",          // 音频 ID
  "userId": "string",           // 用户 ID
  "taskId": "string",           // 关联的 TTS 任务 ID
  "fileUrl": "string",          // 音频文件 URL
  "fileSize": "number",         // 文件大小(字节)
  "duration": "number",         // 音频时长(秒)
  "format": "string",           // 音频格式 (mp3/wav)
  "text": "string",             // 原始文本
  "isFavorite": "boolean",      // 是否收藏
  "expiresAt": "timestamp",     // 过期时间(30天)
  "createdAt": "timestamp"
}
```

索引:
- userId (升序)
- audioId (升序,唯一)
- createdAt (降序)
- expiresAt (升序)
- isFavorite (升序)

### 4. users (用户信息)
```json
{
  "_id": "auto-generated",
  "openId": "string",           // 微信 openId
  "unionId": "string",          // 微信 unionId (可选)
  "nickName": "string",
  "avatarUrl": "string",
  "dailyQuota": "number",       // 每日配额
  "usedQuota": "number",        // 已使用配额
  "quotaResetAt": "timestamp",  // 配额重置时间
  "totalStorage": "number",     // 总存储空间(字节)
  "usedStorage": "number",      // 已使用存储
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp"
}
```

索引:
- openId (升序,唯一)
- unionId (升序)

## 存储桶 (Storage Buckets)

### 1. recordings (录音文件)
- 权限: 私有
- 生命周期: 永久保存(除非用户删除)

### 2. audio-outputs (生成的音频)
- 权限: 私有
- 生命周期: 30天自动删除(收藏除外)

## 云函数环境变量

需要在云开发控制台配置以下环境变量:
- ENV_ID: 云开发环境 ID
- DB_NAME: 数据库名称
- MAX_DAILY_QUOTA: 每日最大配额 (默认: 10)
- MAX_STORAGE_PER_USER: 每用户最大存储 (默认: 104857600, 即 100MB)
