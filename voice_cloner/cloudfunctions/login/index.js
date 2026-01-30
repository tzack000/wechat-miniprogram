// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const { logLogin } = require('../common/audit-logger');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    const { OPENID, APPID, UNIONID } = wxContext;
    
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      openId: OPENID
    }).get();
    
    let user;
    const now = new Date();
    
    if (userRes.data.length === 0) {
      // 新用户,创建记录
      const createRes = await db.collection('users').add({
        data: {
          openId: OPENID,
          unionId: UNIONID || '',
          dailyQuota: 10,
          usedQuota: 0,
          quotaResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24小时后
          totalStorage: 104857600, // 100MB
          usedStorage: 0,
          createdAt: now,
          lastLoginAt: now
        }
      });
      
      user = {
        _id: createRes._id,
        openId: OPENID,
        dailyQuota: 10,
        usedQuota: 0
      };
      
      // 记录新用户注册日志
      await logLogin(OPENID, true, '新用户注册');
    } else {
      // 老用户,更新最后登录时间
      user = userRes.data[0];
      
      await db.collection('users').doc(user._id).update({
        data: {
          lastLoginAt: now
        }
      });
      
      // 检查配额是否需要重置
      if (new Date(user.quotaResetAt) < now) {
        await db.collection('users').doc(user._id).update({
          data: {
            usedQuota: 0,
            quotaResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        user.usedQuota = 0;
      }
      
      // 记录登录日志
      await logLogin(OPENID, true);
    }
    
    return {
      success: true,
      token: OPENID, // 简化版,生产环境应使用 JWT
      userInfo: {
        openId: OPENID,
        userId: user._id,
        dailyQuota: user.dailyQuota,
        usedQuota: user.usedQuota,
        totalStorage: user.totalStorage || 104857600,
        usedStorage: user.usedStorage || 0
      }
    };
    
  } catch (err) {
    console.error('登录失败:', err);
    
    // 记录登录失败日志
    if (wxContext.OPENID) {
      await logLogin(wxContext.OPENID, false, err.message);
    }
    
    return {
      success: false,
      error: err.message
    };
  }
};
