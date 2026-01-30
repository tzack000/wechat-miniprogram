// cloudfunctions/common/db-models.js
// 数据模型 CRUD 基础函数库

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

/**
 * 用户声纹档案模型
 */
class VoiceProfileModel {
  static collection = 'voice_profiles';
  
  // 创建声纹档案
  static async create(data) {
    const now = new Date();
    const profile = {
      userId: data.userId,
      voiceProfileId: data.voiceProfileId || `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      embeddingVector: data.embeddingVector || [],
      recordingUrls: data.recordingUrls || [],
      status: data.status || 'processing',
      createdAt: now,
      updatedAt: now,
      metadata: {
        version: 1,
        recordingDuration: data.recordingDuration || 0,
        sampleRate: data.sampleRate || 16000
      }
    };
    
    const res = await db.collection(this.collection).add({ data: profile });
    return { ...profile, _id: res._id };
  }
  
  // 根据用户ID查询
  static async findByUserId(userId) {
    const res = await db.collection(this.collection)
      .where({ userId })
      .get();
    return res.data.length > 0 ? res.data[0] : null;
  }
  
  // 根据档案ID查询
  static async findByProfileId(voiceProfileId) {
    const res = await db.collection(this.collection)
      .where({ voiceProfileId })
      .get();
    return res.data.length > 0 ? res.data[0] : null;
  }
  
  // 更新声纹档案
  static async update(voiceProfileId, updates) {
    const profile = await this.findByProfileId(voiceProfileId);
    if (!profile) {
      throw new Error('声纹档案不存在');
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    if (updates.metadata) {
      updateData.metadata = {
        ...profile.metadata,
        ...updates.metadata
      };
    }
    
    await db.collection(this.collection)
      .doc(profile._id)
      .update({ data: updateData });
    
    return await this.findByProfileId(voiceProfileId);
  }
  
  // 删除声纹档案
  static async delete(voiceProfileId) {
    const profile = await this.findByProfileId(voiceProfileId);
    if (!profile) {
      throw new Error('声纹档案不存在');
    }
    
    await db.collection(this.collection)
      .doc(profile._id)
      .remove();
    
    return true;
  }
}

/**
 * TTS任务模型
 */
class TTSTaskModel {
  static collection = 'tts_tasks';
  
  // 创建TTS任务
  static async create(data) {
    const now = new Date();
    const task = {
      taskId: data.taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      voiceProfileId: data.voiceProfileId,
      inputText: data.inputText,
      outputAudioUrl: data.outputAudioUrl || '',
      duration: data.duration || 0,
      status: data.status || 'pending',
      errorMessage: data.errorMessage || '',
      createdAt: now,
      completedAt: null
    };
    
    const res = await db.collection(this.collection).add({ data: task });
    return { ...task, _id: res._id };
  }
  
  // 根据任务ID查询
  static async findByTaskId(taskId) {
    const res = await db.collection(this.collection)
      .where({ taskId })
      .get();
    return res.data.length > 0 ? res.data[0] : null;
  }
  
  // 查询用户的任务列表
  static async findByUserId(userId, { page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    let query = db.collection(this.collection).where({ userId });
    
    if (status) {
      query = query.where({ status });
    }
    
    const res = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
    
    const countRes = await query.count();
    
    return {
      list: res.data,
      total: countRes.total,
      page,
      pageSize: limit
    };
  }
  
  // 更新任务状态
  static async updateStatus(taskId, status, data = {}) {
    const task = await this.findByTaskId(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    
    const updateData = {
      status,
      ...data
    };
    
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    await db.collection(this.collection)
      .doc(task._id)
      .update({ data: updateData });
    
    return await this.findByTaskId(taskId);
  }
  
  // 删除任务
  static async delete(taskId) {
    const task = await this.findByTaskId(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    
    await db.collection(this.collection)
      .doc(task._id)
      .remove();
    
    return true;
  }
}

/**
 * 音频文件模型
 */
class AudioFileModel {
  static collection = 'audio_files';
  
  // 创建音频记录
  static async create(data) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后过期
    
    const audio = {
      audioId: data.audioId || `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      taskId: data.taskId,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || 0,
      duration: data.duration || 0,
      format: data.format || 'mp3',
      text: data.text || '',
      isFavorite: data.isFavorite || false,
      expiresAt: data.isFavorite ? null : expiresAt, // 收藏的不过期
      createdAt: now
    };
    
    const res = await db.collection(this.collection).add({ data: audio });
    return { ...audio, _id: res._id };
  }
  
  // 根据音频ID查询
  static async findByAudioId(audioId) {
    const res = await db.collection(this.collection)
      .where({ audioId })
      .get();
    return res.data.length > 0 ? res.data[0] : null;
  }
  
  // 查询用户的音频列表
  static async findByUserId(userId, { page = 1, limit = 20, keyword = '', isFavorite = null } = {}) {
    const skip = (page - 1) * limit;
    let query = db.collection(this.collection).where({ userId });
    
    if (keyword) {
      query = query.where({
        text: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      });
    }
    
    if (isFavorite !== null) {
      query = query.where({ isFavorite });
    }
    
    const res = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
    
    const countRes = await query.count();
    
    return {
      list: res.data,
      total: countRes.total,
      page,
      pageSize: limit
    };
  }
  
  // 更新音频信息
  static async update(audioId, updates) {
    const audio = await this.findByAudioId(audioId);
    if (!audio) {
      throw new Error('音频不存在');
    }
    
    // 如果标记为收藏,取消过期时间
    if (updates.isFavorite) {
      updates.expiresAt = null;
    }
    
    await db.collection(this.collection)
      .doc(audio._id)
      .update({ data: updates });
    
    return await this.findByAudioId(audioId);
  }
  
  // 删除音频
  static async delete(audioId) {
    const audio = await this.findByAudioId(audioId);
    if (!audio) {
      throw new Error('音频不存在');
    }
    
    await db.collection(this.collection)
      .doc(audio._id)
      .remove();
    
    return true;
  }
  
  // 查询过期的音频
  static async findExpired() {
    const now = new Date();
    const res = await db.collection(this.collection)
      .where({
        expiresAt: _.lt(now),
        isFavorite: false
      })
      .get();
    
    return res.data;
  }
  
  // 计算用户已使用的存储空间
  static async calculateUserStorage(userId) {
    const res = await db.collection(this.collection)
      .where({ userId })
      .get();
    
    const totalSize = res.data.reduce((sum, audio) => sum + (audio.fileSize || 0), 0);
    return totalSize;
  }
}

/**
 * 用户模型
 */
class UserModel {
  static collection = 'users';
  
  // 创建用户
  static async create(data) {
    const now = new Date();
    const user = {
      openId: data.openId,
      unionId: data.unionId || '',
      nickName: data.nickName || '',
      avatarUrl: data.avatarUrl || '',
      dailyQuota: data.dailyQuota || 10,
      usedQuota: 0,
      quotaResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      totalStorage: data.totalStorage || 104857600, // 100MB
      usedStorage: 0,
      createdAt: now,
      lastLoginAt: now
    };
    
    const res = await db.collection(this.collection).add({ data: user });
    return { ...user, _id: res._id };
  }
  
  // 根据openId查询
  static async findByOpenId(openId) {
    const res = await db.collection(this.collection)
      .where({ openId })
      .get();
    return res.data.length > 0 ? res.data[0] : null;
  }
  
  // 更新用户信息
  static async update(openId, updates) {
    const user = await this.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    await db.collection(this.collection)
      .doc(user._id)
      .update({ data: updates });
    
    return await this.findByOpenId(openId);
  }
  
  // 检查并重置配额
  static async checkAndResetQuota(openId) {
    const user = await this.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const now = new Date();
    if (new Date(user.quotaResetAt) < now) {
      await this.update(openId, {
        usedQuota: 0,
        quotaResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      });
      user.usedQuota = 0;
    }
    
    return user;
  }
  
  // 使用配额
  static async useQuota(openId, amount = 1) {
    const user = await this.checkAndResetQuota(openId);
    
    if (user.usedQuota + amount > user.dailyQuota) {
      throw new Error('配额不足');
    }
    
    await this.update(openId, {
      usedQuota: user.usedQuota + amount
    });
    
    return true;
  }
  
  // 更新存储使用量
  static async updateStorage(openId, usedStorage) {
    const user = await this.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    if (usedStorage > user.totalStorage) {
      throw new Error('存储空间不足');
    }
    
    await this.update(openId, { usedStorage });
    return true;
  }
}

module.exports = {
  VoiceProfileModel,
  TTSTaskModel,
  AudioFileModel,
  UserModel
};
