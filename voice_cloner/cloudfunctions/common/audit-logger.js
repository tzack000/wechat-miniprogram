// cloudfunctions/common/audit-logger.js
// 审计日志记录工具

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 审计日志级别
 */
const AuditLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SECURITY: 'security'
};

/**
 * 审计日志类型
 */
const AuditType = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  DELETE: 'delete',
  CREATE: 'create',
  UPDATE: 'update',
  ACCESS: 'access',
  PERMISSION_DENIED: 'permission_denied',
  QUOTA_EXCEEDED: 'quota_exceeded',
  SECURITY_VIOLATION: 'security_violation'
};

/**
 * 记录审计日志
 * @param {Object} params - 日志参数
 * @returns {Promise<Object>} 日志记录结果
 */
async function logAudit({
  userId,
  action,
  type = AuditType.ACCESS,
  level = AuditLevel.INFO,
  resourceType = null,
  resourceId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  success = true,
  errorMessage = null
}) {
  try {
    const logEntry = {
      userId,
      action,
      type,
      level,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      timestamp: new Date()
    };
    
    // 记录到数据库
    await db.collection('audit_logs').add({
      data: logEntry
    });
    
    // 如果是安全事件或错误,额外记录到控制台
    if (level === AuditLevel.SECURITY || level === AuditLevel.ERROR) {
      console.error('[AUDIT]', JSON.stringify(logEntry));
    } else if (level === AuditLevel.WARNING) {
      console.warn('[AUDIT]', JSON.stringify(logEntry));
    }
    
    return {
      success: true,
      logId: logEntry._id
    };
  } catch (err) {
    console.error('审计日志记录失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * 记录登录日志
 */
async function logLogin(userId, success = true, errorMessage = null, ipAddress = null) {
  return await logAudit({
    userId,
    action: '用户登录',
    type: AuditType.LOGIN,
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    success,
    errorMessage,
    ipAddress
  });
}

/**
 * 记录资源访问日志
 */
async function logResourceAccess(userId, resourceType, resourceId, action = '访问', success = true) {
  return await logAudit({
    userId,
    action: `${action}${resourceType}`,
    type: AuditType.ACCESS,
    level: AuditLevel.INFO,
    resourceType,
    resourceId,
    success
  });
}

/**
 * 记录权限拒绝日志
 */
async function logPermissionDenied(userId, resourceType, resourceId, action = '访问') {
  return await logAudit({
    userId,
    action: `尝试${action}${resourceType}`,
    type: AuditType.PERMISSION_DENIED,
    level: AuditLevel.SECURITY,
    resourceType,
    resourceId,
    success: false,
    errorMessage: '权限不足'
  });
}

/**
 * 记录文件上传日志
 */
async function logFileUpload(userId, filename, fileSize, fileType, success = true, errorMessage = null) {
  return await logAudit({
    userId,
    action: '上传文件',
    type: AuditType.UPLOAD,
    level: success ? AuditLevel.INFO : AuditLevel.ERROR,
    details: {
      filename,
      fileSize,
      fileType
    },
    success,
    errorMessage
  });
}

/**
 * 记录文件删除日志
 */
async function logFileDelete(userId, resourceType, resourceId, success = true) {
  return await logAudit({
    userId,
    action: `删除${resourceType}`,
    type: AuditType.DELETE,
    level: AuditLevel.INFO,
    resourceType,
    resourceId,
    success
  });
}

/**
 * 记录配额超限日志
 */
async function logQuotaExceeded(userId, quotaType, current, limit) {
  return await logAudit({
    userId,
    action: `${quotaType}配额超限`,
    type: AuditType.QUOTA_EXCEEDED,
    level: AuditLevel.WARNING,
    details: {
      quotaType,
      current,
      limit
    },
    success: false,
    errorMessage: '配额不足'
  });
}

/**
 * 记录安全违规日志
 */
async function logSecurityViolation(userId, violationType, details = {}) {
  return await logAudit({
    userId,
    action: `安全违规: ${violationType}`,
    type: AuditType.SECURITY_VIOLATION,
    level: AuditLevel.SECURITY,
    details,
    success: false
  });
}

/**
 * 查询审计日志
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} 日志列表
 */
async function queryAuditLogs(filters = {}) {
  const {
    userId = null,
    type = null,
    level = null,
    startDate = null,
    endDate = null,
    page = 1,
    limit = 50
  } = filters;
  
  const skip = (page - 1) * limit;
  const _ = db.command;
  
  let query = db.collection('audit_logs');
  const conditions = [];
  
  if (userId) conditions.push({ userId });
  if (type) conditions.push({ type });
  if (level) conditions.push({ level });
  
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter[_.gte] = new Date(startDate);
    if (endDate) dateFilter[_.lte] = new Date(endDate);
    conditions.push({ timestamp: dateFilter });
  }
  
  if (conditions.length > 0) {
    query = query.where(_.and(conditions));
  }
  
  const res = await query
    .orderBy('timestamp', 'desc')
    .skip(skip)
    .limit(limit)
    .get();
  
  const countRes = await query.count();
  
  return {
    success: true,
    data: {
      list: res.data,
      total: countRes.total,
      page,
      pageSize: limit
    }
  };
}

/**
 * 清理过期审计日志(保留90天)
 */
async function cleanupOldAuditLogs(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const _ = db.command;
  
  try {
    const result = await db.collection('audit_logs')
      .where({
        timestamp: _.lt(cutoffDate)
      })
      .remove();
    
    console.log(`清理了 ${result.stats.removed} 条审计日志`);
    
    return {
      success: true,
      removed: result.stats.removed
    };
  } catch (err) {
    console.error('清理审计日志失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  AuditLevel,
  AuditType,
  logAudit,
  logLogin,
  logResourceAccess,
  logPermissionDenied,
  logFileUpload,
  logFileDelete,
  logQuotaExceeded,
  logSecurityViolation,
  queryAuditLogs,
  cleanupOldAuditLogs
};
