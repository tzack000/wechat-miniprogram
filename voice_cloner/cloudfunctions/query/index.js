// cloudfunctions/query/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const { authenticateUser, checkResourceOwnership } = require('../common/auth-middleware');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;
  const { action, data } = event;
  
  try {
    // 验证用户身份
    const user = await authenticateUser(wxContext);
    
    switch (action) {
      case 'getVoiceProfile':
        return await getVoiceProfile(OPENID, data);
      
      case 'getTTSTask':
        return await getTTSTask(OPENID, data.taskId);
      
      case 'getAudioList':
        return await getAudioList(OPENID, data);
      
      case 'getAudioDetail':
        return await getAudioDetail(OPENID, data.audioId);
      
      case 'getUserInfo':
        return await getUserInfo(OPENID);
      
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (err) {
    console.error('查询失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 获取声纹档案
async function getVoiceProfile(userId, data = {}) {
  const { voiceProfileId } = data;
  
  // 如果指定了 voiceProfileId,需要检查所有权
  if (voiceProfileId) {
    const res = await db.collection('voice_profiles').where({
      voiceProfileId: voiceProfileId
    }).get();
    
    if (res.data.length === 0) {
      return {
        success: false,
        error: '声纹档案不存在'
      };
    }
    
    const profile = res.data[0];
    
    // 检查所有权
    try {
      checkResourceOwnership(userId, profile.userId, '声纹档案');
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
    
    return {
      success: true,
      data: profile
    };
  }
  
  // 否则查询用户自己的声纹档案
  const res = await db.collection('voice_profiles').where({
    userId: userId
  }).get();
  
  if (res.data.length > 0) {
    return {
      success: true,
      data: res.data[0]
    };
  } else {
    return {
      success: true,
      data: null
    };
  }
}

// 获取 TTS 任务状态
async function getTTSTask(userId, taskId) {
  const res = await db.collection('tts_tasks').where({
    taskId: taskId
  }).get();
  
  if (res.data.length === 0) {
    return {
      success: false,
      error: '任务不存在'
    };
  }
  
  const task = res.data[0];
  
  // 检查所有权
  try {
    checkResourceOwnership(userId, task.userId, 'TTS任务');
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
  
  return {
    success: true,
    data: task
  };
}

// 获取音频列表
async function getAudioList(userId, { page = 1, limit = 20, keyword = '' }) {
  const skip = (page - 1) * limit;
  
  // 只能查询自己的音频列表
  let query = db.collection('audio_files').where({
    userId: userId
  });
  
  // 搜索关键词
  if (keyword) {
    query = query.where({
      text: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    });
  }
  
  const res = await query
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(limit)
    .get();
  
  const countRes = await query.count();
  
  return {
    success: true,
    data: {
      list: res.data,
      total: countRes.total,
      page: page,
      pageSize: limit
    }
  };
}

// 获取音频详情(新增)
async function getAudioDetail(userId, audioId) {
  const res = await db.collection('audio_files').where({
    audioId: audioId
  }).get();
  
  if (res.data.length === 0) {
    return {
      success: false,
      error: '音频不存在'
    };
  }
  
  const audio = res.data[0];
  
  // 检查所有权
  try {
    checkResourceOwnership(userId, audio.userId, '音频文件');
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
  
  return {
    success: true,
    data: audio
  };
}

// 获取用户信息
async function getUserInfo(userId) {
  const res = await db.collection('users').where({
    openId: userId
  }).get();
  
  if (res.data.length > 0) {
    // 不返回敏感信息
    const user = res.data[0];
    delete user._id;
    
    return {
      success: true,
      data: user
    };
  } else {
    return {
      success: false,
      error: '用户不存在'
    };
  }
}
