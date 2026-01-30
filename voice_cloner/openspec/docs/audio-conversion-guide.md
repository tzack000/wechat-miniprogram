# 音频格式转换方案

## 概述

由于微信云函数环境的限制，无法直接使用 ffmpeg 等音频处理库。本文档说明三种可选的音频格式转换方案。

## 方案一：使用腾讯云音视频处理服务（推荐）

### 优点
- 官方服务，稳定可靠
- 与微信云开发集成良好
- 支持多种音频格式转换

### 实施步骤

1. **开通腾讯云音视频处理服务**
   - 登录腾讯云控制台
   - 开通云点播（VOD）服务
   - 配置音频转换模板

2. **配置云函数**
```javascript
// cloudfunctions/audioProcess/index.js
const tencentcloud = require("tencentcloud-sdk-nodejs");
const VodClient = tencentcloud.vod.v20180717.Client;

async function convertWithTencentCloud(fileID, targetFormat) {
  const client = new VodClient({
    credential: {
      secretId: "YOUR_SECRET_ID",
      secretKey: "YOUR_SECRET_KEY"
    },
    region: "ap-guangzhou"
  });
  
  // 获取文件临时URL
  const tempURL = await cloud.getTempFileURL({
    fileList: [fileID]
  });
  
  // 调用音频转换接口
  const params = {
    InputInfo: {
      Type: "URL",
      Url: tempURL.fileList[0].tempFileURL
    },
    OutputConfig: {
      Container: targetFormat,
      AudioStream: {
        Codec: "pcm_s16le",
        SampleRate: 16000,
        Channel: 1
      }
    }
  };
  
  const response = await client.ProcessMedia(params);
  return response;
}
```

3. **安装依赖**
```bash
cd cloudfunctions/audioProcess
npm install tencentcloud-sdk-nodejs
```

## 方案二：调用外部API服务

### 适用场景
- 需要自定义音频处理逻辑
- 已有独立的音频处理服务器

### 实施步骤

1. **部署音频处理服务器**
   - 在服务器上安装 ffmpeg
   - 创建 REST API 接口

2. **服务器端代码示例（Node.js + Express）**
```javascript
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

app.post('/convert', multer().single('audio'), async (req, res) => {
  const audioBuffer = req.file.buffer;
  const targetFormat = req.body.format || 'wav';
  
  // 保存临时文件
  const inputPath = `/tmp/input_${Date.now()}.mp3`;
  const outputPath = `/tmp/output_${Date.now()}.${targetFormat}`;
  
  fs.writeFileSync(inputPath, audioBuffer);
  
  // 使用 ffmpeg 转换
  ffmpeg(inputPath)
    .toFormat(targetFormat)
    .audioFrequency(16000)
    .audioChannels(1)
    .on('end', () => {
      const outputBuffer = fs.readFileSync(outputPath);
      res.send(outputBuffer);
      
      // 清理临时文件
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    })
    .on('error', (err) => {
      res.status(500).send({ error: err.message });
    })
    .save(outputPath);
});

app.listen(3000);
```

3. **云函数调用外部API**
```javascript
const axios = require('axios');

async function convertWithExternalAPI(fileID, targetFormat) {
  // 下载文件
  const downloadResult = await cloud.downloadFile({
    fileID: fileID
  });
  
  // 调用外部API
  const response = await axios.post('https://your-server.com/convert', 
    downloadResult.fileContent,
    {
      headers: {
        'Content-Type': 'audio/mpeg'
      },
      params: {
        format: targetFormat
      },
      responseType: 'arraybuffer'
    }
  );
  
  // 上传转换后的文件
  const uploadResult = await cloud.uploadFile({
    cloudPath: `converted/${Date.now()}.${targetFormat}`,
    fileContent: Buffer.from(response.data)
  });
  
  return uploadResult.fileID;
}
```

## 方案三：客户端转换（限制较多）

### 说明
微信小程序客户端能力有限，不推荐在客户端进行格式转换。但可以通过以下方式优化：

1. **录音时直接使用最佳格式**
```javascript
// 在录音时指定格式
wx.getRecorderManager().start({
  duration: 300000,
  sampleRate: 16000,
  numberOfChannels: 1,
  format: 'wav',  // 直接使用 WAV 格式
  encodeBitRate: 48000
});
```

2. **提示用户选择合适的录音设备和环境**

## 当前实现状态

目前项目中：
- ✅ 已实现音频文件验证（格式、大小、时长）
- ✅ 已实现上传进度显示和重试机制
- ⚠️ 格式转换功能需要根据上述方案之一进行配置

## 建议的实施顺序

1. **短期**：使用方案三，在录音时直接指定 WAV 格式
2. **中期**：实施方案二，搭建独立的音频处理服务器
3. **长期**：实施方案一，使用腾讯云官方服务（成本较高但更稳定）

## 性能考虑

- MP3 转 WAV: 约 2-5 秒（取决于文件大小）
- 推荐在后台异步处理，不阻塞用户操作
- 对于5分钟的录音，建议设置30秒的超时时间

## 成本估算

| 方案 | 初始成本 | 运营成本（每月1000次转换） |
|------|----------|--------------------------|
| 方案一 | ¥0 | ¥50-200 |
| 方案二 | ¥100-500（服务器） | ¥100-200 |
| 方案三 | ¥0 | ¥0 |

## 参考资料

- [腾讯云音视频处理](https://cloud.tencent.com/document/product/266)
- [ffmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [微信小程序录音管理器](https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.html)
