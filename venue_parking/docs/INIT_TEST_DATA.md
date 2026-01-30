# 测试数据初始化指南

## 新版统一初始化云函数

我们提供了一个统一的测试数据初始化云函数 `initAllTestData`，它整合了所有测试数据的初始化功能，使用更加方便。

### 快速开始

#### 1. 部署云函数

1. 在微信开发者工具中打开项目
2. 找到 `cloudfunctions/initAllTestData` 目录
3. 右键点击，选择「上传并部署：云端安装依赖」
4. 等待部署完成

#### 2. 创建数据库集合

确保在云开发控制台创建了以下集合：

**基础集合：**
- `users` - 用户信息
- `venues` - 场馆信息
- `bookings` - 场馆预约记录
- `parking_config` - 停车配置
- `parking_records` - 停车记录

**课程相关集合：**
- `coaches` - 教练信息
- `courses` - 课程信息
- `course_schedules` - 课程排期
- `course_bookings` - 课程预约

#### 3. 初始化测试数据

在云开发控制台的「云函数」中，找到 `initAllTestData`，点击「测试」：

**方式一：初始化所有数据（推荐）**
```json
{
  "action": "all",
  "clear": true
}
```

**方式二：选择性初始化**
```json
{
  "modules": ["venues", "coaches", "courses"],
  "clear": false
}
```

## 功能说明

### 数据模块

1. **场馆数据** (10个场馆)
   - 篮球场 × 2
   - 羽毛球场 × 2
   - 游泳馆
   - 乒乓球室
   - 健身房
   - 网球场
   - 瑜伽室
   - 足球场（维护中）

2. **用户数据** (3个用户)
   - 管理员 × 1
   - 普通用户 × 2

3. **教练数据** (5位教练)
   - 瑜伽导师
   - 游泳教练
   - 篮球教练
   - 健身私教
   - 舞蹈编导

4. **课程数据** (10个课程)
   - 瑜伽课程 × 2
   - 游泳课程 × 2
   - 篮球课程 × 2
   - 健身课程 × 2
   - 舞蹈课程 × 2

5. **课程排期** (自动生成)
   - 未来7天
   - 每天3个时段
   - 每个课程约21个排期

6. **预约数据**
   - 历史场馆预约
   - 待处理场馆预约

7. **停车数据**
   - 停车场配置
   - 当前停车记录
   - 预约记录

### 使用示例

#### 完整初始化（开发环境）

适合：首次搭建、重置环境

```json
{
  "action": "all",
  "clear": true
}
```

#### 增量添加数据

适合：不想删除现有数据，只是添加更多测试数据

```json
{
  "action": "all",
  "clear": false
}
```

#### 只初始化课程相关数据

适合：测试课程功能

```json
{
  "modules": ["coaches", "courses"],
  "clear": false
}
```

#### 只初始化场馆相关数据

适合：测试场馆预约功能

```json
{
  "modules": ["venues", "users"],
  "clear": false
}
```

## 返回结果

成功后会返回详细的初始化结果：

```json
{
  "success": true,
  "message": "测试数据初始化完成！",
  "data": {
    "cleared": true,
    "users": { "count": 3 },
    "venues": { "count": 10 },
    "bookings": { "count": 6 },
    "parkingConfig": { "initialized": true },
    "parkingRecords": { "count": 2 },
    "coaches": { "count": 5 },
    "courses": { "count": 10 },
    "schedules": { "count": 210 }
  },
  "summary": [
    "✓ 清除现有数据完成",
    "✓ 用户: 3个",
    "✓ 场馆: 10个",
    "✓ 场馆预约: 6条",
    "✓ 停车配置: 已初始化",
    "✓ 停车记录: 2条",
    "✓ 教练: 5个",
    "✓ 课程: 10个",
    "✓ 课程排期: 210个"
  ]
}
```

## 旧版云函数对比

### 旧版（已弃用）

- `initTestData` - 初始化场馆、用户、停车数据
- `initCourseData` - 初始化教练、课程、排期数据

### 新版优势

✅ **统一管理** - 一个云函数管理所有数据  
✅ **灵活配置** - 可选择性初始化模块  
✅ **智能依赖** - 自动处理数据依赖关系  
✅ **详细反馈** - 提供初始化结果摘要  
✅ **批量清除** - 支持一键清除所有测试数据

## 注意事项

⚠️ **数据清除警告**
- 使用 `clear: true` 会删除所有相关集合的数据
- 生产环境请勿使用清除功能
- 建议先备份重要数据

⚠️ **超时处理**
- 大量数据初始化可能需要时间
- 如遇超时，可分批初始化（使用 `modules` 参数）

⚠️ **权限设置**
- 初始化前确保数据库权限设置正确
- 管理类云函数建议设置调用权限

## 数据库权限设置

初始化数据后，建议设置以下权限：

### users 集合
```json
{
  "read": "auth.openid == doc._openid || get(`database.users.${auth.openid}`).data.isAdmin == true",
  "write": "auth.openid == doc._openid"
}
```

### venues / coaches / courses 集合
```json
{
  "read": true,
  "write": "get(`database.users.${auth.openid}`).data.isAdmin == true"
}
```

### bookings / course_bookings / parking_records 集合
```json
{
  "read": "auth.openid == doc._openid || get(`database.users.${auth.openid}`).data.isAdmin == true",
  "write": "auth.openid == doc._openid"
}
```

### parking_config 集合
```json
{
  "read": true,
  "write": "get(`database.users.${auth.openid}`).data.isAdmin == true"
}
```

## 测试数据说明

### 测试用户账号

初始化后会创建以下测试用户（需要在小程序中登录获取openid）：

| 用户 | openid | 权限 | 用途 |
|------|--------|------|------|
| 管理员张三 | test_admin_openid_001 | 管理员 | 测试管理功能 |
| 用户李四 | test_user_openid_001 | 普通用户 | 测试预约功能 |
| 用户王五 | test_user_openid_002 | 普通用户 | 测试预约功能 |

**注意：** 实际使用时，需要用真实用户登录后，将其 openid 更新到用户记录中。

### 课程排期说明

- 自动生成未来7天的排期
- 每天3个时段：09:00、14:00、19:00
- 每个课程 × 7天 × 3时段 = 21个排期
- 10个课程共 210个排期

## 常见问题

### Q1: 初始化后看不到数据？

A: 请检查：
1. 云函数是否部署成功
2. 数据库集合是否已创建
3. 查看云函数日志是否有错误
4. 数据库权限是否设置正确

### Q2: 初始化失败提示超时？

A: 可以尝试：
1. 分批初始化：先初始化基础数据（users, venues）
2. 再初始化课程数据（coaches, courses）
3. 或者联系云开发支持提高云函数超时时间

### Q3: 可以修改测试数据内容吗？

A: 可以！
1. 编辑 `cloudfunctions/initAllTestData/index.js`
2. 修改对应的数据数组（venuesData、coursesData等）
3. 重新部署云函数
4. 重新初始化

### Q4: 如何在小程序中调用这个云函数？

A: 添加一个管理页面：

```javascript
// pages/admin/init/init.js
wx.cloud.callFunction({
  name: 'initAllTestData',
  data: {
    action: 'all',
    clear: true
  }
}).then(res => {
  console.log('初始化成功', res)
  wx.showToast({
    title: '数据初始化成功',
    icon: 'success'
  })
}).catch(err => {
  console.error('初始化失败', err)
  wx.showToast({
    title: '初始化失败',
    icon: 'none'
  })
})
```

## 相关文档

- [云函数开发文档](cloudfunctions/initAllTestData/README.md)
- [数据库设计文档](DATABASE.md)
- [快速开始指南](../README.md)
