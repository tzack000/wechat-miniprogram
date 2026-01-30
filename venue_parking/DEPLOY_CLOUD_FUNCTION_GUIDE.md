# 部署云函数到微信开发者工具 - 详细指南

## 📋 准备工作

在开始之前，请确保：
- ✅ 已安装微信开发者工具
- ✅ 已开通云开发环境
- ✅ 项目代码已更新到最新版本（已完成 git pull）

## 🚀 部署步骤

### 第一步：打开微信开发者工具

1. 启动微信开发者工具
2. 打开你的小程序项目（wechat-venue-parking-miniprogram）
3. 确保已登录微信账号

### 第二步：定位到云函数目录

在左侧文件树中找到 `cloudfunctions` 目录，展开后应该能看到以下云函数：

```
cloudfunctions/
├── admin/
├── booking/
├── coach/
├── course/
├── initAllTestData/      ← 新增的统一初始化云函数
├── initCourseData/       
├── initTestData/        
├── parking/
├── testConcurrentBooking/
├── user/
└── venue/
```

### 第三步：部署 initAllTestData 云函数

#### 方式一：上传并部署（推荐）

1. **右键点击** `cloudfunctions/initAllTestData` 文件夹
2. 在弹出菜单中选择 **「上传并部署：云端安装依赖」**
3. 等待部署完成

> **注意：** 选择"云端安装依赖"会自动安装 `wx-server-sdk` 依赖，确保云函数正常运行。

#### 方式二：本地安装依赖后上传

如果方式一失败，可以尝试：

1. 在终端中进入云函数目录：
   ```bash
   cd cloudfunctions/initAllTestData
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 回到微信开发者工具，右键点击 `initAllTestData` 文件夹
4. 选择 **「上传并部署：所有文件」**

### 第四步：查看部署状态

部署过程中，在微信开发者工具底部会显示进度：

```
正在上传云函数 initAllTestData...
正在安装依赖...
部署成功 ✓
```

**部署成功的标志：**
- ✅ 底部控制台显示"部署成功"
- ✅ 云函数文件夹图标变为云朵图标 ☁️
- ✅ 文件夹名称前有小绿点 🟢

### 第五步：验证部署

#### 方法一：在微信开发者工具中测试

1. 点击工具栏的 **「云开发」** 按钮
2. 在云开发控制台中，点击左侧 **「云函数」**
3. 在云函数列表中找到 **`initAllTestData`**
4. 点击该云函数的名称进入详情页
5. 点击右上角 **「测试」** 按钮
6. 在测试窗口中输入测试参数：

```json
{
  "action": "all",
  "clear": true
}
```

7. 点击 **「运行测试」**
8. 查看返回结果

**预期的成功结果：**
```json
{
  "success": true,
  "message": "测试数据初始化完成！",
  "data": {
    "cleared": true,
    "users": { "count": 3 },
    "venues": { "count": 10 },
    "coaches": { "count": 5 },
    "courses": { "count": 10 },
    "schedules": { "count": 210 },
    "bookings": { "count": 6 },
    "parkingConfig": { "initialized": true },
    "parkingRecords": { "count": 2 }
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

#### 方法二：查看云开发控制台

1. 打开浏览器，访问 [云开发控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的云环境
3. 点击左侧 **「云函数」**
4. 确认 `initAllTestData` 在列表中
5. 查看状态是否为"正常"

### 第六步：初始化测试数据

部署成功后，立即初始化测试数据：

1. 在云函数详情页点击 **「测试」**
2. 输入以下参数：

```json
{
  "action": "all",
  "clear": true
}
```

3. 点击 **「运行测试」**
4. 等待执行完成（大约需要5-10秒）
5. 查看返回结果确认数据已成功初始化

### 第七步：验证数据

初始化完成后，验证数据是否正确：

1. 在云开发控制台点击 **「数据库」**
2. 检查以下集合是否有数据：

| 集合名称 | 预期数据量 |
|---------|-----------|
| users | 3条 |
| venues | 10条 |
| coaches | 5条 |
| courses | 10条 |
| course_schedules | 210条 |
| bookings | 6条 |
| parking_config | 1条 |
| parking_records | 2条 |

## 🎯 其他云函数部署（可选）

如果你还想部署其他新增的云函数，可以按照相同步骤：

### testConcurrentBooking 云函数

这是并发预约测试云函数，用于性能测试：

1. 右键点击 `cloudfunctions/testConcurrentBooking`
2. 选择 **「上传并部署：云端安装依赖」**
3. 等待部署完成

## ⚠️ 常见问题

### 问题1：部署失败 - 权限不足

**错误信息：**
```
部署失败：权限不足
```

**解决方法：**
1. 确保已登录微信开发者工具
2. 确认账号有云开发权限
3. 在云开发控制台检查环境状态

### 问题2：依赖安装失败

**错误信息：**
```
npm install 失败
```

**解决方法：**
1. 检查网络连接
2. 尝试使用"本地安装依赖"方式
3. 手动在终端执行：
   ```bash
   cd cloudfunctions/initAllTestData
   npm install --registry=https://registry.npmmirror.com
   ```

### 问题3：云函数列表中找不到

**可能原因：**
- 未刷新列表
- 部署未完成

**解决方法：**
1. 刷新云函数列表页面
2. 等待几秒钟再查看
3. 检查开发者工具控制台是否有错误信息

### 问题4：测试时超时

**错误信息：**
```
云函数执行超时
```

**解决方法：**
1. 分批初始化数据，使用 `modules` 参数：
   ```json
   {
     "modules": ["users", "venues"],
     "clear": true
   }
   ```
2. 在云开发控制台设置中增加云函数超时时间

### 问题5：数据库集合不存在

**错误信息：**
```
集合不存在
```

**解决方法：**
在云开发控制台 → 数据库中，手动创建以下集合：
- users
- venues
- bookings
- parking_config
- parking_records
- coaches
- courses
- course_schedules
- course_bookings

## 📊 部署检查清单

完成部署后，使用以下清单确认所有步骤：

- [ ] initAllTestData 云函数部署成功
- [ ] 云函数图标显示为云朵 ☁️
- [ ] 测试调用返回成功
- [ ] 数据库中有测试数据
- [ ] 数据量符合预期
- [ ] 在小程序中能正常访问数据

## 🎓 后续步骤

部署完成后，你可以：

1. **测试小程序功能**
   - 在模拟器中打开小程序
   - 测试场馆预约功能
   - 测试课程预约功能

2. **查看实时日志**
   - 云开发控制台 → 云函数 → 日志
   - 监控云函数调用情况

3. **调整数据**
   - 根据需要修改云函数中的测试数据
   - 重新部署并初始化

## 📞 需要帮助？

如果在部署过程中遇到问题：

1. 查看微信开发者工具控制台的错误信息
2. 查看云函数日志
3. 参考 [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
4. 查看项目文档：
   - [云函数详细文档](cloudfunctions/initAllTestData/README.md)
   - [初始化指南](docs/INIT_TEST_DATA.md)

## ✅ 部署成功！

如果所有步骤都完成，并且测试数据成功初始化，那么恭喜你！🎉

现在你可以：
- ✨ 使用完整的测试数据测试小程序
- 🎯 体验场馆预约功能
- 📚 体验课程预约功能
- 🚗 体验停车管理功能

祝开发愉快！💪
