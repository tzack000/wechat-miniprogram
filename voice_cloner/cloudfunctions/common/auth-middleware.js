// cloudfunctions/common/auth-middleware.js
// 认证和鉴权中间件

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 验证用户身份
 * @param {Object} wxContext - 微信上下文
 * @returns {Promise<Object>} 用户信息
 */
async function authenticateUser(wxContext) {
  const { OPENID } = wxContext;
  
  if (!OPENID) {
    throw new Error('未授权访问,请先登录');
  }
  
  // 查询用户信息
  const userRes = await db.collection('users').where({
    openId: OPENID
  }).get();
  
  if (userRes.data.length === 0) {
    throw new Error('用户不存在,请先登录');
  }
  
  const user = userRes.data[0];
  
  // 检查用户状态
  if (user.status === 'banned') {
    throw new Error('账号已被封禁');
  }
  
  if (user.status === 'suspended') {
    throw new Error('账号已被暂停');
  }
  
  return user;
}

/**
 * 检查资源所有权
 * @param {string} userId - 请求用户ID
 * @param {string} resourceUserId - 资源所有者ID
 * @param {string} resourceType - 资源类型
 * @returns {boolean} 是否有权限
 */
function checkResourceOwnership(userId, resourceUserId, resourceType = 'resource') {
  if (userId !== resourceUserId) {
    throw new Error(`无权访问此${resourceType}`);
  }
  return true;
}

/**
 * 检查用户配额
 * @param {Object} user - 用户对象
 * @param {number} amount - 需要使用的配额数量
 * @returns {boolean} 配额是否充足
 */
function checkQuota(user, amount = 1) {
  const now = new Date();
  
  // 检查配额是否需要重置
  if (new Date(user.quotaResetAt) < now) {
    // 配额已重置,可以使用
    return true;
  }
  
  // 检查剩余配额
  const remaining = user.dailyQuota - user.usedQuota;
  if (remaining < amount) {
    throw new Error(`配额不足。今日剩余: ${remaining}/${user.dailyQuota}`);
  }
  
  return true;
}

/**
 * 检查存储空间
 * @param {Object} user - 用户对象
 * @param {number} fileSize - 文件大小(字节)
 * @returns {boolean} 存储空间是否充足
 */
function checkStorage(user, fileSize) {
  const available = user.totalStorage - user.usedStorage;
  
  if (fileSize > available) {
    const usedMB = (user.usedStorage / 1024 / 1024).toFixed(2);
    const totalMB = (user.totalStorage / 1024 / 1024).toFixed(2);
    throw new Error(`存储空间不足。已使用: ${usedMB}MB/${totalMB}MB`);
  }
  
  return true;
}

/**
 * 检查是否为管理员
 * @param {Object} user - 用户对象
 * @returns {boolean} 是否为管理员
 */
function isAdmin(user) {
  return user.role === 'admin' || user.role === 'superadmin';
}

/**
 * 检查权限
 * @param {Object} user - 用户对象
 * @param {string} permission - 权限名称
 * @returns {boolean} 是否有权限
 */
function hasPermission(user, permission) {
  if (isAdmin(user)) {
    return true; // 管理员拥有所有权限
  }
  
  const userPermissions = user.permissions || [];
  return userPermissions.includes(permission);
}

/**
 * 请求频率限制
 * @param {string} userId - 用户ID
 * @param {string} action - 操作类型
 * @param {number} maxRequests - 最大请求数
 * @param {number} windowMs - 时间窗口(毫秒)
 * @returns {Promise<boolean>} 是否在限制内
 */
async function rateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `rate_limit_${userId}_${action}`;
  
  // 注意: 这里使用内存存储,重启后会丢失
  // 生产环境建议使用 Redis 或数据库
  if (!global.rateLimitCache) {
    global.rateLimitCache = new Map();
  }
  
  const cache = global.rateLimitCache;
  const record = cache.get(key) || { requests: [], windowStart: now };
  
  // 清理过期的请求记录
  record.requests = record.requests.filter(time => now - time < windowMs);
  
  if (record.requests.length >= maxRequests) {
    throw new Error('请求过于频繁,请稍后再试');
  }
  
  // 记录本次请求
  record.requests.push(now);
  cache.set(key, record);
  
  // 定期清理缓存
  if (cache.size > 10000) {
    const keysToDelete = [];
    for (const [k, v] of cache.entries()) {
      if (now - v.requests[v.requests.length - 1] > windowMs * 2) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach(k => cache.delete(k));
  }
  
  return true;
}

/**
 * 验证 API 调用权限的中间件包装器
 * @param {Function} handler - 业务处理函数
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的处理函数
 */
function withAuth(handler, options = {}) {
  const {
    requireAuth = true,
    checkQuota: needQuota = false,
    quotaAmount = 1,
    rateLimit: needRateLimit = false,
    rateLimitConfig = { maxRequests: 10, windowMs: 60000 }
  } = options;
  
  return async (event, context) => {
    const wxContext = cloud.getWXContext();
    
    try {
      // 身份验证
      if (requireAuth) {
        const user = await authenticateUser(wxContext);
        event.user = user; // 将用户信息添加到 event 中
        event.userId = user.openId;
        
        // 检查配额
        if (needQuota) {
          checkQuota(user, quotaAmount);
        }
        
        // 频率限制
        if (needRateLimit) {
          const action = event.action || 'default';
          await rateLimit(user.openId, action, rateLimitConfig.maxRequests, rateLimitConfig.windowMs);
        }
      }
      
      // 执行业务逻辑
      return await handler(event, context, wxContext);
      
    } catch (err) {
      console.error('Auth middleware error:', err);
      return {
        success: false,
        error: err.message,
        code: err.code || 'AUTH_ERROR'
      };
    }
  };
}

module.exports = {
  authenticateUser,
  checkResourceOwnership,
  checkQuota,
  checkStorage,
  isAdmin,
  hasPermission,
  rateLimit,
  withAuth
};
