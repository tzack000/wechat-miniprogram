#!/usr/bin/env node

/**
 * CI/CD 测试运行器
 * 
 * 支持多种输出格式，适用于自动化测试流程
 * 
 * 用法:
 *   node tests/ci_test_runner.js [options]
 * 
 * 选项:
 *   --format <type>    输出格式: console, json, junit, markdown (默认: console)
 *   --output <file>    输出文件路径 (默认: stdout)
 *   --scenario <name>  运行特定测试场景
 *   --verbose          显示详细输出
 *   --quiet            只显示结果，不显示过程
 */

const fs = require('fs');
const path = require('path');
const { runAllTests, runConcurrentTest, TEST_SCENARIOS } = require('./simulate_concurrent_test');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    format: 'console',
    output: null,
    scenario: null,
    verbose: false,
    quiet: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
        options.format = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--scenario':
        options.scenario = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }
  
  return options;
}

// 显示帮助信息
function showHelp() {
  console.log(`
CI/CD 测试运行器

用法:
  node tests/ci_test_runner.js [options]

选项:
  --format <type>    输出格式: console, json, junit, markdown
  --output <file>    输出文件路径
  --scenario <name>  运行特定测试场景
  --verbose          显示详细输出
  --quiet            只显示结果
  --help, -h         显示此帮助信息

示例:
  # 控制台输出
  node tests/ci_test_runner.js
  
  # JSON格式输出到文件
  node tests/ci_test_runner.js --format json --output test-results.json
  
  # JUnit格式（用于CI工具）
  node tests/ci_test_runner.js --format junit --output test-results.xml
  
  # Markdown报告
  node tests/ci_test_runner.js --format markdown --output TEST_REPORT.md
  
  # 运行特定场景
  node tests/ci_test_runner.js --scenario "高并发"
`);
}

// 重定向控制台输出
class OutputCapture {
  constructor(quiet = false) {
    this.quiet = quiet;
    this.logs = [];
    this.originalLog = console.log;
    this.originalError = console.error;
    
    if (quiet) {
      console.log = (...args) => {
        this.logs.push({ level: 'log', message: args.join(' ') });
      };
      console.error = (...args) => {
        this.logs.push({ level: 'error', message: args.join(' ') });
      };
    }
  }
  
  restore() {
    if (this.quiet) {
      console.log = this.originalLog;
      console.error = this.originalError;
    }
  }
  
  getLogs() {
    return this.logs;
  }
}

// 格式化输出
class OutputFormatter {
  static console(results) {
    // 默认的控制台输出（已在测试中打印）
    return '';
  }
  
  static json(results) {
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        passRate: (results.passed / results.total * 100).toFixed(1) + '%'
      },
      tests: results.results.map(r => ({
        name: r.name,
        scenario: `${r.concurrency}人抢${r.maxStudents}个名额`,
        success: r.success,
        duration: r.duration,
        results: r.results,
        finalState: r.finalState,
        validation: r.validation
      }))
    };
    
    return JSON.stringify(output, null, 2);
  }
  
  static junit(results) {
    const timestamp = new Date().toISOString();
    const totalDuration = results.results.reduce((sum, r) => sum + r.duration, 0);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="Concurrent Booking Tests" tests="${results.total}" failures="${results.failed}" time="${totalDuration / 1000}">\n`;
    xml += `  <testsuite name="ConcurrentBookingTest" tests="${results.total}" failures="${results.failed}" time="${totalDuration / 1000}" timestamp="${timestamp}">\n`;
    
    results.results.forEach(test => {
      xml += `    <testcase name="${test.name}" classname="ConcurrentBookingTest" time="${test.duration / 1000}">\n`;
      
      if (!test.success) {
        xml += `      <failure message="Test failed">\n`;
        xml += `        Validation: ${JSON.stringify(test.validation)}\n`;
        xml += `        Final State: ${JSON.stringify(test.finalState)}\n`;
        xml += `      </failure>\n`;
      }
      
      xml += `      <system-out>\n`;
      xml += `        Concurrency: ${test.concurrency}\n`;
      xml += `        Max Students: ${test.maxStudents}\n`;
      xml += `        Success Count: ${test.results.successCount}\n`;
      xml += `        Duration: ${test.duration}ms\n`;
      xml += `      </system-out>\n`;
      xml += `    </testcase>\n`;
    });
    
    xml += '  </testsuite>\n';
    xml += '</testsuites>\n';
    
    return xml;
  }
  
  static markdown(results) {
    const timestamp = new Date().toLocaleString();
    
    let md = '# 并发预约测试报告\n\n';
    md += `**生成时间**: ${timestamp}\n\n`;
    
    // 总结
    md += '## 测试总结\n\n';
    md += '```\n';
    md += `总测试数: ${results.total}\n`;
    md += `通过: ${results.passed}\n`;
    md += `失败: ${results.failed}\n`;
    md += `通过率: ${(results.passed / results.total * 100).toFixed(1)}%\n`;
    md += '```\n\n';
    
    // 状态图标
    const status = results.failed === 0 ? '✅ 所有测试通过' : `⚠️ ${results.failed} 个测试失败`;
    md += `### ${status}\n\n`;
    
    // 详细结果表格
    md += '## 测试详情\n\n';
    md += '| 测试场景 | 并发数 | 名额 | 成功数 | 耗时 | 结果 |\n';
    md += '|---------|--------|------|--------|------|------|\n';
    
    results.results.forEach(test => {
      const statusIcon = test.success ? '✅' : '❌';
      md += `| ${test.name} | ${test.concurrency} | ${test.maxStudents} | ${test.results.successCount} | ${test.duration}ms | ${statusIcon} |\n`;
    });
    
    md += '\n';
    
    // 验证点
    md += '## 验证点\n\n';
    
    results.results.forEach((test, index) => {
      md += `### ${index + 1}. ${test.name}\n\n`;
      md += `- **场景**: ${test.concurrency}人抢${test.maxStudents}个名额\n`;
      md += `- **执行时间**: ${test.duration}ms\n`;
      md += `- **成功率**: ${(test.results.successCount / test.concurrency * 100).toFixed(1)}%\n\n`;
      
      md += '**验证结果**:\n\n';
      md += `- ${test.validation.noOverbooking ? '✅' : '❌'} 无超额预约 (${test.finalState.bookedCount}/${test.maxStudents})\n`;
      md += `- ${test.validation.dataConsistent ? '✅' : '❌'} 数据一致性 (${test.finalState.bookedCount} = ${test.finalState.actualBookings})\n`;
      md += `- ${test.validation.correctSuccessCount ? '✅' : '❌'} 成功数准确 (${test.results.successCount} = ${test.finalState.actualBookings})\n\n`;
      
      if (!test.success) {
        md += '**失败原因**:\n\n';
        if (!test.validation.noOverbooking) {
          md += `- ⚠️ 超额预约：实际${test.finalState.actualBookings}人，限制${test.maxStudents}人\n`;
        }
        if (!test.validation.dataConsistent) {
          md += `- ⚠️ 数据不一致：排期显示${test.finalState.bookedCount}人，实际${test.finalState.actualBookings}条记录\n`;
        }
        if (!test.validation.correctSuccessCount) {
          md += `- ⚠️ 统计错误：成功${test.results.successCount}次，记录${test.finalState.actualBookings}条\n`;
        }
        md += '\n';
      }
    });
    
    // 性能分析
    md += '## 性能分析\n\n';
    md += '| 并发数 | 总耗时 | 平均响应 |\n';
    md += '|--------|--------|----------|\n';
    
    results.results.forEach(test => {
      const avgTime = (test.duration / test.concurrency).toFixed(2);
      md += `| ${test.concurrency} | ${test.duration}ms | ${avgTime}ms |\n`;
    });
    
    md += '\n';
    
    // 结论
    md += '## 结论\n\n';
    if (results.failed === 0) {
      md += '🎉 **所有测试通过！** 并发控制机制工作正常，能够准确控制名额，无超额预约现象。\n\n';
      md += '系统在高并发场景下表现稳定，数据一致性良好。\n';
    } else {
      md += `⚠️ **发现 ${results.failed} 个测试失败**，请检查并发控制逻辑。\n\n`;
      md += '建议：\n';
      md += '1. 检查数据库事务配置\n';
      md += '2. 验证名额检查逻辑\n';
      md += '3. 确认锁机制是否正常工作\n';
    }
    
    md += '\n---\n\n';
    md += '*由 CI/CD 自动生成*\n';
    
    return md;
  }
}

// 主函数
async function main() {
  const options = parseArgs();
  const startTime = Date.now();
  
  console.log('🚀 开始运行并发预约测试...\n');
  
  // 捕获输出
  const capture = new OutputCapture(options.quiet);
  
  let results;
  try {
    if (options.scenario) {
      // 运行特定场景
      const scenario = TEST_SCENARIOS.find(s => s.name === options.scenario);
      if (!scenario) {
        console.error(`错误: 未找到测试场景 "${options.scenario}"`);
        console.error(`可用场景: ${TEST_SCENARIOS.map(s => s.name).join(', ')}`);
        process.exit(1);
      }
      
      console.log(`运行场景: ${scenario.name}\n`);
      const result = await runConcurrentTest(scenario.concurrency, scenario.maxStudents);
      
      results = {
        total: 1,
        passed: result.success ? 1 : 0,
        failed: result.success ? 0 : 1,
        results: [{
          ...scenario,
          ...result
        }]
      };
    } else {
      // 运行所有测试
      results = await runAllTests();
    }
  } finally {
    capture.restore();
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // 生成输出
  let output;
  try {
    switch (options.format) {
      case 'json':
        output = OutputFormatter.json(results);
        break;
      case 'junit':
        output = OutputFormatter.junit(results);
        break;
      case 'markdown':
        output = OutputFormatter.markdown(results);
        break;
      case 'console':
      default:
        output = OutputFormatter.console(results);
        break;
    }
    
    // 输出结果
    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(`\n📝 测试报告已保存到: ${options.output}`);
    } else if (output) {
      console.log(output);
    }
    
    // 显示摘要
    if (!options.quiet) {
      console.log('\n' + '='.repeat(60));
      console.log('测试摘要');
      console.log('='.repeat(60));
      console.log(`总耗时: ${totalDuration}ms`);
      console.log(`测试数: ${results.total}`);
      console.log(`通过: ${results.passed}`);
      console.log(`失败: ${results.failed}`);
      console.log(`通过率: ${(results.passed / results.total * 100).toFixed(1)}%`);
      console.log('='.repeat(60));
    }
    
    // 返回退出码
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('生成测试报告失败:', error.message);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { main, OutputFormatter };
