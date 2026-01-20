#!/usr/bin/env node
/**
 * 快速检查图片和数据配置
 * 在微信开发者工具测试前运行此脚本
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}`);
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          微信开发者工具图片显示快速检查                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(colors.reset);

const projectRoot = path.resolve(__dirname, '..');

// 检查1：图片文件存在性
console.log(`\n${colors.cyan}【检查1】图片文件存在性${colors.reset}`);

const venueImages = [
  'basketball_1.jpg', 'basketball_2.jpg',
  'badminton_1.jpg', 'badminton_2.jpg',
  'swimming_1.jpg', 'table_tennis_1.jpg',
  'gym_1.jpg', 'tennis_1.jpg',
  'yoga_1.jpg', 'football_1.jpg'
];

const courseImages = [
  'yoga_1.jpg', 'yoga_2.jpg',
  'swimming_1.jpg', 'swimming_2.jpg',
  'basketball_1.jpg', 'basketball_2.jpg',
  'fitness_1.jpg', 'fitness_2.jpg',
  'dance_1.jpg', 'dance_2.jpg'
];

let allImagesExist = true;

console.log('\n场馆图片:');
venueImages.forEach(img => {
  const imgPath = path.join(projectRoot, 'miniprogram/images/venues', img);
  const exists = fs.existsSync(imgPath);
  console.log(`  ${exists ? '✓' : '✗'} ${img}`);
  if (!exists) allImagesExist = false;
});

console.log('\n课程图片:');
courseImages.forEach(img => {
  const imgPath = path.join(projectRoot, 'miniprogram/images/courses', img);
  const exists = fs.existsSync(imgPath);
  console.log(`  ${exists ? '✓' : '✗'} ${img}`);
  if (!exists) allImagesExist = false;
});

// 检查2：数据配置
console.log(`\n${colors.cyan}【检查2】数据文件配置${colors.reset}`);

// 检查场馆数据
const venuesPath = path.join(projectRoot, 'database/test_data/venues.json');
const venuesContent = fs.readFileSync(venuesPath, 'utf8');
const venuesLines = venuesContent.split('\n').filter(l => l.trim());

console.log(`\n场馆数据 (${venuesLines.length}个):`);
let venuesWithImages = 0;
venuesLines.forEach(line => {
  try {
    const venue = JSON.parse(line);
    const hasImage = venue.images && venue.images.length > 0;
    if (hasImage) venuesWithImages++;
    console.log(`  ${hasImage ? '✓' : '✗'} ${venue.name}: ${hasImage ? venue.images[0] : '无图片'}`);
  } catch (e) {}
});

// 检查课程数据
const coursesPath = path.join(projectRoot, 'database/test_data/courses.json');
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

console.log(`\n课程数据 (${courses.length}个):`);
let coursesWithImages = 0;
courses.forEach(course => {
  const hasImage = course.images && course.images.length > 0;
  if (hasImage) coursesWithImages++;
  console.log(`  ${hasImage ? '✓' : '✗'} ${course.name}: ${hasImage ? course.images[0] : '无图片'}`);
});

// 检查3：页面配置
console.log(`\n${colors.cyan}【检查3】页面图片显示配置${colors.reset}`);

const venueListWxml = path.join(projectRoot, 'miniprogram/pages/venue/list/list.wxml');
const courseListWxml = path.join(projectRoot, 'miniprogram/pages/course/list/list.wxml');

const venueWxmlContent = fs.readFileSync(venueListWxml, 'utf8');
const courseWxmlContent = fs.readFileSync(courseListWxml, 'utf8');

const venueHasImage = venueWxmlContent.includes('item.images[0]');
const courseHasImage = courseWxmlContent.includes('item.images[0]');

console.log(`\n场馆列表页面:`);
console.log(`  ${venueHasImage ? '✓' : '✗'} 已配置图片显示: {{item.images[0]}}`);

console.log(`\n课程列表页面:`);
console.log(`  ${courseHasImage ? '✓' : '✗'} 已配置图片显示: {{item.images[0]}}`);

// 总结
console.log(`\n${colors.cyan}【检查总结】${colors.reset}`);
console.log(`\n图片文件: ${allImagesExist ? colors.green + '✓ 全部存在' : colors.red + '✗ 部分缺失'}${colors.reset}`);
console.log(`场馆配图: ${venuesWithImages === venuesLines.length ? colors.green + '✓' : colors.yellow + '⚠'} ${venuesWithImages}/${venuesLines.length}${colors.reset}`);
console.log(`课程配图: ${coursesWithImages === courses.length ? colors.green + '✓' : colors.yellow + '⚠'} ${coursesWithImages}/${courses.length}${colors.reset}`);
console.log(`页面配置: ${venueHasImage && courseHasImage ? colors.green + '✓ 配置正确' : colors.red + '✗ 需要配置'}${colors.reset}`);

// 最终建议
console.log(`\n${colors.cyan}【测试建议】${colors.reset}\n`);

if (allImagesExist && venuesWithImages === venuesLines.length && 
    coursesWithImages === courses.length && venueHasImage && courseHasImage) {
  console.log(`${colors.green}✅ 所有配置正确！可以在微信开发者工具中测试图片显示效果。${colors.reset}\n`);
  console.log('测试步骤:');
  console.log('1. 在微信开发者工具中点击"编译"');
  console.log('2. 导入测试数据（使用云函数或手动导入）');
  console.log('3. 访问"场馆预约"查看场馆图片');
  console.log('4. 访问"课程预约"查看课程图片');
  console.log('5. 检查图片是否清晰、颜色是否正确\n');
} else {
  console.log(`${colors.yellow}⚠️ 发现配置问题，请先修复后再测试。${colors.reset}\n`);
  
  if (!allImagesExist) {
    console.log('- 部分图片文件缺失，请检查 miniprogram/images/ 目录');
  }
  if (venuesWithImages < venuesLines.length) {
    console.log(`- ${venuesLines.length - venuesWithImages}个场馆未配置图片`);
  }
  if (coursesWithImages < courses.length) {
    console.log(`- ${courses.length - coursesWithImages}个课程未配置图片`);
  }
  if (!venueHasImage || !courseHasImage) {
    console.log('- 页面模板未配置图片显示');
  }
  console.log();
}

// 参考文档
console.log(`${colors.cyan}【参考文档】${colors.reset}`);
console.log('- WECHAT_IMAGE_DISPLAY_TEST_GUIDE.md - 完整测试指南');
console.log('- IMAGE_ADDITION_SUMMARY.md - 图片添加总结');
console.log('- tests/venue_course_images_test.js - 详细测试脚本\n');

process.exit(allImagesExist && 
  venuesWithImages === venuesLines.length && 
  coursesWithImages === courses.length &&
  venueHasImage && courseHasImage ? 0 : 1);
