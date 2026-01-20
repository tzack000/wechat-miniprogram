# 并发预约和名额控制测试指南

## 📝 测试目标

验证课程预约系统在高并发场景下的：
1. **名额控制准确性**：不会出现超额预约
2. **数据一致性**：排期的bookedCount与实际预约记录数量一致
3. **事务安全性**：并发操作不会导致数据异常
4. **性能表现**：响应时间在可接受范围内

## 🚀 快速开始

### 方式一：使用测试工具页面（推荐）

1. **添加测试页面到app.json**：
```json
{
  "pages": [
    "pages/test/concurrent/concurrent",
    // ... 其他页面
  ]
}
```

2. **在微信开发者工具中访问**：
```
/pages/test/concurrent/concurrent
```

3. **按步骤操作**：
   - 步骤1：创建测试排期
   - 步骤2：运行并发测试
   - 步骤3：检查结果
   - 步骤4：清理数据

### 方式二：使用云开发控制台

1. **部署测试云函数**：
```bash
右键 cloudfunctions/testConcurrentBooking/
选择"上传并部署：云端安装依赖"
```

2. **在云函数控制台执行测试**。

## 🧪 详细测试步骤

### 第一步：部署测试云函数

```bash
1. 确保已部署 coach 和 course 云函数
2. 部署 testConcurrentBooking 云函数
3. 确保数据库已有课程和教练数据
```

### 第二步：创建测试排期

**方式A：使用测试页面**
- 点击"创建测试排期"按钮
- 自动创建一个10人名额的排期

**方式B：云函数控制台**
```json
// 调用 testConcurrentBooking
{
  "action": "setupTest"
}
```

**预期输出**：
```json
{
  "success": true,
  "message": "测试排期创建成功",
  "data": {
    "scheduleId": "6791a2b4c823456789abcdef",
    "courseId": "...",
    "courseName": "哈他瑜伽基础课",
    "date": "2026-01-20",
    "time": "23:00-23:59",
    "maxStudents": 10,
    "testInfo": "请使用此 scheduleId 运行并发测试"
  }
}
```

### 第三步：运行并发测试

**测试场景**：
- 10个名额的排期
- 20个并发预约请求
- 理论上只有10个成功，10个失败

**方式A：使用测试页面**
1. 输入并发数（建议20）
2. 点击"开始测试"按钮
3. 等待测试完成

**方式B：云函数控制台**
```json
{
  "action": "runConcurrentTest",
  "scheduleId": "6791a2b4c823456789abcdef",
  "concurrency": 20
}
```

**预期输出**：
```json
{
  "success": true,
  "message": "并发测试通过 ✓",
  "testPassed": true,
  "data": {
    "testConfig": {
      "scheduleId": "...",
      "maxStudents": 10,
      "concurrency": 20,
      "duration": "1234ms"
    },
    "results": {
      "successCount": 10,  // 成功10个
      "failCount": 10,     // 失败10个（名额已满）
      "errorCount": 0,     // 错误0个
      "totalAttempts": 20
    },
    "finalState": {
      "bookedCount": 10,        // 排期显示10人
      "actualBookings": 10,     // 实际记录10条
      "status": "full"          // 状态已满
    },
    "validation": {
      "noOverbooking": true,     // ✓ 无超额
      "dataConsistent": true,    // ✓ 数据一致
      "testPassed": true         // ✓ 总体通过
    }
  }
}
```

### 第四步：验证结果

**方式A：使用测试页面**
- 点击"检查结果"按钮
- 查看数据一致性验证

**方式B：云函数控制台**
```json
{
  "action": "checkResults",
  "scheduleId": "6791a2b4c823456789abcdef"
}
```

**方式C：手动验证**
1. 在云开发控制台打开 course_schedules 集合
2. 查找测试排期，确认 bookedCount = 10
3. 打开 course_bookings 集合
4. 筛选 scheduleId = 测试排期ID，status = confirmed
5. 确认记录数 = 10

### 第五步：清理测试数据

**方式A：使用测试页面**
- 点击"清理测试数据"按钮

**方式B：云函数控制台**
```json
{
  "action": "cleanup",
  "scheduleId": "6791a2b4c823456789abcdef"
}
```

## 📊 测试场景

### 场景1：基础并发测试（20并发）

**配置**：
- 最大名额：10
- 并发请求：20
- 预期成功：10
- 预期失败：10

**验证点**：
- ✓ 成功预约数 ≤ 10
- ✓ bookedCount = 实际记录数
- ✓ 排期状态变为 full
- ✓ 无错误或异常

### 场景2：高并发测试（50并发）

**配置**：
- 最大名额：10
- 并发请求：50
- 预期成功：10
- 预期失败：40

**验证点**：
- ✓ 在更高并发下仍无超额
- ✓ 数据保持一致
- ✓ 响应时间可接受

### 场景3：极限并发测试（100并发）

**配置**：
- 最大名额：10
- 并发请求：100
- 预期成功：10
- 预期失败：90

**验证点**：
- ✓ 极限情况下仍安全
- ✓ 系统不崩溃
- ✓ 事务正常工作

### 场景4：满额边界测试

**配置**：
- 最大名额：10
- 先预约9个
- 然后10个并发请求
- 预期成功：1
- 预期失败：9

**验证点**：
- ✓ 临界状态下名额控制准确
- ✓ 最后一个名额不会被重复预约

## ✅ 测试通过标准

### 必须通过的条件

1. **无超额预约**：
   - `finalState.actualBookings <= testConfig.maxStudents`
   - ✓ 实际预约数不超过最大人数

2. **数据一致性**：
   - `finalState.bookedCount === finalState.actualBookings`
   - ✓ 排期显示的人数 = 数据库记录数

3. **事务完整性**：
   - `validation.noOverbooking === true`
   - `validation.dataConsistent === true`
   - ✓ 所有验证项都通过

### 性能参考标准

- 20并发：< 2秒
- 50并发：< 5秒
- 100并发：< 10秒

## 🐛 常见问题和解决方案

### 问题1：测试失败 - 出现超额预约

**症状**：
```
finalState.actualBookings = 12  (应该 ≤ 10)
validation.noOverbooking = false
```

**可能原因**：
- 事务未正确实现
- 数据库不支持事务
- 并发控制逻辑错误

**排查步骤**：
1. 检查 course 云函数的 book 函数
2. 确认使用了 `db.startTransaction()`
3. 确认事务的 commit 和 rollback 逻辑
4. 检查数据库环境是否支持事务

**解决方案**：
```javascript
// 确保使用事务
const transaction = await db.startTransaction()
try {
  // 1. 读取排期
  const schedule = await transaction.collection('course_schedules')
    .doc(scheduleId).get()
  
  // 2. 检查名额
  if (schedule.data.bookedCount >= schedule.data.maxStudents) {
    throw new Error('名额已满')
  }
  
  // 3. 创建预约
  await transaction.collection('course_bookings').add({ data: booking })
  
  // 4. 更新名额
  await transaction.collection('course_schedules').doc(scheduleId)
    .update({ data: { bookedCount: schedule.data.bookedCount + 1 }})
  
  // 5. 提交事务
  await transaction.commit()
} catch (error) {
  await transaction.rollback()
  throw error
}
```

### 问题2：数据不一致

**症状**：
```
finalState.bookedCount = 10
finalState.actualBookings = 8
validation.dataConsistent = false
```

**可能原因**：
- 某些预约创建成功但计数未更新
- 某些预约失败但计数已更新
- 事务部分成功

**排查步骤**：
1. 查看 course_bookings 集合
2. 筛选该排期的所有预约
3. 检查预约状态
4. 对比排期的 bookedCount

**解决方案**：
- 确保预约创建和计数更新在同一个事务中
- 检查事务commit前的所有操作

### 问题3：性能过慢

**症状**：
- 20并发测试需要 > 5秒

**可能原因**：
- 数据库索引缺失
- 云函数资源不足
- 网络延迟

**解决方案**：
1. 为 course_schedules 添加索引：
   - `scheduleId` 单字段索引
   - `courseId + date` 复合索引

2. 为 course_bookings 添加索引：
   - `scheduleId + _openid` 唯一复合索引

3. 检查云函数配置，提升内存

### 问题4：测试云函数调用失败

**症状**：
- 云函数返回错误或超时

**排查步骤**：
1. 检查云函数是否部署成功
2. 查看云函数日志
3. 确认数据库权限
4. 检查网络连接

## 📈 测试报告模板

### 并发预约测试报告

**测试时间**：2026-01-19 14:30:00

**测试环境**：
- 云开发环境：生产环境
- 数据库版本：2.0
- 云函数版本：1.0.0

**测试配置**：
| 场景 | 最大名额 | 并发数 | 预期成功 | 预期失败 |
|------|---------|--------|----------|----------|
| 场景1 | 10 | 20 | 10 | 10 |
| 场景2 | 10 | 50 | 10 | 40 |
| 场景3 | 10 | 100 | 10 | 90 |

**测试结果**：
| 场景 | 实际成功 | 实际失败 | 用时 | 数据一致 | 无超额 | 结论 |
|------|----------|----------|------|----------|--------|------|
| 场景1 | 10 | 10 | 1.2s | ✓ | ✓ | ✅ 通过 |
| 场景2 | 10 | 40 | 3.5s | ✓ | ✓ | ✅ 通过 |
| 场景3 | 10 | 90 | 8.2s | ✓ | ✓ | ✅ 通过 |

**详细数据**：
```
场景1：
- 成功预约：10
- 失败预约：10（名额已满）
- 错误次数：0
- 排期bookedCount：10
- 实际记录数：10
- 排期状态：full
- 验证结果：✓ 所有检查通过
```

**结论**：
- ✅ 所有测试场景通过
- ✅ 无超额预约情况
- ✅ 数据保持一致
- ✅ 性能表现良好
- ✅ 系统并发安全可靠

**建议**：
- 系统可以正式投入使用
- 建议添加监控告警
- 定期进行并发测试

## 🔧 高级测试技巧

### 技巧1：使用多设备真实测试

除了云函数模拟，也可以：
1. 准备多个测试设备或账号
2. 同时在多个设备上打开课程详情
3. 协调在同一时间点击预约
4. 观察实际结果

### 技巧2：监控数据库操作

在测试过程中：
1. 打开云开发控制台 → 数据库
2. 实时查看 course_schedules 的 bookedCount 变化
3. 实时查看 course_bookings 的记录增加
4. 观察是否有异常

### 技巧3：压力测试

逐步增加并发数：
- 10 → 20 → 50 → 100 → 200
- 找到系统的性能瓶颈
- 评估实际承载能力

### 技巧4：边界条件测试

- 最后1个名额时的10并发
- 已满后的继续预约
- 取消后的重新预约

## 📚 相关文档

- 部署指南：`DEPLOYMENT_GUIDE.md`
- 快速启动：`QUICK_START.md`
- 实施总结：`IMPLEMENTATION.md`
- 功能提案：`proposal.md`
- 技术设计：`design.md`

## ✨ 总结

并发预约测试是验证系统安全性的关键环节。通过本测试工具，您可以：

1. **快速验证**：一键测试，自动生成报告
2. **全面覆盖**：测试各种并发场景
3. **问题定位**：详细的错误信息和验证结果
4. **持续监控**：保存测试历史，对比不同版本

**测试通过标准**：
- ✅ 无超额预约（noOverbooking = true）
- ✅ 数据一致（dataConsistent = true）
- ✅ 性能可接受（响应时间在标准范围内）

只要满足以上条件，系统就可以安全地投入生产使用！🎉
