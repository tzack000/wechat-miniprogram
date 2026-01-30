// cloudfunctions/db-init/index.js
// 数据库初始化云函数 - 仅在首次部署时运行

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'createCollections':
        return await createCollections();
      
      case 'createIndexes':
        return await createIndexes();
      
      case 'initData':
        return await initData();
      
      default:
        return {
          success: false,
          error: '未知操作'
        };
    }
  } catch (err) {
    console.error('数据库初始化失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 创建数据库集合
async function createCollections() {
  const collections = [
    'voice_profiles',
    'tts_tasks',
    'audio_files',
    'audio_records',  // 添加录音记录集合
    'users'
  ];
  
  const results = [];
  
  for (const collectionName of collections) {
    try {
      // 检查集合是否存在
      const list = await db.collection(collectionName).count();
      results.push({
        collection: collectionName,
        status: 'exists',
        count: list.total
      });
    } catch (err) {
      // 集合不存在,会自动在第一次插入时创建
      results.push({
        collection: collectionName,
        status: 'will_be_created_on_first_insert'
      });
    }
  }
  
  return {
    success: true,
    data: results
  };
}

// 创建数据库索引
async function createIndexes() {
  // 注意:微信云开发的数据库索引需要在控制台手动创建
  // 这里返回需要创建的索引配置
  
  const indexConfigs = {
    voice_profiles: [
      { keys: { userId: 1 }, unique: true },
      { keys: { voiceProfileId: 1 }, unique: true },
      { keys: { status: 1 } }
    ],
    tts_tasks: [
      { keys: { userId: 1 } },
      { keys: { taskId: 1 }, unique: true },
      { keys: { status: 1 } },
      { keys: { createdAt: -1 } }
    ],
    audio_files: [
      { keys: { userId: 1 } },
      { keys: { audioId: 1 }, unique: true },
      { keys: { createdAt: -1 } },
      { keys: { expiresAt: 1 } },
      { keys: { isFavorite: 1 } }
    ],
    users: [
      { keys: { openId: 1 }, unique: true },
      { keys: { unionId: 1 } }
    ]
  };
  
  return {
    success: true,
    message: '请在云开发控制台手动创建以下索引',
    data: indexConfigs
  };
}

// 初始化测试数据(可选)
async function initData() {
  // 这里可以插入一些初始化数据
  // 生产环境不需要
  
  return {
    success: true,
    message: '无需初始化数据'
  };
}
