# 认证和授权使用指南

## 概述

本项目实现了完整的用户认证和授权机制,包括:
- 微信登录
- 会话管理
- API 鉴权
- 跨用户访问控制
- 审计日志

## 认证中间件使用

### 基本用法

```javascript
const { withAuth } = require('../common/auth-middleware');

// 需要认证的云函数
exports.main = withAuth(async (event, context, wxContext) => {
  // event.user 包含当前用户信息
  // event.userId 是用户的 openId
  
  const { user, userId } = event;
  
  // 业务逻辑
  return {
    success: true,
    data: { message: 'Hello ' + userId }
  };
});
```

### 配置选项

```javascript
// 需要认证 + 检查配额
exports.main = withAuth(async (event, context, wxContext) => {
  // 业务逻辑
}, {
  requireAuth: true,      // 是否需要认证
  checkQuota: true,       // 是否检查配额
  quotaAmount: 1,         // 需要的配额数量
  rateLimit: true,        // 是否启用频率限制
  rateLimitConfig: {
    maxRequests: 10,      // 时间窗口内最大请求数
    windowMs: 60000       // 时间窗口(毫秒)
  }
});
```

## 资源访问控制

### 检查资源所有权

```javascript
const { checkResourceOwnership } = require('../common/auth-middleware');

// 在访问资源前检查
try {
  checkResourceOwnership(currentUserId, resourceOwnerId, '声纹档案');
  // 继续访问资源
} catch (err) {
  return {
    success: false,
    error: err.message // "无权访问此声纹档案"
  };
}
```

### 检查配额

```javascript
const { checkQuota } = require('../common/auth-middleware');

try {
  checkQuota(user, 1); // 检查是否有1个配额
  // 继续执行操作
} catch (err) {
  return {
    success: false,
    error: err.message // "配额不足。今日剩余: 0/10"
  };
}
```

### 检查存储空间

```javascript
const { checkStorage } = require('../common/auth-middleware');

try {
  checkStorage(user, fileSize);
  // 继续上传文件
} catch (err) {
  return {
    success: false,
    error: err.message // "存储空间不足。已使用: 95MB/100MB"
  };
}
```

## 审计日志

### 记录登录

```javascript
const { logLogin } = require('../common/audit-logger');

await logLogin(userId, true); // 成功登录
await logLogin(userId, false, '密码错误'); // 登录失败
```

### 记录资源访问

```javascript
const { logResourceAccess } = require('../common/audit-logger');

await logResourceAccess(userId, '声纹档案', profileId, '查看');
await logResourceAccess(userId, 'TTS任务', taskId, '创建');
```

### 记录权限拒绝

```javascript
const { logPermissionDenied } = require('../common/audit-logger');

await logPermissionDenied(userId, '声纹档案', profileId, '删除');
```

### 记录文件操作

```javascript
const { logFileUpload, logFileDelete } = require('../common/audit-logger');

// 上传
await logFileUpload(userId, 'recording.mp3', 1024000, 'audio/mp3', true);

// 删除
await logFileDelete(userId, '音频文件', audioId, true);
```

### 记录配额超限

```javascript
const { logQuotaExceeded } = require('../common/audit-logger');

await logQuotaExceeded(userId, 'TTS合成', 10, 10);
```

### 记录安全违规

```javascript
const { logSecurityViolation } = require('../common/audit-logger');

await logSecurityViolation(userId, '尝试访问他人数据', {
  targetUserId: otherUserId,
  resource: 'voice_profile'
});
```

### 查询审计日志

```javascript
const { queryAuditLogs } = require('../common/audit-logger');

const logs = await queryAuditLogs({
  userId: 'user123',
  type: 'login',
  level: 'security',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  page: 1,
  limit: 50
});
```

## 在云函数中使用

### 示例: 带认证的 TTS 合成

```javascript
const { withAuth } = require('../common/auth-middleware');
const { logResourceAccess, logQuotaExceeded } = require('../common/audit-logger');

exports.main = withAuth(async (event, context, wxContext) => {
  const { user, userId } = event;
  const { text, voiceProfileId } = event.data;
  
  try {
    // 记录访问日志
    await logResourceAccess(userId, 'TTS服务', null, '请求合成');
    
    // 业务逻辑...
    const result = await synthesizeText(text, voiceProfileId);
    
    return {
      success: true,
      data: result
    };
  } catch (err) {
    // 如果是配额问题,记录日志
    if (err.message.includes('配额')) {
      await logQuotaExceeded(userId, 'TTS合成', user.usedQuota, user.dailyQuota);
    }
    
    return {
      success: false,
      error: err.message
    };
  }
}, {
  requireAuth: true,
  checkQuota: true,
  quotaAmount: 1,
  rateLimit: true,
  rateLimitConfig: {
    maxRequests: 5,
    windowMs: 60000
  }
});
```

## 数据库集合

### audit_logs 集合结构

```javascript
{
  _id: "auto-generated",
  userId: "string",           // 用户 openId
  action: "string",           // 操作描述
  type: "string",            // login/access/upload/delete...
  level: "string",           // info/warning/error/security
  resourceType: "string",    // 资源类型
  resourceId: "string",      // 资源 ID
  details: {},               // 详细信息
  ipAddress: "string",       // IP 地址(可选)
  userAgent: "string",       // User Agent(可选)
  success: "boolean",        // 是否成功
  errorMessage: "string",    // 错误信息
  timestamp: "date"          // 时间戳
}
```

### 索引建议

在云开发控制台创建以下索引:
- userId (升序)
- type (升序)
- level (升序)
- timestamp (降序)
- { userId: 1, timestamp: -1 } (复合索引)

## 最佳实践

1. **所有敏感操作都要记录审计日志**
   - 登录/登出
   - 数据访问
   - 数据修改
   - 权限拒绝

2. **使用适当的日志级别**
   - INFO: 正常操作
   - WARNING: 异常但可接受的情况
   - ERROR: 错误
   - SECURITY: 安全相关事件

3. **定期清理审计日志**
   - 保留最近 90 天的日志
   - 重要日志可以导出备份

4. **监控异常行为**
   - 频繁的权限拒绝
   - 大量的配额超限
   - 异常的访问模式

## 安全建议

1. **永远不要信任客户端数据**
   - 所有输入都要验证
   - 使用服务端验证

2. **最小权限原则**
   - 用户只能访问自己的资源
   - 管理员权限需要额外验证

3. **敏感操作二次确认**
   - 删除数据
   - 修改重要配置

4. **监控和告警**
   - 设置异常行为告警
   - 定期审查安全日志
