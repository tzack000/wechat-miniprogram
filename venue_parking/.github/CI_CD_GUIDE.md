# CI/CD 自动化测试指南

## 概述

本项目已集成 GitHub Actions 自动化测试流程，在代码提交时自动运行并发预约测试，确保系统的稳定性和可靠性。

## 触发条件

### 自动触发

CI/CD 流程会在以下情况自动触发：

1. **推送到主分支**
   - `main`, `master`, `develop` 分支的任何推送

2. **Pull Request**
   - 针对主分支的 Pull Request

3. **文件变更监控**
   - `cloudfunctions/course/**` - 预约核心逻辑
   - `cloudfunctions/testConcurrentBooking/**` - 测试云函数
   - `tests/**` - 测试代码
   - `.github/workflows/**` - CI配置

### 手动触发

在 GitHub Actions 页面可以手动触发测试：

1. 访问 `https://github.com/tzack000/wechat-venue-parking-miniprogram/actions`
2. 选择 "Concurrent Booking Tests" 工作流
3. 点击 "Run workflow"
4. 可选设置并发数量参数

## 工作流程

### 1. concurrent-test.yml

**主测试工作流**，包含3个job：

#### Job 1: concurrent-test

并发预约测试任务，在多个Node.js版本上运行：

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
```

**执行步骤**：
1. 检出代码
2. 设置 Node.js 环境
3. 安装依赖
4. 运行并发预约模拟测试
5. 生成测试摘要
6. 上传测试输出（保留30天）
7. 评论PR（如果是Pull Request）

**输出产物**：
- `test-output-node-16.x.txt`
- `test-output-node-18.x.txt`
- `test-output-node-20.x.txt`

#### Job 2: code-quality

代码质量检查任务：

**执行内容**：
- JavaScript 语法检查
- 代码行数统计
- 格式验证

#### Job 3: notification

测试完成通知任务：

**功能**：
- 汇总所有测试结果
- 生成总结报告
- 显示最终状态

### 2. test-badge.yml

**测试徽章更新工作流**：

**触发条件**：
- 推送到 main/master 分支
- Concurrent Booking Tests 工作流完成

**功能**：
- 生成测试结果JSON
- 创建测试徽章数据
- 更新徽章（可选）

## 测试命令

### NPM Scripts

项目已配置多个npm scripts，方便本地测试：

```bash
# 运行所有测试（控制台输出）
npm test

# CI模式运行
npm run test:ci

# 生成JSON报告
npm run test:json

# 生成JUnit XML报告（用于CI工具）
npm run test:junit

# 生成Markdown报告
npm run test:markdown

# 静默模式（只显示结果）
npm run test:quiet

# 详细模式
npm run test:verbose

# 运行特定场景
npm run test:scenario "高并发"

# 监控模式（文件变化时自动测试）
npm run test:watch

# 代码检查
npm run lint

# 完整验证（lint + test）
npm run validate
```

### 直接使用测试运行器

```bash
# 查看帮助
node tests/ci_test_runner.js --help

# 控制台输出
node tests/ci_test_runner.js

# JSON格式
node tests/ci_test_runner.js --format json --output results.json

# JUnit格式（用于Jenkins等）
node tests/ci_test_runner.js --format junit --output results.xml

# Markdown报告
node tests/ci_test_runner.js --format markdown --output REPORT.md

# 运行特定场景
node tests/ci_test_runner.js --scenario "正常并发"

# 静默模式
node tests/ci_test_runner.js --quiet
```

## 测试报告

### 查看GitHub Actions报告

1. **工作流摘要**
   - 访问 Actions 页面
   - 选择具体的运行记录
   - 查看 Summary 标签页

2. **下载测试产物**
   - 在运行详情页面
   - 找到 "Artifacts" 部分
   - 下载 `test-output-node-*.txt` 文件

3. **PR评论**
   - 自动在PR中添加测试结果评论
   - 包含测试摘要和详细输出

### 本地生成报告

```bash
# Markdown报告
npm run test:markdown

# 查看生成的报告
cat TEST_REPORT.md
```

## 测试场景

所有测试场景均验证以下关键点：
- ✓ 无超额预约
- ✓ 数据一致性
- ✓ 事务完整性

### 预设场景

| 场景 | 并发数 | 名额 | 说明 |
|------|--------|------|------|
| 正常并发 | 20 | 10 | 基础并发测试 |
| 高并发 | 50 | 10 | 高负载测试 |
| 极限并发 | 100 | 10 | 压力测试 |
| 边界测试 | 11 | 10 | 临界值测试 |
| 大名额 | 50 | 30 | 大容量测试 |

## 集成到现有CI/CD

### Jenkins集成

```groovy
pipeline {
    agent any
    
    stages {
        stage('Test') {
            steps {
                sh 'npm install'
                sh 'npm run test:junit'
                junit 'test-results.xml'
            }
        }
    }
}
```

### GitLab CI集成

```yaml
test:
  image: node:18
  script:
    - npm install
    - npm run test:junit
  artifacts:
    reports:
      junit: test-results.xml
```

### CircleCI集成

```yaml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm install
      - run: npm run test:junit
      - store_test_results:
          path: test-results.xml
```

## 状态徽章

### 添加到README

```markdown
# 项目名称

[![Concurrent Tests](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml/badge.svg)](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml)

...
```

### 自定义徽章

使用 shields.io 创建自定义徽章：

```markdown
![Test Pass Rate](https://img.shields.io/badge/tests-100%25-brightgreen)
![Concurrent Capacity](https://img.shields.io/badge/concurrent-100%2B-blue)
```

## 失败处理

### 测试失败时

1. **查看失败日志**
   - 在 Actions 页面查看详细日志
   - 下载测试输出文件
   - 检查具体失败场景

2. **本地复现**
   ```bash
   npm run test:verbose
   ```

3. **修复问题**
   - 根据失败原因修复代码
   - 本地验证通过后再推送

4. **重新运行**
   - GitHub Actions 支持重新运行失败的作业

### PR被阻止时

如果PR的测试失败，会阻止合并：

1. 查看PR中的测试评论
2. 点击 "Details" 查看完整日志
3. 修复问题并推送新提交
4. 自动触发重新测试

## 配置说明

### 环境变量

目前不需要额外的环境变量。如需添加：

```yaml
env:
  NODE_ENV: test
  TEST_TIMEOUT: 30000
```

### Secrets配置

如需添加敏感信息：

1. 访问仓库的 Settings → Secrets
2. 添加新的 secret
3. 在workflow中使用：
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
   ```

### 修改触发条件

编辑 `.github/workflows/concurrent-test.yml`：

```yaml
on:
  push:
    branches: [ main, master, develop, feature/* ]  # 添加更多分支
  pull_request:
    branches: [ main, master ]
  schedule:
    - cron: '0 0 * * *'  # 每天运行
```

## 性能监控

### 测试时间监控

每次运行会记录：
- 总执行时间
- 各场景耗时
- 平均响应时间

### 趋势分析

通过历史运行记录可以：
- 对比不同版本的性能
- 发现性能退化
- 优化慢速测试

## 最佳实践

### 1. 提交前测试

```bash
# 在提交前运行完整测试
npm run validate
git commit -m "feat: 添加新功能"
```

### 2. 使用Git钩子

创建 `.git/hooks/pre-push`：

```bash
#!/bin/bash
npm run validate
```

### 3. 小步提交

- 每次提交一个功能点
- 确保每次提交都能通过测试
- 便于问题定位和回滚

### 4. PR描述

在PR描述中包含：
- 变更内容说明
- 测试结果截图
- 性能影响分析

### 5. 定期维护

- 定期更新依赖
- 优化测试性能
- 添加新测试场景

## 故障排查

### 常见问题

#### Q: 测试在CI中失败，但本地通过？

**A**: 可能原因：
- Node.js版本不一致
- 依赖版本差异
- 环境变量缺失

解决方法：
```bash
# 使用nvm切换到CI使用的版本
nvm use 18
npm test
```

#### Q: 测试超时？

**A**: 修改超时设置：

```yaml
# 在workflow中增加超时
- name: 运行测试
  timeout-minutes: 10
  run: npm test
```

#### Q: 如何跳过CI？

**A**: 在提交信息中添加 `[skip ci]`：

```bash
git commit -m "docs: 更新文档 [skip ci]"
```

## 扩展功能

### 添加性能测试

创建 `tests/performance_test.js`：

```javascript
// 性能基准测试
async function performanceTest() {
  const iterations = 1000;
  const start = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    // 执行测试
  }
  
  const duration = Date.now() - start;
  console.log(`${iterations}次迭代耗时: ${duration}ms`);
}
```

### 添加压力测试

```javascript
// 逐步增加并发，找到系统极限
async function stressTest() {
  for (let concurrency = 10; concurrency <= 200; concurrency += 10) {
    const result = await runTest(concurrency);
    if (!result.success) {
      console.log(`系统极限: ${concurrency - 10} 并发`);
      break;
    }
  }
}
```

### 添加监控告警

集成钉钉、企业微信等告警：

```yaml
- name: 发送通知
  if: failure()
  run: |
    curl -X POST ${{ secrets.WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text": "测试失败！"}'
```

## 相关文档

- [GitHub Actions文档](https://docs.github.com/cn/actions)
- [Node.js测试最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [测试使用指南](../tests/README.md)
- [完整测试报告](../tests/CONCURRENT_TEST_REPORT.md)

## 支持

如有问题或建议：
1. 提交 Issue
2. 创建 Pull Request
3. 联系维护团队

---

*最后更新: 2026-01-20*
