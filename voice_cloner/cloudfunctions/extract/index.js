// cloudfunctions/extract/index.js
const cloud = require('wx-server-sdk');
const axios = require('axios');
const FormData = require('form-data');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://your-api-server:8000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2秒

/**
 * 声音特征提取云函数
 * 
 * 功能：
 * 1. 从云存储下载用户录音文件
 * 2. 调用后端 API 提取声纹特征
 * 3. 验证声纹特征有效性
 * 4. 保存到数据库
 * 5. 更新声纹档案状态
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  
  const {
    audioFileId,      // 音频文件ID（云存储文件ID）
    voiceProfileId,   // 声纹档案ID
    action = 'extract' // 操作类型：extract（提取）, update（更新）
  } = event;
  
  console.log(`[Extract] 开始处理 - User: ${OPENID}, Action: ${action}`);
  console.log(`[Extract] 音频文件ID: ${audioFileId}, 声纹档案ID: ${voiceProfileId}`);
  
  try {
    // 1. 验证参数
    if (!audioFileId) {
      throw new Error('缺少音频文件ID');
    }
    
    if (!voiceProfileId) {
      throw new Error('缺少声纹档案ID');
    }
    
    // 2. 查询声纹档案，验证权限
    const profileDoc = await db.collection('voice_profiles')
      .doc(voiceProfileId)
      .get();
    
    if (!profileDoc.data || profileDoc.data.length === 0) {
      throw new Error('声纹档案不存在');
    }
    
    const profile = profileDoc.data[0] || profileDoc.data;
    
    // 验证用户权限
    if (profile._openid !== OPENID) {
      throw new Error('无权访问此声纹档案');
    }
    
    // 3. 更新状态为"处理中"
    await db.collection('voice_profiles')
      .doc(voiceProfileId)
      .update({
        data: {
          status: 'processing',
          processingStartTime: db.serverDate(),
          lastError: null
        }
      });
    
    console.log('[Extract] 状态更新为 processing');
    
    // 4. 下载音频文件
    console.log('[Extract] 开始下载音频文件...');
    const audioBuffer = await downloadAudioFile(audioFileId);
    console.log(`[Extract] 音频文件下载完成，大小: ${audioBuffer.length} bytes`);
    
    // 5. 调用后端 API 提取声纹特征
    console.log('[Extract] 开始提取声纹特征...');
    const embeddingResult = await extractEmbeddingWithRetry(audioBuffer, audioFileId);
    
    if (!embeddingResult.success) {
      throw new Error(embeddingResult.error || '声纹提取失败');
    }
    
    const { embedding, dimension } = embeddingResult;
    console.log(`[Extract] 声纹提取成功，维度: ${dimension}`);
    
    // 6. 验证声纹特征有效性
    console.log('[Extract] 验证声纹特征...');
    const validation = validateEmbedding(embedding);
    
    if (!validation.valid) {
      throw new Error(`声纹特征无效: ${validation.reason}`);
    }
    
    console.log('[Extract] 声纹特征验证通过');
    
    // 7. 保存到数据库
    const updateData = {
      embedding: embedding,
      embeddingDimension: dimension,
      status: 'ready',
      processingEndTime: db.serverDate(),
      lastUpdated: db.serverDate(),
      validation: {
        mean: validation.mean,
        std: validation.std,
        min: validation.min,
        max: validation.max
      }
    };
    
    // 如果是首次提取，保存版本1
    if (action === 'extract' && !profile.embedding) {
      updateData.version = 1;
      updateData.createdTime = db.serverDate();
    }
    // 如果是更新，增加版本号并备份旧版本
    else if (action === 'update' && profile.embedding) {
      updateData.version = (profile.version || 1) + 1;
      
      // 备份旧版本
      await db.collection('voice_profile_history').add({
        data: {
          voiceProfileId: voiceProfileId,
          _openid: OPENID,
          version: profile.version || 1,
          embedding: profile.embedding,
          embeddingDimension: profile.embeddingDimension,
          createdTime: profile.lastUpdated || profile.createdTime,
          backedUpTime: db.serverDate()
        }
      });
      
      console.log(`[Extract] 已备份版本 ${profile.version || 1}`);
    }
    
    await db.collection('voice_profiles')
      .doc(voiceProfileId)
      .update({
        data: updateData
      });
    
    console.log('[Extract] 数据保存成功');
    
    // 8. 记录审计日志
    await db.collection('audit_logs').add({
      data: {
        _openid: OPENID,
        action: 'voice_profile_extraction',
        resourceType: 'voice_profile',
        resourceId: voiceProfileId,
        details: {
          action: action,
          audioFileId: audioFileId,
          embeddingDimension: dimension,
          version: updateData.version
        },
        timestamp: db.serverDate(),
        success: true
      }
    });
    
    // 9. 返回结果
    return {
      success: true,
      data: {
        voiceProfileId: voiceProfileId,
        embeddingDimension: dimension,
        version: updateData.version,
        status: 'ready',
        validation: validation
      },
      message: '声纹特征提取成功'
    };
    
  } catch (error) {
    console.error('[Extract] 错误:', error);
    
    // 更新声纹档案状态为失败
    if (voiceProfileId) {
      try {
        await db.collection('voice_profiles')
          .doc(voiceProfileId)
          .update({
            data: {
              status: 'failed',
              lastError: error.message || String(error),
              processingEndTime: db.serverDate()
            }
          });
      } catch (updateError) {
        console.error('[Extract] 更新失败状态时出错:', updateError);
      }
    }
    
    // 记录失败日志
    if (voiceProfileId) {
      try {
        await db.collection('audit_logs').add({
          data: {
            _openid: OPENID,
            action: 'voice_profile_extraction',
            resourceType: 'voice_profile',
            resourceId: voiceProfileId,
            details: {
              action: action || 'extract',
              audioFileId: audioFileId,
              error: error.message || String(error)
            },
            timestamp: db.serverDate(),
            success: false
          }
        });
      } catch (logError) {
        console.error('[Extract] 记录审计日志时出错:', logError);
      }
    }
    
    return {
      success: false,
      error: error.message || '声纹特征提取失败',
      errorDetails: String(error)
    };
  }
};

/**
 * 从云存储下载音频文件
 */
async function downloadAudioFile(fileId) {
  try {
    const result = await cloud.downloadFile({
      fileID: fileId
    });
    
    return result.fileContent;
  } catch (error) {
    console.error('[Extract] 下载音频文件失败:', error);
    throw new Error(`下载音频文件失败: ${error.message}`);
  }
}

/**
 * 调用后端 API 提取声纹特征（带重试）
 */
async function extractEmbeddingWithRetry(audioBuffer, filename) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Extract] 尝试提取声纹 (${attempt}/${MAX_RETRIES})...`);
      
      const result = await extractEmbedding(audioBuffer, filename);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < MAX_RETRIES) {
        console.log(`[Extract] 提取失败，${RETRY_DELAY}ms 后重试...`);
        await sleep(RETRY_DELAY);
      }
      
    } catch (error) {
      lastError = error.message || String(error);
      console.error(`[Extract] 尝试 ${attempt} 失败:`, error);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  throw new Error(`提取声纹失败，已重试 ${MAX_RETRIES} 次: ${lastError}`);
}

/**
 * 调用后端 API 提取声纹特征
 */
async function extractEmbedding(audioBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: filename || 'audio.wav',
      contentType: 'audio/wav'
    });
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/extract-embedding`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 120000, // 120秒超时
        maxContentLength: 100 * 1024 * 1024, // 100MB
        maxBodyLength: 100 * 1024 * 1024
      }
    );
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      // 服务器返回错误
      console.error('[Extract] API 返回错误:', error.response.status, error.response.data);
      return {
        success: false,
        error: error.response.data.error || error.response.data.detail || '服务器处理失败'
      };
    } else if (error.request) {
      // 请求发送失败
      console.error('[Extract] 请求失败:', error.message);
      return {
        success: false,
        error: `无法连接到 API 服务器: ${error.message}`
      };
    } else {
      // 其他错误
      console.error('[Extract] 未知错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * 验证声纹特征有效性
 */
function validateEmbedding(embedding) {
  try {
    // 检查是否为数组
    if (!Array.isArray(embedding)) {
      return {
        valid: false,
        reason: '声纹特征不是数组'
      };
    }
    
    // 检查维度（应该是256维）
    if (embedding.length !== 256) {
      return {
        valid: false,
        reason: `声纹特征维度错误: ${embedding.length}，期望 256`
      };
    }
    
    // 检查是否全为数字
    if (!embedding.every(v => typeof v === 'number' && !isNaN(v))) {
      return {
        valid: false,
        reason: '声纹特征包含非数字值'
      };
    }
    
    // 计算统计指标
    const mean = embedding.reduce((a, b) => a + b, 0) / embedding.length;
    const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / embedding.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...embedding);
    const max = Math.max(...embedding);
    
    // 检查是否全为零（无效的声纹）
    if (std < 0.0001) {
      return {
        valid: false,
        reason: '声纹特征方差过小，可能全为零'
      };
    }
    
    // 检查是否有异常值（过大或过小）
    if (Math.abs(mean) > 10 || std > 10) {
      return {
        valid: false,
        reason: `声纹特征统计值异常: mean=${mean.toFixed(4)}, std=${std.toFixed(4)}`
      };
    }
    
    return {
      valid: true,
      mean: mean,
      std: std,
      min: min,
      max: max
    };
    
  } catch (error) {
    return {
      valid: false,
      reason: `验证过程出错: ${error.message}`
    };
  }
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
