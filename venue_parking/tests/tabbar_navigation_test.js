#!/usr/bin/env node
/**
 * 小程序底部导航栏功能测试
 * 测试内容：
 * 1. tabBar配置正确性
 * 2. 所有tab页面文件存在性
 * 3. 图标文件完整性
 * 4. 配置规范性检查
 */

const fs = require('fs');
const path = require('path');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class TabBarTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.appJsonPath = path.join(this.projectRoot, 'miniprogram/app.json');
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
      warning: '⚠'
    };
    const colorMap = {
      success: colors.green,
      error: colors.red,
      info: colors.blue,
      warning: colors.yellow
    };
    console.log(`${colorMap[type]}${icons[type]} ${message}${colors.reset}`);
  }

  addResult(category, item, passed, message = '') {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    this.testResults.details.push({ category, item, passed, message });
  }

  // 测试1：读取并验证app.json配置
  testAppJsonConfig() {
    this.log('\n=== 测试1: 验证 app.json 配置 ===', 'info');
    
    try {
      if (!fs.existsSync(this.appJsonPath)) {
        this.addResult('配置文件', 'app.json存在性', false, '文件不存在');
        this.log('app.json 文件不存在', 'error');
        return null;
      }
      this.addResult('配置文件', 'app.json存在性', true);
      this.log('app.json 文件存在', 'success');

      const appJsonContent = fs.readFileSync(this.appJsonPath, 'utf8');
      const appJson = JSON.parse(appJsonContent);
      this.addResult('配置文件', 'JSON格式正确', true);
      this.log('JSON 格式正确', 'success');

      if (!appJson.tabBar) {
        this.addResult('tabBar配置', 'tabBar字段存在', false, 'tabBar配置缺失');
        this.log('tabBar 配置缺失', 'error');
        return null;
      }
      this.addResult('tabBar配置', 'tabBar字段存在', true);
      this.log('tabBar 配置存在', 'success');

      return appJson.tabBar;
    } catch (error) {
      this.addResult('配置文件', 'JSON解析', false, error.message);
      this.log(`解析 app.json 失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 测试2：验证tabBar基本配置
  testTabBarBasicConfig(tabBar) {
    this.log('\n=== 测试2: 验证 tabBar 基本配置 ===', 'info');

    // 检查必需字段
    const requiredFields = ['color', 'selectedColor', 'backgroundColor', 'list'];
    requiredFields.forEach(field => {
      const exists = tabBar.hasOwnProperty(field);
      this.addResult('tabBar基本配置', `${field}字段`, exists, exists ? '' : '字段缺失');
      this.log(`${field}: ${exists ? tabBar[field] : '缺失'}`, exists ? 'success' : 'error');
    });

    // 检查list数组
    if (!Array.isArray(tabBar.list)) {
      this.addResult('tabBar基本配置', 'list是数组', false, 'list不是数组');
      this.log('list 不是数组', 'error');
      return [];
    }
    this.addResult('tabBar基本配置', 'list是数组', true);
    this.log(`list 是数组，包含 ${tabBar.list.length} 个tab`, 'success');

    // 检查tab数量（微信小程序限制2-5个）
    const tabCount = tabBar.list.length;
    const validCount = tabCount >= 2 && tabCount <= 5;
    this.addResult('tabBar基本配置', 'tab数量合法(2-5个)', validCount, 
      validCount ? '' : `当前${tabCount}个，应该在2-5之间`);
    this.log(`tab 数量: ${tabCount} ${validCount ? '(合法)' : '(不合法，应该在2-5之间)'}`, 
      validCount ? 'success' : 'error');

    return tabBar.list;
  }

  // 测试3：验证每个tab项配置
  testTabItems(tabList) {
    this.log('\n=== 测试3: 验证每个 tab 项配置 ===', 'info');

    tabList.forEach((tab, index) => {
      this.log(`\n--- Tab ${index + 1}: ${tab.text || '(无文字)'} ---`, 'info');

      // 检查必需字段
      const requiredFields = ['pagePath', 'text', 'iconPath', 'selectedIconPath'];
      requiredFields.forEach(field => {
        const exists = tab.hasOwnProperty(field) && tab[field];
        this.addResult(`Tab${index + 1}配置`, field, exists, 
          exists ? tab[field] : '字段缺失或为空');
        this.log(`  ${field}: ${exists ? tab[field] : '缺失'}`, exists ? 'success' : 'error');
      });
    });
  }

  // 测试4：验证页面文件存在性
  testPageFiles(tabList) {
    this.log('\n=== 测试4: 验证页面文件存在性 ===', 'info');

    tabList.forEach((tab, index) => {
      if (!tab.pagePath) return;

      this.log(`\n--- 检查 Tab ${index + 1} 页面文件: ${tab.text} ---`, 'info');
      
      const pageBasePath = path.join(this.projectRoot, 'miniprogram', tab.pagePath);
      const extensions = ['.js', '.json', '.wxml', '.wxss'];
      
      extensions.forEach(ext => {
        const filePath = pageBasePath + ext;
        const exists = fs.existsSync(filePath);
        this.addResult(`页面文件${index + 1}`, `${path.basename(filePath)}`, exists,
          exists ? '存在' : '不存在');
        this.log(`  ${path.basename(filePath)}: ${exists ? '存在' : '不存在'}`, 
          exists ? 'success' : 'error');
      });
    });
  }

  // 测试5：验证图标文件存在性和规格
  testIconFiles(tabList) {
    this.log('\n=== 测试5: 验证图标文件存在性和规格 ===', 'info');

    tabList.forEach((tab, index) => {
      if (!tab.iconPath && !tab.selectedIconPath) return;

      this.log(`\n--- 检查 Tab ${index + 1} 图标: ${tab.text} ---`, 'info');

      // 检查普通图标
      if (tab.iconPath) {
        const iconPath = path.join(this.projectRoot, 'miniprogram', tab.iconPath);
        const exists = fs.existsSync(iconPath);
        this.addResult(`图标文件${index + 1}`, 'iconPath', exists, 
          exists ? '存在' : '不存在');
        this.log(`  ${tab.iconPath}: ${exists ? '存在' : '不存在'}`, 
          exists ? 'success' : 'error');

        if (exists) {
          const stats = fs.statSync(iconPath);
          this.log(`    文件大小: ${(stats.size / 1024).toFixed(2)} KB`, 'info');
          
          // 检查文件大小（建议不超过40KB）
          const sizeOk = stats.size <= 40 * 1024;
          this.addResult(`图标规格${index + 1}`, 'iconPath大小', sizeOk,
            sizeOk ? '合理' : `过大(${(stats.size / 1024).toFixed(2)}KB)`);
          this.log(`    大小检查: ${sizeOk ? '合理' : '建议优化（>40KB）'}`, 
            sizeOk ? 'success' : 'warning');
        }
      }

      // 检查选中图标
      if (tab.selectedIconPath) {
        const selectedIconPath = path.join(this.projectRoot, 'miniprogram', tab.selectedIconPath);
        const exists = fs.existsSync(selectedIconPath);
        this.addResult(`图标文件${index + 1}`, 'selectedIconPath', exists,
          exists ? '存在' : '不存在');
        this.log(`  ${tab.selectedIconPath}: ${exists ? '存在' : '不存在'}`, 
          exists ? 'success' : 'error');

        if (exists) {
          const stats = fs.statSync(selectedIconPath);
          this.log(`    文件大小: ${(stats.size / 1024).toFixed(2)} KB`, 'info');
          
          const sizeOk = stats.size <= 40 * 1024;
          this.addResult(`图标规格${index + 1}`, 'selectedIconPath大小', sizeOk,
            sizeOk ? '合理' : `过大(${(stats.size / 1024).toFixed(2)}KB)`);
          this.log(`    大小检查: ${sizeOk ? '合理' : '建议优化（>40KB）'}`, 
            sizeOk ? 'success' : 'warning');
        }
      }
    });
  }

  // 测试6：验证课程预约tab是否正确添加
  testCourseTab(tabList) {
    this.log('\n=== 测试6: 验证课程预约 tab 配置 ===', 'info');

    const courseTab = tabList.find(tab => tab.text === '课程预约');
    
    if (!courseTab) {
      this.addResult('课程预约tab', '存在性', false, '未找到课程预约tab');
      this.log('未找到"课程预约" tab', 'error');
      return;
    }
    
    this.addResult('课程预约tab', '存在性', true);
    this.log('找到"课程预约" tab', 'success');

    // 验证路径
    const expectedPath = 'pages/course/list/list';
    const pathCorrect = courseTab.pagePath === expectedPath;
    this.addResult('课程预约tab', '页面路径', pathCorrect,
      pathCorrect ? expectedPath : `错误: ${courseTab.pagePath}`);
    this.log(`  页面路径: ${courseTab.pagePath} ${pathCorrect ? '✓' : '✗ 应该是 ' + expectedPath}`,
      pathCorrect ? 'success' : 'error');

    // 验证图标
    const expectedIcon = 'images/tab-course.png';
    const iconCorrect = courseTab.iconPath === expectedIcon;
    this.addResult('课程预约tab', '图标路径', iconCorrect,
      iconCorrect ? expectedIcon : `错误: ${courseTab.iconPath}`);
    this.log(`  图标路径: ${courseTab.iconPath} ${iconCorrect ? '✓' : '✗ 应该是 ' + expectedIcon}`,
      iconCorrect ? 'success' : 'error');

    const expectedSelectedIcon = 'images/tab-course-active.png';
    const selectedIconCorrect = courseTab.selectedIconPath === expectedSelectedIcon;
    this.addResult('课程预约tab', '选中图标路径', selectedIconCorrect,
      selectedIconCorrect ? expectedSelectedIcon : `错误: ${courseTab.selectedIconPath}`);
    this.log(`  选中图标路径: ${courseTab.selectedIconPath} ${selectedIconCorrect ? '✓' : '✗ 应该是 ' + expectedSelectedIcon}`,
      selectedIconCorrect ? 'success' : 'error');

    // 验证顺序（应该在第3位，index=2）
    const courseIndex = tabList.findIndex(tab => tab.text === '课程预约');
    const orderCorrect = courseIndex === 2;
    this.addResult('课程预约tab', '位置顺序', orderCorrect,
      orderCorrect ? '第3位' : `第${courseIndex + 1}位`);
    this.log(`  位置: 第 ${courseIndex + 1} 位 ${orderCorrect ? '✓ (正确)' : '✗ (应该在第3位)'}`,
      orderCorrect ? 'success' : 'warning');
  }

  // 生成测试报告
  generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('测试报告汇总', 'info');
    this.log('='.repeat(60), 'info');

    const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(2);
    
    console.log(`\n${colors.bold}总计测试项: ${this.testResults.total}${colors.reset}`);
    console.log(`${colors.green}${colors.bold}通过: ${this.testResults.passed}${colors.reset}`);
    console.log(`${colors.red}${colors.bold}失败: ${this.testResults.failed}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}通过率: ${passRate}%${colors.reset}\n`);

    if (this.testResults.failed > 0) {
      this.log('失败项详情:', 'error');
      this.testResults.details
        .filter(item => !item.passed)
        .forEach(item => {
          console.log(`  ${colors.red}✗${colors.reset} [${item.category}] ${item.item}: ${item.message}`);
        });
    }

    // 底部导航栏tab列表
    this.log('\n底部导航栏 Tab 列表:', 'info');
    const tabBar = this.testAppJsonConfig();
    if (tabBar && tabBar.list) {
      tabBar.list.forEach((tab, index) => {
        console.log(`  ${index + 1}. ${tab.text} (${tab.pagePath})`);
      });
    }

    // 返回测试状态
    return this.testResults.failed === 0;
  }

  // 运行所有测试
  async runAllTests() {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          小程序底部导航栏功能测试                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    const tabBar = this.testAppJsonConfig();
    if (!tabBar) {
      this.log('\n无法继续测试，app.json配置读取失败', 'error');
      return this.generateReport();
    }

    const tabList = this.testTabBarBasicConfig(tabBar);
    if (tabList.length === 0) {
      this.log('\n无法继续测试，tabBar.list 为空', 'error');
      return this.generateReport();
    }

    this.testTabItems(tabList);
    this.testPageFiles(tabList);
    this.testIconFiles(tabList);
    this.testCourseTab(tabList);

    return this.generateReport();
  }
}

// 主函数
async function main() {
  const tester = new TabBarTester();
  const allPassed = await tester.runAllTests();
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}✓ 所有测试通过！底部导航栏配置正确。${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ 部分测试失败，请检查上述错误。${colors.reset}`);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}测试执行失败:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = TabBarTester;
