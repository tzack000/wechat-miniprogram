#!/usr/bin/env node
/**
 * 场馆和课程图片验证测试
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

class ImageTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
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

  // 测试1：检查场馆数据图片
  testVenueImages() {
    this.log('\n=== 测试1: 场馆图片配置 ===', 'info');
    
    const venuesPath = path.join(this.projectRoot, 'database/test_data/venues.json');
    const content = fs.readFileSync(venuesPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let venuesWithImages = 0;
    let totalVenues = 0;
    
    lines.forEach((line, index) => {
      try {
        const venue = JSON.parse(line);
        totalVenues++;
        
        if (venue.images && venue.images.length > 0) {
          venuesWithImages++;
          
          // 检查图片文件是否存在
          venue.images.forEach(imagePath => {
            const fullPath = path.join(this.projectRoot, 'miniprogram', imagePath);
            const exists = fs.existsSync(fullPath);
            
            this.addResult('场馆图片', `${venue.name}`, exists, 
              exists ? imagePath : `图片不存在: ${imagePath}`);
            
            this.log(`  ${venue.name}: ${exists ? imagePath : '图片缺失'}`, 
              exists ? 'success' : 'error');
            
            if (exists) {
              const stats = fs.statSync(fullPath);
              const sizeKB = (stats.size / 1024).toFixed(2);
              this.log(`    文件大小: ${sizeKB} KB`, 'info');
            }
          });
        } else {
          this.addResult('场馆图片', `${venue.name}`, false, '未配置图片');
          this.log(`  ${venue.name}: 未配置图片`, 'warning');
        }
      } catch (e) {
        // 忽略空行
      }
    });
    
    this.log(`\n场馆图片统计: ${venuesWithImages}/${totalVenues} 个场馆已配置图片`, 'info');
  }

  // 测试2：检查课程数据图片
  testCourseImages() {
    this.log('\n=== 测试2: 课程图片配置 ===', 'info');
    
    const coursesPath = path.join(this.projectRoot, 'database/test_data/courses.json');
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    
    let coursesWithImages = 0;
    
    courses.forEach(course => {
      if (course.images && course.images.length > 0) {
        coursesWithImages++;
        
        // 检查图片文件是否存在
        course.images.forEach(imagePath => {
          const fullPath = path.join(this.projectRoot, 'miniprogram', imagePath);
          const exists = fs.existsSync(fullPath);
          
          this.addResult('课程图片', `${course.name}`, exists,
            exists ? imagePath : `图片不存在: ${imagePath}`);
          
          this.log(`  ${course.name}: ${exists ? imagePath : '图片缺失'}`,
            exists ? 'success' : 'error');
          
          if (exists) {
            const stats = fs.statSync(fullPath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            this.log(`    文件大小: ${sizeKB} KB`, 'info');
          }
        });
      } else {
        this.addResult('课程图片', `${course.name}`, false, '未配置图片');
        this.log(`  ${course.name}: 未配置图片`, 'warning');
      }
    });
    
    this.log(`\n课程图片统计: ${coursesWithImages}/${courses.length} 个课程已配置图片`, 'info');
  }

  // 测试3：检查图片目录结构
  testImageDirectories() {
    this.log('\n=== 测试3: 图片目录结构 ===', 'info');
    
    const venuesDir = path.join(this.projectRoot, 'miniprogram/images/venues');
    const coursesDir = path.join(this.projectRoot, 'miniprogram/images/courses');
    
    // 检查目录存在性
    const venuesDirExists = fs.existsSync(venuesDir);
    const coursesDirExists = fs.existsSync(coursesDir);
    
    this.addResult('目录结构', 'venues目录', venuesDirExists);
    this.log(`  venues/ 目录: ${venuesDirExists ? '存在' : '不存在'}`,
      venuesDirExists ? 'success' : 'error');
    
    this.addResult('目录结构', 'courses目录', coursesDirExists);
    this.log(`  courses/ 目录: ${coursesDirExists ? '存在' : '不存在'}`,
      coursesDirExists ? 'success' : 'error');
    
    // 统计图片数量
    if (venuesDirExists) {
      const venueImages = fs.readdirSync(venuesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      this.log(`    场馆图片数量: ${venueImages.length}`, 'info');
    }
    
    if (coursesDirExists) {
      const courseImages = fs.readdirSync(coursesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      this.log(`    课程图片数量: ${courseImages.length}`, 'info');
    }
  }

  // 测试4：图片格式和大小验证
  testImageSpecs() {
    this.log('\n=== 测试4: 图片规格验证 ===', 'info');
    
    const imagesDir = path.join(this.projectRoot, 'miniprogram/images');
    const venuesDir = path.join(imagesDir, 'venues');
    const coursesDir = path.join(imagesDir, 'courses');
    
    let oversizedImages = [];
    const maxSize = 500 * 1024; // 500KB建议上限
    
    // 检查场馆图片
    if (fs.existsSync(venuesDir)) {
      const files = fs.readdirSync(venuesDir);
      files.forEach(file => {
        const filePath = path.join(venuesDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.size > maxSize) {
          oversizedImages.push({
            path: `venues/${file}`,
            size: (stats.size / 1024).toFixed(2)
          });
        }
      });
    }
    
    // 检查课程图片
    if (fs.existsSync(coursesDir)) {
      const files = fs.readdirSync(coursesDir);
      files.forEach(file => {
        const filePath = path.join(coursesDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.size > maxSize) {
          oversizedImages.push({
            path: `courses/${file}`,
            size: (stats.size / 1024).toFixed(2)
          });
        }
      });
    }
    
    const sizeCheckPassed = oversizedImages.length === 0;
    this.addResult('图片规格', '文件大小', sizeCheckPassed,
      sizeCheckPassed ? '所有图片 < 500KB' : `${oversizedImages.length} 个图片超过500KB`);
    
    if (sizeCheckPassed) {
      this.log('  所有图片大小合理 (< 500KB)', 'success');
    } else {
      this.log(`  发现 ${oversizedImages.length} 个过大图片:`, 'warning');
      oversizedImages.forEach(img => {
        this.log(`    ${img.path}: ${img.size} KB`, 'warning');
      });
    }
  }

  // 生成测试报告
  generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('测试报告汇总', 'info');
    this.log('='.repeat(60), 'info');

    const passRate = this.testResults.total > 0 
      ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
      : 0;
    
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

    return this.testResults.failed === 0;
  }

  // 运行所有测试
  async runAllTests() {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          场馆和课程图片配置测试                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    this.testVenueImages();
    this.testCourseImages();
    this.testImageDirectories();
    this.testImageSpecs();

    return this.generateReport();
  }
}

// 主函数
async function main() {
  const tester = new ImageTester();
  const allPassed = await tester.runAllTests();
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}✓ 所有测试通过！图片配置正确。${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}${colors.bold}⚠ 部分测试失败，请检查上述错误。${colors.reset}`);
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

module.exports = ImageTester;
