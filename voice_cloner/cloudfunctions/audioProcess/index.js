// 云函数：音频处理
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 音频处理云函数主入口
 */
exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'processRecording':
        return await processRecording(event);
      case 'validateAudio':
        return await validateAudio(event);
      case 'convertFormat':
        return await convertFormat(event);
      default:
        return {
          success: false,
          error: `未知操作: ${action}`
        };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      success: false,
      error: error.message || '处理失败'
    };
  }
};

/**
 * 处理录音文件
 */
async function processRecording(event) {
  const { fileID, duration, format, size } = event.data || event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    // 验证音频文件
    const validation = await validateAudioFile(fileID, duration, format, size);
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }
    
    // 下载文件到云存储临时空间
    const downloadResult = await cloud.downloadFile({
      fileID: fileID
    });
    
    const fileBuffer = downloadResult.fileContent;
    
    // 验证文件内容
    if (!fileBuffer || fileBuffer.length === 0) {
      return {
        success: false,
        error: '文件内容为空'
      };
    }
    
    // 检查文件大小
    if (fileBuffer.length !== size && size > 0) {
      console.warn(`文件大小不匹配: 预期 ${size}, 实际 ${fileBuffer.length}`);
    }
    
    // 由于微信云函数环境限制，无法直接使用ffmpeg
    // 这里我们保存原始文件信息到数据库
    // 实际的格式转换需要通过外部服务或本地处理
    
    // 保存音频记录到数据库
    const recordData = {
      openid: openid,
      originalFileID: fileID,
      processedFileID: fileID, // 暂时使用原始文件
      duration: duration,
      format: format,
      size: size,
      status: 'uploaded',
      needsConversion: format !== 'wav', // 标记是否需要转换
      createTime: new Date(),
      updateTime: new Date()
    };
    
    const result = await db.collection('audio_records').add({
      data: recordData
    });
    
    return {
      success: true,
      data: {
        fileID: fileID,
        processedFileID: fileID,
        recordID: result._id,
        needsConversion: recordData.needsConversion,
        message: recordData.needsConversion 
          ? '音频已上传，建议使用WAV格式以获得更好效果' 
          : '音频已上传并验证'
      }
    };
    
  } catch (error) {
    console.error('处理录音失败:', error);
    return {
      success: false,
      error: `处理失败: ${error.message}`
    };
  }
}

/**
 * 验证音频文件
 */
async function validateAudioFile(fileID, duration, format, size) {
  // 验证文件ID
  if (!fileID) {
    return {
      valid: false,
      error: '文件ID不能为空'
    };
  }
  
  // 验证时长 (30秒 - 300秒)
  if (duration < 30 || duration > 300) {
    return {
      valid: false,
      error: `音频时长${duration}秒不在有效范围内(30-300秒)`
    };
  }
  
  // 验证格式
  const validFormats = ['mp3', 'wav', 'aac', 'm4a'];
  if (!validFormats.includes(format.toLowerCase())) {
    return {
      valid: false,
      error: `不支持的音频格式: ${format}`
    };
  }
  
  // 验证文件大小 (最大50MB)
  const maxSize = 50 * 1024 * 1024;
  if (size > maxSize) {
    return {
      valid: false,
      error: `文件大小${(size / 1024 / 1024).toFixed(2)}MB超过限制(50MB)`
    };
  }
  
  // 验证文件是否存在
  try {
    const fileInfo = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    
    if (!fileInfo.fileList || fileInfo.fileList.length === 0) {
      return {
        valid: false,
        error: '文件不存在'
      };
    }
    
    const file = fileInfo.fileList[0];
    if (file.status !== 0) {
      return {
        valid: false,
        error: '文件访问失败'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `文件验证失败: ${error.message}`
    };
  }
  
  return {
    valid: true
  };
}

/**
 * 验证音频（单独调用）
 */
async function validateAudio(event) {
  const { fileID, duration, format, size } = event.data || event;
  
  const validation = await validateAudioFile(fileID, duration, format, size);
  
  return {
    success: validation.valid,
    error: validation.error,
    data: validation
  };
}

/**
 * 格式转换（占位函数，需要外部服务支持）
 */
async function convertFormat(event) {
  const { fileID, targetFormat } = event.data || event;
  
  // 由于云函数环境限制，实际的音频转换需要：
  // 1. 使用腾讯云的音视频处理服务
  // 2. 调用外部API服务
  // 3. 在服务器端部署ffmpeg
  
  return {
    success: false,
    error: '格式转换功能需要配置外部服务',
    data: {
      message: '建议使用16kHz单声道WAV格式录音以获得最佳效果',
      supportedFormats: ['mp3', 'wav', 'aac', 'm4a'],
      recommendedFormat: 'wav'
    }
  };
}
