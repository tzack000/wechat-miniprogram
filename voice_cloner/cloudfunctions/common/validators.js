// cloudfunctions/common/validators.js
// 数据验证和约束规则

/**
 * 验证声纹档案数据
 */
function validateVoiceProfile(data) {
  const errors = [];
  
  if (!data.userId) {
    errors.push('userId 是必填项');
  }
  
  if (data.embeddingVector && !Array.isArray(data.embeddingVector)) {
    errors.push('embeddingVector 必须是数组');
  }
  
  if (data.embeddingVector && data.embeddingVector.length > 0 && data.embeddingVector.length !== 256) {
    errors.push('embeddingVector 维度必须是256');
  }
  
  if (data.status && !['processing', 'ready', 'updating', 'failed'].includes(data.status)) {
    errors.push('status 必须是 processing, ready, updating 或 failed');
  }
  
  if (data.recordingUrls && !Array.isArray(data.recordingUrls)) {
    errors.push('recordingUrls 必须是数组');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证TTS任务数据
 */
function validateTTSTask(data) {
  const errors = [];
  
  if (!data.userId) {
    errors.push('userId 是必填项');
  }
  
  if (!data.voiceProfileId) {
    errors.push('voiceProfileId 是必填项');
  }
  
  if (!data.inputText) {
    errors.push('inputText 是必填项');
  }
  
  if (data.inputText && data.inputText.length > 500) {
    errors.push('inputText 长度不能超过500字');
  }
  
  if (data.inputText && data.inputText.length < 1) {
    errors.push('inputText 长度不能少于1字');
  }
  
  if (data.status && !['pending', 'processing', 'completed', 'failed'].includes(data.status)) {
    errors.push('status 必须是 pending, processing, completed 或 failed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证音频文件数据
 */
function validateAudioFile(data) {
  const errors = [];
  
  if (!data.userId) {
    errors.push('userId 是必填项');
  }
  
  if (!data.fileUrl) {
    errors.push('fileUrl 是必填项');
  }
  
  if (!data.taskId) {
    errors.push('taskId 是必填项');
  }
  
  if (data.format && !['mp3', 'wav', 'm4a', 'aac'].includes(data.format)) {
    errors.push('format 必须是 mp3, wav, m4a 或 aac');
  }
  
  if (data.fileSize && data.fileSize > 10 * 1024 * 1024) { // 10MB
    errors.push('文件大小不能超过10MB');
  }
  
  if (data.duration && data.duration > 600) { // 10分钟
    errors.push('音频时长不能超过10分钟');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证用户数据
 */
function validateUser(data) {
  const errors = [];
  
  if (!data.openId) {
    errors.push('openId 是必填项');
  }
  
  if (data.dailyQuota && (data.dailyQuota < 0 || data.dailyQuota > 100)) {
    errors.push('dailyQuota 必须在 0-100 之间');
  }
  
  if (data.totalStorage && data.totalStorage < 0) {
    errors.push('totalStorage 不能为负数');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证录音文件
 */
function validateRecording(data) {
  const errors = [];
  
  if (!data.fileUrl) {
    errors.push('fileUrl 是必填项');
  }
  
  if (!data.duration) {
    errors.push('duration 是必填项');
  }
  
  if (data.duration < 30) {
    errors.push('录音时长不能少于30秒');
  }
  
  if (data.duration > 300) {
    errors.push('录音时长不能超过5分钟');
  }
  
  if (data.format && !['mp3', 'aac', 'wav'].includes(data.format)) {
    errors.push('录音格式必须是 mp3, aac 或 wav');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 清理和规范化文本
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  // 去除首尾空格
  text = text.trim();
  
  // 移除特殊字符(保留中文、英文、数字、标点)
  text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s,.!?;:，。!?;:、]/g, '');
  
  // 限制长度
  if (text.length > 500) {
    text = text.substring(0, 500);
  }
  
  return text;
}

/**
 * 验证文本内容安全
 */
function checkTextSafety(text) {
  // 敏感词列表(示例,生产环境需要更完善的内容安全检测)
  const sensitiveWords = ['暴力', '色情', '政治敏感'];
  
  for (const word of sensitiveWords) {
    if (text.includes(word)) {
      return {
        safe: false,
        reason: '文本包含敏感内容'
      };
    }
  }
  
  return {
    safe: true
  };
}

module.exports = {
  validateVoiceProfile,
  validateTTSTask,
  validateAudioFile,
  validateUser,
  validateRecording,
  sanitizeText,
  checkTextSafety
};
