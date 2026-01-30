// cloudfunctions/common/storage-utils.js
// 云存储工具函数

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 生成签名 URL
 * @param {string} fileID - 云存储文件 ID
 * @param {number} expiresIn - 有效期(秒), 默认24小时
 * @returns {Promise<string>} 临时访问 URL
 */
async function generateSignedURL(fileID, expiresIn = 24 * 60 * 60) {
  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileID],
      maxAge: expiresIn
    });
    
    if (result.fileList && result.fileList.length > 0) {
      return result.fileList[0].tempFileURL;
    }
    
    throw new Error('获取临时链接失败');
  } catch (err) {
    console.error('生成签名URL失败:', err);
    throw err;
  }
}

/**
 * 批量生成签名 URL
 * @param {string[]} fileIDs - 云存储文件 ID 列表
 * @param {number} expiresIn - 有效期(秒)
 * @returns {Promise<Object[]>} 临时访问 URL 列表
 */
async function generateBatchSignedURLs(fileIDs, expiresIn = 24 * 60 * 60) {
  try {
    const result = await cloud.getTempFileURL({
      fileList: fileIDs,
      maxAge: expiresIn
    });
    
    return result.fileList.map(file => ({
      fileID: file.fileID,
      tempFileURL: file.tempFileURL,
      status: file.status,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    }));
  } catch (err) {
    console.error('批量生成签名URL失败:', err);
    throw err;
  }
}

/**
 * 上传文件到云存储
 * @param {string} cloudPath - 云端路径
 * @param {Buffer} fileContent - 文件内容
 * @returns {Promise<Object>} 上传结果
 */
async function uploadFile(cloudPath, fileContent) {
  try {
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    });
    
    return {
      fileID: result.fileID,
      cloudPath: cloudPath,
      uploadedAt: new Date()
    };
  } catch (err) {
    console.error('上传文件失败:', err);
    throw err;
  }
}

/**
 * 删除云存储文件
 * @param {string[]} fileIDs - 要删除的文件 ID 列表
 * @returns {Promise<Object>} 删除结果
 */
async function deleteFiles(fileIDs) {
  try {
    const result = await cloud.deleteFile({
      fileList: fileIDs
    });
    
    return {
      success: result.fileList.every(file => file.status === 0),
      deleted: result.fileList.filter(file => file.status === 0).length,
      failed: result.fileList.filter(file => file.status !== 0).length,
      details: result.fileList
    };
  } catch (err) {
    console.error('删除文件失败:', err);
    throw err;
  }
}

/**
 * 下载云存储文件
 * @param {string} fileID - 云存储文件 ID
 * @returns {Promise<Buffer>} 文件内容
 */
async function downloadFile(fileID) {
  try {
    const result = await cloud.downloadFile({
      fileID: fileID
    });
    
    return result.fileContent;
  } catch (err) {
    console.error('下载文件失败:', err);
    throw err;
  }
}

/**
 * 生成云存储路径
 * @param {string} userId - 用户 ID
 * @param {string} category - 分类 (recordings/audio-outputs/temp)
 * @param {string} filename - 文件名
 * @returns {string} 云存储路径
 */
function generateCloudPath(userId, category, filename) {
  const timestamp = Date.now();
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  switch (category) {
    case 'recordings':
      return `recordings/${sanitizedUserId}/${filename}`;
    
    case 'audio-outputs':
      return `audio-outputs/${sanitizedUserId}/${filename}`;
    
    case 'temp':
      const random = Math.random().toString(36).substr(2, 5);
      return `temp/${sanitizedUserId}/${timestamp}_${random}_${filename}`;
    
    default:
      throw new Error('未知的文件分类');
  }
}

/**
 * 验证文件类型
 * @param {string} filename - 文件名
 * @param {string[]} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否合法
 */
function validateFileType(filename, allowedTypes = ['mp3', 'wav', 'aac', 'm4a']) {
  const ext = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(ext);
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名
 */
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 检查存储配额
 * @param {string} userId - 用户 ID
 * @param {number} fileSize - 文件大小(字节)
 * @param {number} currentUsage - 当前使用量(字节)
 * @param {number} quota - 配额(字节), 默认 100MB
 * @returns {Object} 配额检查结果
 */
function checkStorageQuota(userId, fileSize, currentUsage, quota = 100 * 1024 * 1024) {
  const available = quota - currentUsage;
  const canUpload = fileSize <= available;
  
  return {
    canUpload,
    quota: formatFileSize(quota),
    used: formatFileSize(currentUsage),
    available: formatFileSize(available),
    fileSize: formatFileSize(fileSize),
    usagePercent: Math.round((currentUsage / quota) * 100)
  };
}

module.exports = {
  generateSignedURL,
  generateBatchSignedURLs,
  uploadFile,
  deleteFiles,
  downloadFile,
  generateCloudPath,
  validateFileType,
  getFileExtension,
  formatFileSize,
  checkStorageQuota
};
