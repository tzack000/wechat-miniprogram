# 🚀 快速开始

## 5分钟快速测试课程预约功能

### 📦 准备工作（2分钟）

1. **下载微信开发者工具**
   - 地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. **克隆代码**
   ```bash
   git clone git@github.com:tzack000/wechat-venue-parking-miniprogram.git
   cd wechat-venue-parking-miniprogram
   ```

3. **打开项目**
   - 启动微信开发者工具
   - 导入项目（输入你的测试AppID）

### ☁️ 云开发配置（2分钟）

1. **初始化云环境**
   - 点击工具栏"云开发"按钮
   - 创建新环境（如 `test-env`）

2. **上传云函数**
   - 右键 `cloudfunctions/coach` → "上传并部署：云端安装依赖"
   - 右键 `cloudfunctions/course` → "上传并部署：云端安装依赖"

3. **创建数据库集合**
   
   在云开发控制台 → 数据库中创建：
   - `coaches`（教练）
   - `courses`（课程）
   - `course_schedules`（排期）
   - `course_bookings`（预约）

4. **初始化测试数据**
   - 云开发控制台 → 云函数 → `initCourseData`
   - 点击"测试"按钮
   - 确认返回成功

### ✅ 功能测试（1分钟）

1. **查看教练列表**
   - 首页 → 教练列表
   - 应显示 5 位教练

2. **浏览课程**
   - 首页 → 课程预约
   - 应显示 10 门课程

3. **完整预约流程**
   - 选择课程 → 立即预约
   - 选择教练和时间
   - 填写信息 → 确认预约
   - 查看"我的课程"

### 🎯 验证成功

如果看到以下内容，说明配置成功：
- ✅ 教练列表显示 5 位教练
- ✅ 课程列表显示 10 门课程
- ✅ 可以完成预约流程
- ✅ 我的课程显示预约记录

---

## 📚 详细文档

- **完整测试指南**: `WECHAT_DEV_TEST_GUIDE.md`
- **测试报告**: `TEST_REPORT.md`
- **功能设计**: `openspec/changes/add-course-booking-with-coach/`

---

## ❓ 遇到问题？

**常见问题**：
1. 云函数调用失败 → 检查云函数是否上传成功
2. 数据不显示 → 检查集合权限（设为"所有用户可读"）
3. 预约失败 → 确保有排期数据

**详细排查**: 查看 `WECHAT_DEV_TEST_GUIDE.md` 第6节

---

**🎉 开始测试吧！**
