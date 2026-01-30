/**
 * 并发预约和名额控制测试脚本
 * 
 * 使用方法：
 * 1. 确保已初始化数据库（有课程和教练数据）
 * 2. 在微信开发者工具中打开测试页面：pages/test/concurrent/concurrent
 * 3. 或者通过云函数直接调用进行测试
 */

const test = require('ava');

// 测试配置
const TEST_SCENARIOS = [
  {
    name: '正常并发测试',
    concurrency: 20,
    maxStudents: 10,
    expectedSuccess: 10,
    description: '20人抢10个名额，应该正好10人成功'
  },
  {
    name: '超高并发测试',
    concurrency: 50,
    maxStudents: 10,
    expectedSuccess: 10,
    description: '50人抢10个名额，测试高并发场景'
  },
  {
    name: '极限并发测试',
    concurrency: 100,
    maxStudents: 10,
    expectedSuccess: 10,
    description: '100人抢10个名额，测试极限并发'
  },
  {
    name: '边界测试',
    concurrency: 11,
    maxStudents: 10,
    expectedSuccess: 10,
    description: '11人抢10个名额，测试临界值'
  }
];

/**
 * 模拟云函数调用
 * 在实际环境中，这会调用微信云函数
 */
async function callCloudFunction(name, data) {
  // 这里需要根据实际环境替换为真实的云函数调用
  // 例如：wx.cloud.callFunction({ name, data })
  
  throw new Error('请在微信小程序环境中运行此测试，或配置云函数调用方式');
}

/**
 * 创建测试排期
 */
async function setupTestSchedule(maxStudents = 10) {
  const result = await callCloudFunction('testConcurrentBooking', {
    action: 'setupTest',
    maxStudents
  });
  
  if (!result.success) {
    throw new Error(`创建测试排期失败: ${result.message}`);
  }
  
  return result.data.scheduleId;
}

/**
 * 运行并发测试
 */
async function runConcurrentTest(scheduleId, concurrency) {
  const startTime = Date.now();
  
  const result = await callCloudFunction('testConcurrentBooking', {
    action: 'runConcurrentTest',
    scheduleId,
    concurrency
  });
  
  const endTime = Date.now();
  const clientDuration = endTime - startTime;
  
  return {
    ...result,
    clientDuration
  };
}

/**
 * 检查测试结果
 */
async function checkResults(scheduleId) {
  const result = await callCloudFunction('testConcurrentBooking', {
    action: 'checkResults',
    scheduleId
  });
  
  return result;
}

/**
 * 清理测试数据
 */
async function cleanup(scheduleId) {
  await callCloudFunction('testConcurrentBooking', {
    action: 'cleanup',
    scheduleId
  });
}

/**
 * 运行单个测试场景
 */
async function runTestScenario(scenario) {
  console.log(`\n========== ${scenario.name} ==========`);
  console.log(`描述: ${scenario.description}`);
  console.log(`并发数: ${scenario.concurrency}, 名额: ${scenario.maxStudents}`);
  
  let scheduleId;
  
  try {
    // 1. 创建测试排期
    console.log('\n步骤1: 创建测试排期...');
    scheduleId = await setupTestSchedule(scenario.maxStudents);
    console.log(`✓ 排期创建成功: ${scheduleId}`);
    
    // 2. 运行并发测试
    console.log(`\n步骤2: 运行${scenario.concurrency}并发测试...`);
    const testResult = await runConcurrentTest(scheduleId, scenario.concurrency);
    
    if (!testResult.success) {
      throw new Error(`测试执行失败: ${testResult.message}`);
    }
    
    // 3. 输出测试结果
    console.log('\n========== 测试结果 ==========');
    const data = testResult.data;
    
    console.log('\n配置信息:');
    console.log(`  最大名额: ${data.testConfig.maxStudents}`);
    console.log(`  并发数: ${data.testConfig.concurrency}`);
    console.log(`  执行时间: ${data.testConfig.duration}`);
    console.log(`  客户端耗时: ${testResult.clientDuration}ms`);
    
    console.log('\n请求结果:');
    console.log(`  成功: ${data.results.successCount}`);
    console.log(`  失败: ${data.results.failCount}`);
    console.log(`  错误: ${data.results.errorCount}`);
    console.log(`  总计: ${data.results.totalAttempts}`);
    
    console.log('\n最终状态:');
    console.log(`  排期已预约数: ${data.finalState.bookedCount}`);
    console.log(`  实际预约记录: ${data.finalState.actualBookings}`);
    console.log(`  排期状态: ${data.finalState.status}`);
    
    console.log('\n验证结果:');
    console.log(`  ${data.validation.noOverbooking ? '✓' : '✗'} 无超额预约`);
    console.log(`  ${data.validation.dataConsistent ? '✓' : '✗'} 数据一致性`);
    console.log(`  ${data.validation.testPassed ? '✓' : '✗'} 测试通过`);
    
    // 4. 二次验证
    console.log('\n步骤3: 二次验证结果...');
    const checkResult = await checkResults(scheduleId);
    
    if (checkResult.success) {
      const check = checkResult.data;
      console.log(`  排期显示: ${check.schedule.bookedCount}人`);
      console.log(`  实际记录: ${check.bookings.confirmed}人`);
      console.log(`  数据一致: ${check.validation.dataConsistent ? '是' : '否'}`);
      console.log(`  无超额: ${check.validation.noOverbooking ? '是' : '否'}`);
      
      if (check.issues.length > 0) {
        console.log('\n  ⚠️ 发现问题:');
        check.issues.forEach(issue => console.log(`    - ${issue}`));
      }
    }
    
    // 5. 断言验证
    const assertions = {
      pass: true,
      errors: []
    };
    
    // 验证成功数不超过最大名额
    if (data.results.successCount > scenario.maxStudents) {
      assertions.pass = false;
      assertions.errors.push(`成功数(${data.results.successCount})超过最大名额(${scenario.maxStudents})`);
    }
    
    // 验证最终预约数不超过最大名额
    if (data.finalState.bookedCount > scenario.maxStudents) {
      assertions.pass = false;
      assertions.errors.push(`最终预约数(${data.finalState.bookedCount})超过最大名额(${scenario.maxStudents})`);
    }
    
    // 验证数据一致性
    if (data.finalState.bookedCount !== data.finalState.actualBookings) {
      assertions.pass = false;
      assertions.errors.push(`数据不一致: 排期显示${data.finalState.bookedCount}人，实际${data.finalState.actualBookings}人`);
    }
    
    // 验证预期成功数
    if (data.results.successCount !== scenario.expectedSuccess) {
      // 这是警告，不算失败
      console.log(`\n  ⚠️ 警告: 实际成功数(${data.results.successCount})与预期(${scenario.expectedSuccess})不符`);
    }
    
    console.log('\n========== 测试总结 ==========');
    if (assertions.pass) {
      console.log('✓ 测试通过 - 所有验证点均符合预期');
    } else {
      console.log('✗ 测试失败 - 发现以下问题:');
      assertions.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return {
      scenario: scenario.name,
      success: assertions.pass,
      data: testResult.data,
      errors: assertions.errors
    };
    
  } catch (error) {
    console.error(`\n✗ 测试执行异常: ${error.message}`);
    console.error(error.stack);
    
    return {
      scenario: scenario.name,
      success: false,
      error: error.message
    };
    
  } finally {
    // 清理测试数据
    if (scheduleId) {
      try {
        console.log('\n步骤4: 清理测试数据...');
        await cleanup(scheduleId);
        console.log('✓ 清理完成');
      } catch (error) {
        console.error(`⚠️ 清理失败: ${error.message}`);
      }
    }
  }
}

/**
 * 运行所有测试场景
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║      并发预约和名额控制 - 综合测试套件           ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    const result = await runTestScenario(scenario);
    results.push(result);
    
    // 场景间延迟，避免数据库压力
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 输出总结报告
  console.log('\n\n╔═══════════════════════════════════════════════════╗');
  console.log('║                   总结报告                        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  const passCount = results.filter(r => r.success).length;
  const failCount = results.length - passCount;
  
  console.log(`\n总测试数: ${results.length}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);
  
  console.log('\n详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✓ 通过' : '✗ 失败';
    console.log(`${index + 1}. ${result.scenario}: ${status}`);
    
    if (!result.success && result.errors) {
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.data) {
      console.log(`   成功: ${result.data.results.successCount}/${result.data.testConfig.concurrency}, 耗时: ${result.data.testConfig.duration}`);
    }
  });
  
  console.log('\n' + (failCount === 0 ? '🎉 所有测试通过！' : '⚠️ 存在测试失败'));
  
  return {
    total: results.length,
    passed: passCount,
    failed: failCount,
    results
  };
}

/**
 * 快速测试 - 单次运行
 */
async function quickTest(concurrency = 20, maxStudents = 10) {
  const scenario = {
    name: '快速测试',
    concurrency,
    maxStudents,
    expectedSuccess: maxStudents,
    description: `${concurrency}人抢${maxStudents}个名额`
  };
  
  return await runTestScenario(scenario);
}

// 导出测试函数
module.exports = {
  runAllTests,
  runTestScenario,
  quickTest,
  TEST_SCENARIOS
};

// 如果直接运行此脚本
if (require.main === module) {
  console.log('⚠️ 此测试需要在微信小程序环境中运行');
  console.log('请打开微信开发者工具，访问: pages/test/concurrent/concurrent');
  console.log('或者在云函数中导入此模块并执行测试');
}
