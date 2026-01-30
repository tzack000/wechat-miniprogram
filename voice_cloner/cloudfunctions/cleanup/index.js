// cloudfunctions/cleanup/index.js
// 定时清理过期文件的云函数
// 建议配置为每天凌晨3点执行

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { AudioFileModel, UserModel } = require('../common/db-models');
const { deleteFiles, formatFileSize } = require('../common/storage-utils');

exports.main = async (event, context) => {
  console.log('开始清理过期文件...');
  
  try {
    const results = {
      audioFiles: await cleanupExpiredAudioFiles(),
      tempFiles: await cleanupTempFiles(),
      failedTasks: await cleanupFailedTaskFiles()
    };
    
    console.log('清理完成:', results);
    
    return {
      success: true,
      data: results
    };
  } catch (err) {
    console.error('清理失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * 清理过期的音频文件
 */
async function cleanupExpiredAudioFiles() {
  console.log('查找过期音频文件...');
  
  // 查找所有过期的音频
  const expiredAudios = await AudioFileModel.findExpired();
  
  if (expiredAudios.length === 0) {
    console.log('没有过期的音频文件');
    return {
      deleted: 0,
      freedSpace: 0
    };
  }
  
  console.log(`找到 ${expiredAudios.length} 个过期音频文件`);
  
  // 提取文件 ID
  const fileIDs = expiredAudios.map(audio => audio.fileUrl);
  
  // 删除云存储文件
  const deleteResult = await deleteFiles(fileIDs);
  
  // 更新用户存储使用量
  const userStorageMap = new Map();
  for (const audio of expiredAudios) {
    const current = userStorageMap.get(audio.userId) || 0;
    userStorageMap.set(audio.userId, current + audio.fileSize);
  }
  
  for (const [userId, freedSize] of userStorageMap) {
    const user = await UserModel.findByOpenId(userId);
    if (user) {
      const newUsedStorage = Math.max(0, user.usedStorage - freedSize);
      await UserModel.updateStorage(userId, newUsedStorage);
    }
  }
  
  // 删除数据库记录
  for (const audio of expiredAudios) {
    await AudioFileModel.delete(audio.audioId);
  }
  
  const totalFreedSpace = expiredAudios.reduce((sum, audio) => sum + audio.fileSize, 0);
  
  return {
    deleted: deleteResult.deleted,
    failed: deleteResult.failed,
    freedSpace: formatFileSize(totalFreedSpace)
  };
}

/**
 * 清理临时文件(超过24小时的临时文件)
 */
async function cleanupTempFiles() {
  console.log('清理临时文件...');
  
  const db = cloud.database();
  const _ = db.command;
  
  // 查找 temp 目录下超过24小时的文件
  // 注意: 微信云开发没有直接列出文件的API,需要通过其他方式追踪临时文件
  // 这里假设我们在数据库中记录了临时文件
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // 这里是示例,实际需要根据你的临时文件记录方式调整
  // const tempFiles = await db.collection('temp_files').where({
  //   createdAt: _.lt(oneDayAgo)
  // }).get();
  
  // if (tempFiles.data.length > 0) {
  //   const fileIDs = tempFiles.data.map(file => file.fileID);
  //   const deleteResult = await deleteFiles(fileIDs);
  //   
  //   // 删除数据库记录
  //   for (const file of tempFiles.data) {
  //     await db.collection('temp_files').doc(file._id).remove();
  //   }
  //   
  //   return {
  //     deleted: deleteResult.deleted,
  //     failed: deleteResult.failed
  //   };
  // }
  
  return {
    deleted: 0,
    failed: 0,
    message: '临时文件清理功能待完善'
  };
}

/**
 * 清理失败任务的关联文件
 */
async function cleanupFailedTaskFiles() {
  console.log('清理失败任务文件...');
  
  const db = cloud.database();
  const _ = db.command;
  
  // 查找超过7天的失败任务
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const failedTasks = await db.collection('tts_tasks').where({
    status: 'failed',
    createdAt: _.lt(sevenDaysAgo)
  }).get();
  
  if (failedTasks.data.length === 0) {
    console.log('没有需要清理的失败任务');
    return {
      deleted: 0
    };
  }
  
  console.log(`找到 ${failedTasks.data.length} 个失败任务`);
  
  // 删除关联的音频文件(如果存在)
  const fileIDs = failedTasks.data
    .filter(task => task.outputAudioUrl)
    .map(task => task.outputAudioUrl);
  
  if (fileIDs.length > 0) {
    await deleteFiles(fileIDs);
  }
  
  // 删除任务记录
  for (const task of failedTasks.data) {
    await db.collection('tts_tasks').doc(task._id).remove();
  }
  
  return {
    deleted: failedTasks.data.length
  };
}

/**
 * 生成清理报告
 */
async function generateCleanupReport() {
  const db = cloud.database();
  
  // 统计信息
  const audioCount = await db.collection('audio_files').count();
  const taskCount = await db.collection('tts_tasks').count();
  const userCount = await db.collection('users').count();
  
  // 计算总存储使用量
  const users = await db.collection('users').get();
  const totalStorage = users.data.reduce((sum, user) => sum + user.usedStorage, 0);
  
  return {
    totalAudios: audioCount.total,
    totalTasks: taskCount.total,
    totalUsers: userCount.total,
    totalStorage: formatFileSize(totalStorage),
    timestamp: new Date()
  };
}
