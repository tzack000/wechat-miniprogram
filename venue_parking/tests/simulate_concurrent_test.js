/**
 * 并发预约模拟测试脚本
 * 
 * 此脚本模拟并发预约场景，用于验证名额控制逻辑
 * 不依赖微信云开发环境，可以独立运行
 */

// 模拟数据库和事务
class MockDatabase {
  constructor() {
    this.schedules = new Map();
    this.bookings = new Map();
    this.transactionLocks = new Map();
    this.transactionCount = 0;
  }
  
  // 创建排期
  createSchedule(scheduleId, maxStudents) {
    this.schedules.set(scheduleId, {
      _id: scheduleId,
      maxStudents,
      bookedCount: 0,
      status: 'available',
      createTime: new Date()
    });
  }
  
  // 获取排期
  getSchedule(scheduleId) {
    return this.schedules.get(scheduleId);
  }
  
  // 模拟事务
  async startTransaction() {
    const transactionId = ++this.transactionCount;
    const db = this;
    
    const transaction = {
      id: transactionId,
      operations: [],
      scheduleId: null,
      bookingData: null,
      
      // 获取排期（事务内）
      getSchedule: async (scheduleId) => {
        // 模拟数据库延迟
        await db.sleep(Math.random() * 5);
        
        const schedule = db.schedules.get(scheduleId);
        if (!schedule) {
          throw new Error('排期不存在');
        }
        
        // 保存scheduleId
        transaction.scheduleId = scheduleId;
        
        // 返回深拷贝，模拟事务隔离
        return JSON.parse(JSON.stringify(schedule));
      },
      
      // 创建预约（事务内）
      createBooking: async (bookingData) => {
        await db.sleep(Math.random() * 5);
        transaction.bookingData = bookingData;
        return { _id: `booking_${Date.now()}_${Math.random()}` };
      },
      
      // 更新排期（事务内）
      updateSchedule: async (scheduleId, updates) => {
        await db.sleep(Math.random() * 5);
        return { success: true };
      },
      
      // 提交事务
      commit: async () => {
        await db.sleep(Math.random() * 10);
        
        // 模拟事务提交时的竞争
        // 使用锁机制确保原子性
        const scheduleId = transaction.scheduleId;
        if (!scheduleId) return;
        
        // 获取锁
        while (db.transactionLocks.get(scheduleId)) {
          await db.sleep(1);
        }
        
        db.transactionLocks.set(scheduleId, transactionId);
        
        try {
          const schedule = db.schedules.get(scheduleId);
          if (schedule) {
            // 再次检查名额（关键！）
            if (schedule.bookedCount >= schedule.maxStudents) {
              throw new Error('提交时名额已满');
            }
            
            // 更新计数
            schedule.bookedCount++;
            schedule.status = schedule.bookedCount >= schedule.maxStudents ? 'full' : 'available';
            schedule.updateTime = new Date();
            
            // 创建预约记录
            const bookingId = `booking_${Date.now()}_${Math.random()}`;
            db.bookings.set(bookingId, {
              _id: bookingId,
              scheduleId,
              ...transaction.bookingData,
              createTime: new Date()
            });
          }
        } finally {
          // 释放锁
          db.transactionLocks.delete(scheduleId);
        }
      },
      
      // 回滚事务
      rollback: async () => {
        await db.sleep(Math.random() * 5);
      }
    };
    
    return transaction;
  }
  
  // 获取预约统计
  getBookingStats(scheduleId) {
    const bookings = Array.from(this.bookings.values())
      .filter(b => b.scheduleId === scheduleId);
    
    return {
      total: bookings.length,
      schedule: this.schedules.get(scheduleId)
    };
  }
  
  // 清理数据
  cleanup() {
    this.schedules.clear();
    this.bookings.clear();
    this.transactionLocks.clear();
  }
  
  // 辅助函数：延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 模拟预约函数（对应云函数中的 simulateBooking）
async function simulateBooking(db, scheduleId, userIndex) {
  try {
    // 随机延迟，模拟网络延迟
    await db.sleep(Math.random() * 20);
    
    // 开启事务
    const transaction = await db.startTransaction();
    
    try {
      // 1. 检查排期状态
      const schedule = await transaction.getSchedule(scheduleId);
      
      if (schedule.status === 'cancelled') {
        throw new Error('排期已取消');
      }
      
      if (schedule.bookedCount >= schedule.maxStudents) {
        throw new Error('名额已满');
      }
      
      // 2. 创建预约记录
      await transaction.createBooking({
        scheduleId,
        userId: `user_${userIndex}`,
        createTime: new Date()
      });
      
      // 3. 更新排期人数
      const newBookedCount = schedule.bookedCount + 1;
      const newStatus = newBookedCount >= schedule.maxStudents ? 'full' : 'available';
      
      await transaction.updateSchedule(scheduleId, {
        bookedCount: newBookedCount,
        status: newStatus
      });
      
      // 4. 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: '预约成功',
        userIndex
      };
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    return {
      success: false,
      message: error.message || '预约失败',
      userIndex
    };
  }
}

// 运行并发测试
async function runConcurrentTest(concurrency, maxStudents) {
  const db = new MockDatabase();
  const scheduleId = 'test_schedule_001';
  
  // 创建测试排期
  db.createSchedule(scheduleId, maxStudents);
  
  console.log(`\n初始状态: 最大名额 ${maxStudents}，并发数 ${concurrency}`);
  
  // 创建并发预约任务
  const bookingPromises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < concurrency; i++) {
    bookingPromises.push(simulateBooking(db, scheduleId, i));
  }
  
  // 等待所有预约完成
  const results = await Promise.allSettled(bookingPromises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 统计结果
  const successResults = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failResults = results.filter(r => r.status === 'fulfilled' && !r.value.success);
  const errorResults = results.filter(r => r.status === 'rejected');
  
  const successCount = successResults.length;
  const failCount = failResults.length;
  const errorCount = errorResults.length;
  
  // 获取最终状态
  const stats = db.getBookingStats(scheduleId);
  const finalSchedule = stats.schedule;
  const actualBookings = stats.total;
  
  // 分析失败原因
  const failureReasons = {};
  failResults.forEach(r => {
    const reason = r.value.message;
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });
  
  // 验证结果
  const validation = {
    noOverbooking: finalSchedule.bookedCount <= maxStudents && actualBookings <= maxStudents,
    dataConsistent: finalSchedule.bookedCount === actualBookings,
    correctSuccessCount: successCount === actualBookings,
    testPassed: false
  };
  
  validation.testPassed = validation.noOverbooking && 
                          validation.dataConsistent && 
                          validation.correctSuccessCount;
  
  // 输出结果
  console.log('\n========== 测试结果 ==========');
  console.log(`\n执行时间: ${duration}ms`);
  console.log(`平均响应: ${(duration / concurrency).toFixed(2)}ms`);
  
  console.log('\n请求统计:');
  console.log(`  总请求: ${concurrency}`);
  console.log(`  成功: ${successCount} (${(successCount/concurrency*100).toFixed(1)}%)`);
  console.log(`  失败: ${failCount} (${(failCount/concurrency*100).toFixed(1)}%)`);
  console.log(`  错误: ${errorCount} (${(errorCount/concurrency*100).toFixed(1)}%)`);
  
  if (Object.keys(failureReasons).length > 0) {
    console.log('\n失败原因分布:');
    Object.entries(failureReasons).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}次`);
    });
  }
  
  console.log('\n最终状态:');
  console.log(`  排期显示已预约: ${finalSchedule.bookedCount}`);
  console.log(`  实际预约记录: ${actualBookings}`);
  console.log(`  排期状态: ${finalSchedule.status}`);
  console.log(`  最大名额: ${finalSchedule.maxStudents}`);
  
  console.log('\n数据验证:');
  console.log(`  ${validation.noOverbooking ? '✓' : '✗'} 无超额预约 (${finalSchedule.bookedCount}/${maxStudents})`);
  console.log(`  ${validation.dataConsistent ? '✓' : '✗'} 数据一致性 (${finalSchedule.bookedCount} = ${actualBookings})`);
  console.log(`  ${validation.correctSuccessCount ? '✓' : '✗'} 成功数准确 (${successCount} = ${actualBookings})`);
  console.log(`  ${validation.testPassed ? '✓' : '✗'} 总体结果: ${validation.testPassed ? '通过' : '失败'}`);
  
  // 详细失败信息
  if (!validation.testPassed) {
    console.log('\n⚠️ 测试失败，问题分析:');
    
    if (!validation.noOverbooking) {
      console.log(`  - 超额预约！预约数(${Math.max(finalSchedule.bookedCount, actualBookings)})超过名额(${maxStudents})`);
    }
    
    if (!validation.dataConsistent) {
      console.log(`  - 数据不一致！排期显示${finalSchedule.bookedCount}人，实际${actualBookings}条记录`);
    }
    
    if (!validation.correctSuccessCount) {
      console.log(`  - 统计错误！成功请求${successCount}次，实际记录${actualBookings}条`);
    }
  }
  
  return {
    success: validation.testPassed,
    duration,
    results: {
      successCount,
      failCount,
      errorCount,
      totalAttempts: concurrency
    },
    finalState: {
      bookedCount: finalSchedule.bookedCount,
      actualBookings,
      status: finalSchedule.status
    },
    validation
  };
}

// 测试套件
const TEST_SCENARIOS = [
  { name: '正常并发', concurrency: 20, maxStudents: 10 },
  { name: '高并发', concurrency: 50, maxStudents: 10 },
  { name: '极限并发', concurrency: 100, maxStudents: 10 },
  { name: '边界测试', concurrency: 11, maxStudents: 10 },
  { name: '大名额', concurrency: 50, maxStudents: 30 },
];

// 运行所有测试
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║      并发预约模拟测试 - 名额控制验证             ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n\n========== ${scenario.name} ==========`);
    console.log(`场景: ${scenario.concurrency}人抢${scenario.maxStudents}个名额`);
    
    const result = await runConcurrentTest(scenario.concurrency, scenario.maxStudents);
    
    results.push({
      ...scenario,
      ...result
    });
    
    // 场景间延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 总结报告
  console.log('\n\n╔═══════════════════════════════════════════════════╗');
  console.log('║                   总结报告                        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  const passCount = results.filter(r => r.success).length;
  const failCount = results.length - passCount;
  
  console.log(`\n测试总数: ${results.length}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`通过率: ${(passCount/results.length*100).toFixed(1)}%`);
  
  console.log('\n详细结果:');
  console.log('─'.repeat(80));
  console.log(
    '场景'.padEnd(15) + 
    '并发'.padEnd(8) + 
    '名额'.padEnd(8) + 
    '成功'.padEnd(8) + 
    '耗时'.padEnd(10) + 
    '结果'
  );
  console.log('─'.repeat(80));
  
  results.forEach(result => {
    const status = result.success ? '✓ 通过' : '✗ 失败';
    console.log(
      result.name.padEnd(15) +
      String(result.concurrency).padEnd(8) +
      String(result.maxStudents).padEnd(8) +
      String(result.results.successCount).padEnd(8) +
      `${result.duration}ms`.padEnd(10) +
      status
    );
  });
  
  console.log('─'.repeat(80));
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！并发控制机制工作正常。');
  } else {
    console.log(`\n⚠️ 发现 ${failCount} 个测试失败，请检查并发控制逻辑。`);
  }
  
  return {
    total: results.length,
    passed: passCount,
    failed: failCount,
    results
  };
}

// 主函数
async function main() {
  try {
    const summary = await runAllTests();
    
    // 根据测试结果设置退出码
    if (summary.failed > 0) {
      console.error(`\n❌ 测试失败：${summary.failed}/${summary.total} 个场景未通过`);
      process.exit(1);
    }
    
    // 所有测试通过
    process.exit(0);
  } catch (error) {
    console.error('测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runConcurrentTest,
  simulateBooking,
  MockDatabase
};
