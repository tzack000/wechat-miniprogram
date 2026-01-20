# 并发预约测试使用指南

## 快速开始

### 方法1: 命令行模拟测试（推荐）

最简单快速的测试方法，无需微信开发环境：

```bash
# 在项目根目录运行
node tests/simulate_concurrent_test.js
```

**优点**:
- ✓ 无需微信开发者工具
- ✓ 运行速度快（约30-40ms完成所有测试）
- ✓ 完整的测试报告
- ✓ 模拟真实并发场景

**测试场景**:
- 正常并发: 20人抢10个名额
- 高并发: 50人抢10个名额
- 极限并发: 100人抢10个名额
- 边界测试: 11人抢10个名额
- 大名额测试: 50人抢30个名额

**预期输出**:
```
╔═══════════════════════════════════════════════════╗
║      并发预约模拟测试 - 名额控制验证             ║
╚═══════════════════════════════════════════════════╝

========== 正常并发 ==========
场景: 20人抢10个名额
...
✓ 无超额预约 (10/10)
✓ 数据一致性 (10 = 10)
✓ 成功数准确 (10 = 10)
✓ 总体结果: 通过

...

🎉 所有测试通过！并发控制机制工作正常。
```

### 方法2: 微信小程序测试页面

在真实微信云开发环境中测试：

1. **打开微信开发者工具**
   - 加载本项目
   - 确保已配置云开发环境

2. **访问测试页面**
   - 路径: `pages/test/concurrent/concurrent`
   - 或在小程序中添加入口

3. **执行测试步骤**

   **步骤1: 创建测试排期**
   ```
   点击 "创建测试排期" 按钮
   → 系统会创建一个明天的课程排期
   → 最大名额: 10人
   → 时间: 23:00-23:59
   ```

   **步骤2: 运行并发测试**
   ```
   设置并发数（默认20）
   点击 "运行并发测试" 按钮
   → 系统模拟N个用户同时预约
   → 显示测试结果
   ```

   **步骤3: 验证结果**
   ```
   点击 "检查结果" 按钮
   → 验证数据一致性
   → 确认无超额预约
   ```

   **步骤4: 清理数据**
   ```
   点击 "清理测试数据" 按钮
   → 删除测试排期和预约记录
   ```

4. **查看测试结果**
   - ✓ 成功数应该 ≤ 最大名额
   - ✓ 排期显示的人数应该 = 实际预约记录数
   - ✓ 没有超额预约

### 方法3: 云函数直接调用

通过云函数接口进行测试：

```javascript
// 在微信开发者工具控制台执行

// 1. 创建测试排期
wx.cloud.callFunction({
  name: 'testConcurrentBooking',
  data: { action: 'setupTest' }
}).then(res => {
  console.log('排期ID:', res.result.data.scheduleId)
  
  // 2. 运行并发测试
  return wx.cloud.callFunction({
    name: 'testConcurrentBooking',
    data: {
      action: 'runConcurrentTest',
      scheduleId: res.result.data.scheduleId,
      concurrency: 50  // 并发数
    }
  })
}).then(res => {
  console.log('测试结果:', res.result)
})
```

## 测试文件说明

```
tests/
├── simulate_concurrent_test.js      # 独立模拟测试脚本 ⭐
├── concurrent_booking_test.js       # 微信环境测试框架
├── CONCURRENT_TEST_REPORT.md        # 完整测试报告
└── README.md                        # 本文件
```

### simulate_concurrent_test.js

**模拟并发测试脚本**，不依赖微信环境：

```bash
# 运行所有测试场景
node tests/simulate_concurrent_test.js

# 或在代码中使用
const { runAllTests, quickTest } = require('./tests/simulate_concurrent_test')

// 运行所有测试
await runAllTests()

// 快速单次测试
await quickTest(20, 10)  // 20人抢10个名额
```

**特点**:
- 使用Mock数据库模拟真实行为
- 完整的事务和锁机制模拟
- 5个预设测试场景
- 详细的测试报告输出

### concurrent_booking_test.js

**微信环境测试框架**，需要在小程序中运行：

```javascript
const { runAllTests, quickTest } = require('./tests/concurrent_booking_test')

// 需要在微信云开发环境中执行
await runAllTests()
```

## 云函数说明

### testConcurrentBooking

位置: `cloudfunctions/testConcurrentBooking/index.js`

**支持的操作**:

1. **setupTest** - 创建测试排期
   ```javascript
   wx.cloud.callFunction({
     name: 'testConcurrentBooking',
     data: { action: 'setupTest' }
   })
   ```

2. **runConcurrentTest** - 运行并发测试
   ```javascript
   wx.cloud.callFunction({
     name: 'testConcurrentBooking',
     data: {
       action: 'runConcurrentTest',
       scheduleId: 'xxx',
       concurrency: 20
     }
   })
   ```

3. **checkResults** - 检查测试结果
   ```javascript
   wx.cloud.callFunction({
     name: 'testConcurrentBooking',
     data: {
       action: 'checkResults',
       scheduleId: 'xxx'
     }
   })
   ```

4. **cleanup** - 清理测试数据
   ```javascript
   wx.cloud.callFunction({
     name: 'testConcurrentBooking',
     data: {
       action: 'cleanup',
       scheduleId: 'xxx'  // 可选，不传则清理所有测试数据
     }
   })
   ```

## 核心验证点

所有测试都会验证以下关键点：

### 1. 无超额预约 ✓
```
最终预约人数 ≤ 最大名额
```

### 2. 数据一致性 ✓
```
排期表.bookedCount == 实际预约记录数
```

### 3. 事务完整性 ✓
```
成功的请求数 == 创建的预约记录数
```

### 4. 状态正确性 ✓
```
满额时: status = 'full'
有余额: status = 'available'
```

## 常见问题

### Q1: 为什么有些请求会失败？

**答**: 这是正常的！当并发请求超过可用名额时，超出的请求应该失败。

失败原因主要有两种：
- **"名额已满"**: 在事务开始时检测到名额不足
- **"提交时名额已满"**: 在事务提交时检测到其他事务已占用名额（乐观锁）

### Q2: 如何自定义测试场景？

**答**: 修改 `simulate_concurrent_test.js` 中的 `TEST_SCENARIOS` 数组：

```javascript
const TEST_SCENARIOS = [
  {
    name: '我的测试',
    concurrency: 30,      // 并发数
    maxStudents: 15,      // 最大名额
    expectedSuccess: 15,  // 预期成功数
    description: '30人抢15个名额'
  }
]
```

### Q3: 测试失败了怎么办？

**答**: 检查以下几点：

1. **超额预约**: 
   - 检查事务是否正确提交
   - 验证名额检查逻辑

2. **数据不一致**:
   - 检查预约记录创建逻辑
   - 验证计数更新逻辑

3. **模拟环境问题**:
   - 确保使用真实云函数测试
   - 查看云函数日志

### Q4: 如何在生产环境测试？

**答**: 建议步骤：

1. 使用测试云环境
2. 创建专门的测试账号
3. 设置明显的测试标识
4. 及时清理测试数据
5. 监控系统性能指标

## 性能指标

基于模拟测试的性能数据：

| 并发数 | 总耗时 | 平均响应 | 成功率 |
|--------|--------|----------|--------|
| 20     | 41ms   | 2.05ms   | 50%    |
| 50     | 34ms   | 0.68ms   | 20%    |
| 100    | 31ms   | 0.31ms   | 10%    |

**结论**: 系统能够高效处理高并发请求，性能表现优秀。

## 最佳实践

1. **定期测试**: 在重大更新后运行完整测试
2. **压力测试**: 定期进行高并发压力测试
3. **监控预警**: 设置并发预约监控
4. **日志记录**: 记录关键操作日志
5. **快速恢复**: 准备回滚方案

## 下一步

- [ ] 增加更多测试场景
- [ ] 添加性能基准测试
- [ ] 集成到CI/CD流程
- [ ] 添加自动化测试报告
- [ ] 监控生产环境指标

## 相关文档

- [完整测试报告](./CONCURRENT_TEST_REPORT.md)
- [云函数代码](../cloudfunctions/testConcurrentBooking/index.js)
- [预约逻辑](../cloudfunctions/course/index.js)
- [测试页面](../miniprogram/pages/test/concurrent/)

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。
