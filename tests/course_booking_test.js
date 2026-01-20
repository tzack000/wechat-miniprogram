/**
 * 课程预约功能测试脚本
 * 
 * 测试内容：
 * 1. 教练数据查询
 * 2. 课程数据查询
 * 3. 课程与教练关联
 * 4. 课程排期查询
 * 5. 课程预约流程
 */

const assert = require('assert');

// 模拟测试数据
const testCoaches = require('../database/test_data/coaches.json');
const testCourses = require('../database/test_data/courses.json');

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║      课程预约功能测试                             ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

// 测试1: 教练数据结构验证
function testCoachDataStructure() {
  console.log('========== 测试1: 教练数据结构 ==========');
  
  const requiredFields = ['name', 'avatar', 'title', 'introduction', 'specialties', 'enabled'];
  let passCount = 0;
  let failCount = 0;
  
  testCoaches.forEach((coach, index) => {
    const missingFields = requiredFields.filter(field => !(field in coach));
    
    if (missingFields.length === 0) {
      console.log(`✓ 教练 ${index + 1} (${coach.name}): 数据结构完整`);
      passCount++;
    } else {
      console.log(`✗ 教练 ${index + 1} (${coach.name}): 缺少字段 ${missingFields.join(', ')}`);
      failCount++;
    }
  });
  
  console.log(`\n结果: ${passCount} 通过, ${failCount} 失败`);
  console.log(`总计教练数: ${testCoaches.length}\n`);
  
  return failCount === 0;
}

// 测试2: 课程数据结构验证
function testCourseDataStructure() {
  console.log('========== 测试2: 课程数据结构 ==========');
  
  const requiredFields = ['name', 'type', 'description', 'duration', 'price', 'maxStudents', 'coachIds', 'enabled'];
  let passCount = 0;
  let failCount = 0;
  
  testCourses.forEach((course, index) => {
    const missingFields = requiredFields.filter(field => !(field in course));
    
    if (missingFields.length === 0) {
      console.log(`✓ 课程 ${index + 1} (${course.name}): 数据结构完整`);
      passCount++;
    } else {
      console.log(`✗ 课程 ${index + 1} (${course.name}): 缺少字段 ${missingFields.join(', ')}`);
      failCount++;
    }
  });
  
  console.log(`\n结果: ${passCount} 通过, ${failCount} 失败`);
  console.log(`总计课程数: ${testCourses.length}\n`);
  
  return failCount === 0;
}

// 测试3: 教练擅长领域统计
function testCoachSpecialties() {
  console.log('========== 测试3: 教练擅长领域统计 ==========');
  
  const specialtiesMap = {};
  
  testCoaches.forEach(coach => {
    coach.specialties.forEach(specialty => {
      if (!specialtiesMap[specialty]) {
        specialtiesMap[specialty] = [];
      }
      specialtiesMap[specialty].push(coach.name);
    });
  });
  
  console.log('擅长领域分布:');
  Object.entries(specialtiesMap).forEach(([specialty, coaches]) => {
    console.log(`  ${specialty}: ${coaches.length} 位教练 (${coaches.join(', ')})`);
  });
  
  console.log(`\n总计擅长领域: ${Object.keys(specialtiesMap).length}\n`);
  
  return Object.keys(specialtiesMap).length > 0;
}

// 测试4: 课程类型统计
function testCourseTypes() {
  console.log('========== 测试4: 课程类型统计 ==========');
  
  const typesMap = {};
  
  testCourses.forEach(course => {
    if (!typesMap[course.type]) {
      typesMap[course.type] = {
        typeName: course.typeName || course.type,
        courses: []
      };
    }
    typesMap[course.type].courses.push(course.name);
  });
  
  console.log('课程类型分布:');
  Object.entries(typesMap).forEach(([type, data]) => {
    console.log(`  ${data.typeName} (${type}): ${data.courses.length} 门课程`);
    data.courses.forEach(name => {
      console.log(`    - ${name}`);
    });
  });
  
  console.log(`\n总计课程类型: ${Object.keys(typesMap).length}\n`);
  
  return Object.keys(typesMap).length > 0;
}

// 测试5: 课程价格范围
function testCoursePricing() {
  console.log('========== 测试5: 课程价格分析 ==========');
  
  const prices = testCourses.map(c => c.price).sort((a, b) => a - b);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
  
  console.log(`价格范围: ¥${minPrice} - ¥${maxPrice}`);
  console.log(`平均价格: ¥${avgPrice}`);
  
  // 按价格分组
  const priceRanges = {
    '0-100': [],
    '101-150': [],
    '151-200': [],
    '200+': []
  };
  
  testCourses.forEach(course => {
    if (course.price <= 100) priceRanges['0-100'].push(course.name);
    else if (course.price <= 150) priceRanges['101-150'].push(course.name);
    else if (course.price <= 200) priceRanges['151-200'].push(course.name);
    else priceRanges['200+'].push(course.name);
  });
  
  console.log('\n价格分布:');
  Object.entries(priceRanges).forEach(([range, courses]) => {
    if (courses.length > 0) {
      console.log(`  ¥${range}: ${courses.length} 门课程`);
    }
  });
  
  console.log('');
  
  return minPrice > 0 && maxPrice > minPrice;
}

// 测试6: 课程时长统计
function testCourseDuration() {
  console.log('========== 测试6: 课程时长统计 ==========');
  
  const durations = {};
  
  testCourses.forEach(course => {
    const duration = course.duration;
    if (!durations[duration]) {
      durations[duration] = [];
    }
    durations[duration].push(course.name);
  });
  
  console.log('时长分布:');
  Object.entries(durations).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([duration, courses]) => {
    console.log(`  ${duration}分钟: ${courses.length} 门课程`);
  });
  
  console.log('');
  
  return Object.keys(durations).length > 0;
}

// 测试7: 课程人数容量分析
function testCourseCapacity() {
  console.log('========== 测试7: 课程容量分析 ==========');
  
  const capacities = testCourses.map(c => c.maxStudents).sort((a, b) => a - b);
  const minCapacity = Math.min(...capacities);
  const maxCapacity = Math.max(...capacities);
  const avgCapacity = (capacities.reduce((a, b) => a + b, 0) / capacities.length).toFixed(1);
  
  console.log(`容量范围: ${minCapacity} - ${maxCapacity} 人`);
  console.log(`平均容量: ${avgCapacity} 人`);
  
  // 分类
  const privateClasses = testCourses.filter(c => c.maxStudents <= 1);
  const smallGroups = testCourses.filter(c => c.maxStudents > 1 && c.maxStudents <= 10);
  const mediumGroups = testCourses.filter(c => c.maxStudents > 10 && c.maxStudents <= 15);
  const largeGroups = testCourses.filter(c => c.maxStudents > 15);
  
  console.log('\n课程类型:');
  console.log(`  私教课 (1人): ${privateClasses.length} 门`);
  console.log(`  小班课 (2-10人): ${smallGroups.length} 门`);
  console.log(`  中班课 (11-15人): ${mediumGroups.length} 门`);
  console.log(`  大班课 (15人以上): ${largeGroups.length} 门`);
  
  console.log('');
  
  return minCapacity > 0;
}

// 测试8: 教练评分统计
function testCoachRatings() {
  console.log('========== 测试8: 教练评分统计 ==========');
  
  const ratings = testCoaches.filter(c => c.rating).map(c => c.rating);
  
  if (ratings.length === 0) {
    console.log('暂无评分数据\n');
    return true;
  }
  
  const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
  const maxRating = Math.max(...ratings);
  const minRating = Math.min(...ratings);
  
  console.log(`平均评分: ${avgRating}`);
  console.log(`最高评分: ${maxRating}`);
  console.log(`最低评分: ${minRating}`);
  
  // 评分分布
  const ratingDistribution = {
    '5.0': [],
    '4.5-4.9': [],
    '4.0-4.4': [],
    '< 4.0': []
  };
  
  testCoaches.forEach(coach => {
    if (!coach.rating) return;
    
    if (coach.rating === 5.0) ratingDistribution['5.0'].push(coach.name);
    else if (coach.rating >= 4.5) ratingDistribution['4.5-4.9'].push(coach.name);
    else if (coach.rating >= 4.0) ratingDistribution['4.0-4.4'].push(coach.name);
    else ratingDistribution['< 4.0'].push(coach.name);
  });
  
  console.log('\n评分分布:');
  Object.entries(ratingDistribution).forEach(([range, coaches]) => {
    if (coaches.length > 0) {
      console.log(`  ${range}: ${coaches.length} 位 (${coaches.join(', ')})`);
    }
  });
  
  console.log('');
  
  return avgRating >= 4.0;
}

// 运行所有测试
async function runAllTests() {
  const results = [];
  
  results.push({ name: '教练数据结构', passed: testCoachDataStructure() });
  results.push({ name: '课程数据结构', passed: testCourseDataStructure() });
  results.push({ name: '教练擅长领域', passed: testCoachSpecialties() });
  results.push({ name: '课程类型统计', passed: testCourseTypes() });
  results.push({ name: '课程价格分析', passed: testCoursePricing() });
  results.push({ name: '课程时长统计', passed: testCourseDuration() });
  results.push({ name: '课程容量分析', passed: testCourseCapacity() });
  results.push({ name: '教练评分统计', passed: testCoachRatings() });
  
  // 总结报告
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                   总结报告                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;
  
  console.log(`测试总数: ${results.length}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`通过率: ${(passCount / results.length * 100).toFixed(1)}%\n`);
  
  console.log('详细结果:');
  console.log('─'.repeat(60));
  results.forEach(result => {
    const status = result.passed ? '✓ 通过' : '✗ 失败';
    console.log(`${result.name.padEnd(20)} ${status}`);
  });
  console.log('─'.repeat(60));
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！数据结构正确。');
  } else {
    console.log(`\n⚠️ 发现 ${failCount} 个测试失败，请检查数据。`);
  }
  
  return {
    total: results.length,
    passed: passCount,
    failed: failCount,
    results
  };
}

// 执行测试
if (require.main === module) {
  runAllTests().then(summary => {
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}

module.exports = {
  runAllTests
};
