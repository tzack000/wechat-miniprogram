// cloudfunctions/upload/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { uploadFile, generateCloudPath, validateFileType, checkStorageQuota } = require('../common/storage-utils');
const { AudioFileModel, UserModel } = require('../common/db-models');
const { validateRecording, validateAudioFile } = require('../common/validators');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'uploadRecording':
        return await uploadRecording(OPENID, data);
      
      case 'uploadAudio':
        return await uploadAudio(OPENID, data);
      
      case 'getUploadToken':
        return await getUploadToken(OPENID, data);
      
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (err) {
    console.error('上传失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * 上传录音文件
 */
async function uploadRecording(userId, data) {
  const { fileContent, filename, duration, format = 'mp3' } = data;
  
  // 验证录音数据
  const validation = validateRecording({
    fileUrl: 'temp',
    duration,
    format
  });
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', ')
    };
  }
  
  // 验证文件类型
  if (!validateFileType(filename, ['mp3', 'aac', 'wav'])) {
    return {
      success: false,
      error: '不支持的文件格式'
    };
  }
  
  // 检查存储配额
  const user = await UserModel.findByOpenId(userId);
  if (!user) {
    return {
      success: false,
      error: '用户不存在'
    };
  }
  
  const fileSize = Buffer.byteLength(fileContent);
  const quotaCheck = checkStorageQuota(userId, fileSize, user.usedStorage);
  
  if (!quotaCheck.canUpload) {
    return {
      success: false,
      error: `存储空间不足。已使用 ${quotaCheck.used}/${quotaCheck.quota}`,
      quotaInfo: quotaCheck
    };
  }
  
  // 生成云存储路径
  const timestamp = Date.now();
  const cloudPath = generateCloudPath(userId, 'recordings', `${timestamp}_original.${format}`);
  
  // 上传文件
  const uploadResult = await uploadFile(cloudPath, fileContent);
  
  // 更新用户存储使用量
  await UserModel.updateStorage(userId, user.usedStorage + fileSize);
  
  return {
    success: true,
    data: {
      fileID: uploadResult.fileID,
      cloudPath: uploadResult.cloudPath,
      fileSize: fileSize,
      duration: duration,
      format: format,
      uploadedAt: uploadResult.uploadedAt
    }
  };
}

/**
 * 上传生成的音频文件
 */
async function uploadAudio(userId, data) {
  const { fileContent, taskId, text, duration, format = 'mp3' } = data;
  
  // 验证音频数据
  const validation = validateAudioFile({
    userId,
    fileUrl: 'temp',
    taskId,
    fileSize: Buffer.byteLength(fileContent),
    duration,
    format
  });
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', ')
    };
  }
  
  // 检查存储配额
  const user = await UserModel.findByOpenId(userId);
  if (!user) {
    return {
      success: false,
      error: '用户不存在'
    };
  }
  
  const fileSize = Buffer.byteLength(fileContent);
  const quotaCheck = checkStorageQuota(userId, fileSize, user.usedStorage);
  
  if (!quotaCheck.canUpload) {
    return {
      success: false,
      error: `存储空间不足。已使用 ${quotaCheck.used}/${quotaCheck.quota}`,
      quotaInfo: quotaCheck
    };
  }
  
  // 生成云存储路径
  const filename = `${taskId}.${format}`;
  const cloudPath = generateCloudPath(userId, 'audio-outputs', filename);
  
  // 上传文件
  const uploadResult = await uploadFile(cloudPath, fileContent);
  
  // 创建音频文件记录
  const audio = await AudioFileModel.create({
    userId,
    taskId,
    fileUrl: uploadResult.fileID,
    fileSize,
    duration,
    format,
    text
  });
  
  // 更新用户存储使用量
  await UserModel.updateStorage(userId, user.usedStorage + fileSize);
  
  return {
    success: true,
    data: {
      audioId: audio.audioId,
      fileID: uploadResult.fileID,
      cloudPath: uploadResult.cloudPath,
      fileSize: fileSize,
      duration: duration,
      uploadedAt: uploadResult.uploadedAt
    }
  };
}

/**
 * 获取上传凭证(用于客户端直传)
 */
async function getUploadToken(userId, data) {
  const { filename, category = 'recordings' } = data;
  
  // 验证文件类型
  if (!validateFileType(filename)) {
    return {
      success: false,
      error: '不支持的文件格式'
    };
  }
  
  // 检查用户配额
  const user = await UserModel.findByOpenId(userId);
  if (!user) {
    return {
      success: false,
      error: '用户不存在'
    };
  }
  
  const quotaCheck = checkStorageQuota(userId, 10 * 1024 * 1024, user.usedStorage); // 假设最大10MB
  if (!quotaCheck.canUpload) {
    return {
      success: false,
      error: '存储空间不足',
      quotaInfo: quotaCheck
    };
  }
  
  // 生成上传路径
  const cloudPath = generateCloudPath(userId, category, filename);
  
  return {
    success: true,
    data: {
      cloudPath: cloudPath,
      maxSize: 10 * 1024 * 1024, // 10MB
      expiresIn: 3600, // 1小时
      quotaInfo: quotaCheck
    }
  };
}
