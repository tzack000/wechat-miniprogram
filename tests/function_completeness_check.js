/**
 * 课程预约功能完整性检查
 * 
 * 检查所有必需的文件和配置是否存在
 */

const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║      课程预约功能完整性检查                       ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const checks = [];

// 辅助函数：检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

// 辅助函数：检查目录是否存在
function dirExists(dirPath) {
  return fs.existsSync(path.join(__dirname, '..', dirPath));
}

// 1. 检查云函数
console.log('========== 1. 云函数检查 ==========');

const cloudFunctions = [
  { name: 'coach', path: 'cloudfunctions/coach/index.js' },
  { name: 'coach package', path: 'cloudfunctions/coach/package.json' },
  { name: 'course', path: 'cloudfunctions/course/index.js' },
  { name: 'course package', path: 'cloudfunctions/course/package.json' }
];

cloudFunctions.forEach(func => {
  const exists = fileExists(func.path);
  console.log(`${exists ? '✓' : '✗'} ${func.name}: ${func.path}`);
  checks.push({ category: '云函数', name: func.name, passed: exists });
});

console.log('');

// 2. 检查教练页面
console.log('========== 2. 教练模块页面 ==========');

const coachPages = [
  { name: '教练列表 WXML', path: 'miniprogram/pages/coach/list/list.wxml' },
  { name: '教练列表 JS', path: 'miniprogram/pages/coach/list/list.js' },
  { name: '教练列表 WXSS', path: 'miniprogram/pages/coach/list/list.wxss' },
  { name: '教练列表 JSON', path: 'miniprogram/pages/coach/list/list.json' },
  { name: '教练详情 WXML', path: 'miniprogram/pages/coach/detail/detail.wxml' },
  { name: '教练详情 JS', path: 'miniprogram/pages/coach/detail/detail.js' },
  { name: '教练详情 WXSS', path: 'miniprogram/pages/coach/detail/detail.wxss' },
  { name: '教练详情 JSON', path: 'miniprogram/pages/coach/detail/detail.json' }
];

coachPages.forEach(page => {
  const exists = fileExists(page.path);
  console.log(`${exists ? '✓' : '✗'} ${page.name}`);
  checks.push({ category: '教练页面', name: page.name, passed: exists });
});

console.log('');

// 3. 检查课程页面
console.log('========== 3. 课程模块页面 ==========');

const coursePages = [
  { name: '课程列表 WXML', path: 'miniprogram/pages/course/list/list.wxml' },
  { name: '课程列表 JS', path: 'miniprogram/pages/course/list/list.js' },
  { name: '课程详情 WXML', path: 'miniprogram/pages/course/detail/detail.wxml' },
  { name: '课程详情 JS', path: 'miniprogram/pages/course/detail/detail.js' },
  { name: '课程预约 WXML', path: 'miniprogram/pages/course/booking/booking.wxml' },
  { name: '课程预约 JS', path: 'miniprogram/pages/course/booking/booking.js' }
];

coursePages.forEach(page => {
  const exists = fileExists(page.path);
  console.log(`${exists ? '✓' : '✗'} ${page.name}`);
  checks.push({ category: '课程页面', name: page.name, passed: exists });
});

console.log('');

// 4. 检查用户课程页面
console.log('========== 4. 用户课程管理 ==========');

const userPages = [
  { name: '我的课程 WXML', path: 'miniprogram/pages/user/courses/courses.wxml' },
  { name: '我的课程 JS', path: 'miniprogram/pages/user/courses/courses.js' }
];

userPages.forEach(page => {
  const exists = fileExists(page.path);
  console.log(`${exists ? '✓' : '✗'} ${page.name}`);
  checks.push({ category: '用户页面', name: page.name, passed: exists });
});

console.log('');

// 5. 检查测试数据
console.log('========== 5. 测试数据 ==========');

const testData = [
  { name: '教练测试数据', path: 'database/test_data/coaches.json' },
  { name: '课程测试数据', path: 'database/test_data/courses.json' }
];

testData.forEach(data => {
  const exists = fileExists(data.path);
  console.log(`${exists ? '✓' : '✗'} ${data.name}`);
  checks.push({ category: '测试数据', name: data.name, passed: exists });
});

console.log('');

// 6. 检查 app.json 配置
console.log('========== 6. 配置文件检查 ==========');

try {
  const appJsonPath = path.join(__dirname, '..', 'miniprogram/app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const requiredPages = [
    'pages/coach/list/list',
    'pages/coach/detail/detail',
    'pages/course/list/list',
    'pages/course/detail/detail',
    'pages/course/booking/booking',
    'pages/user/courses/courses'
  ];
  
  requiredPages.forEach(page => {
    const exists = appJson.pages.includes(page);
    console.log(`${exists ? '✓' : '✗'} ${page} 已注册`);
    checks.push({ category: 'app.json', name: page, passed: exists });
  });
} catch (error) {
  console.log(`✗ 无法读取 app.json: ${error.message}`);
  checks.push({ category: 'app.json', name: 'app.json', passed: false });
}

console.log('');

// 7. 检查首页和用户中心入口
console.log('========== 7. 入口检查 ==========');

try {
  const indexJsPath = path.join(__dirname, '..', 'miniprogram/pages/index/index.js');
  const indexJs = fs.readFileSync(indexJsPath, 'utf8');
  const hasCourseLinkInIndex = indexJs.includes('/pages/course/list/list');
  
  console.log(`${hasCourseLinkInIndex ? '✓' : '✗'} 首页包含课程入口`);
  checks.push({ category: '入口', name: '首页课程入口', passed: hasCourseLinkInIndex });
  
  const centerJsPath = path.join(__dirname, '..', 'miniprogram/pages/user/center/center.js');
  const centerJs = fs.readFileSync(centerJsPath, 'utf8');
  const hasCoursesLinkInCenter = centerJs.includes('/pages/user/courses/courses');
  
  console.log(`${hasCoursesLinkInCenter ? '✓' : '✗'} 个人中心包含我的课程入口`);
  checks.push({ category: '入口', name: '个人中心课程入口', passed: hasCoursesLinkInCenter });
} catch (error) {
  console.log(`✗ 检查入口时出错: ${error.message}`);
}

console.log('');

// 统计结果
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║                   检查总结                        ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.passed).length;
const failedChecks = totalChecks - passedChecks;
const passRate = (passedChecks / totalChecks * 100).toFixed(1);

console.log(`总检查项: ${totalChecks}`);
console.log(`通过: ${passedChecks}`);
console.log(`失败: ${failedChecks}`);
console.log(`完整度: ${passRate}%\n`);

// 按类别统计
const categories = {};
checks.forEach(check => {
  if (!categories[check.category]) {
    categories[check.category] = { total: 0, passed: 0 };
  }
  categories[check.category].total++;
  if (check.passed) categories[check.category].passed++;
});

console.log('分类统计:');
console.log('─'.repeat(60));
Object.entries(categories).forEach(([category, stats]) => {
  const rate = (stats.passed / stats.total * 100).toFixed(0);
  const status = stats.passed === stats.total ? '✓' : '⚠';
  console.log(`${status} ${category.padEnd(15)} ${stats.passed}/${stats.total} (${rate}%)`);
});
console.log('─'.repeat(60));

// 失败项详情
if (failedChecks > 0) {
  console.log('\n失败项详情:');
  checks.filter(c => !c.passed).forEach(check => {
    console.log(`  ✗ [${check.category}] ${check.name}`);
  });
}

console.log('');

if (failedChecks === 0) {
  console.log('🎉 所有检查通过！功能完整。');
} else {
  console.log(`⚠️ 发现 ${failedChecks} 项缺失，请补充。`);
}

console.log('');

process.exit(failedChecks > 0 ? 1 : 0);
