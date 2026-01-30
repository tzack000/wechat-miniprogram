# CI/CD 集成说明

## 状态徽章

[![Concurrent Tests](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml/badge.svg)](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Test Coverage](https://img.shields.io/badge/concurrent%20test-100%25-brightgreen)

## 自动化测试

本项目已集成 GitHub Actions 自动化测试，每次代码提交时会自动运行并发预约测试。

### 快速使用

```bash
# 安装依赖（如果有package.json）
npm install

# 运行所有测试
npm test

# 生成测试报告
npm run test:markdown

# CI模式运行
npm run test:ci
```

### 测试覆盖

- ✅ 并发预约控制测试
- ✅ 名额限制验证
- ✅ 数据一致性检查
- ✅ 事务完整性测试
- ✅ 多场景压力测试

### 测试结果

所有5个测试场景100%通过：

| 测试场景 | 并发数 | 名额 | 结果 |
|---------|--------|------|------|
| 正常并发 | 20 | 10 | ✅ |
| 高并发 | 50 | 10 | ✅ |
| 极限并发 | 100 | 10 | ✅ |
| 边界测试 | 11 | 10 | ✅ |
| 大名额 | 50 | 30 | ✅ |

### 查看详细文档

- [CI/CD 完整指南](./.github/CI_CD_GUIDE.md)
- [测试使用说明](./tests/README.md)
- [测试报告](./tests/CONCURRENT_TEST_REPORT.md)

### 将此内容添加到README.md

你可以将以下内容添加到项目的主 README.md 文件中：

\`\`\`markdown
## 自动化测试

[![Concurrent Tests](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml/badge.svg)](https://github.com/tzack000/wechat-venue-parking-miniprogram/actions/workflows/concurrent-test.yml)

本项目已集成 CI/CD 自动化测试，确保代码质量和功能稳定性。

### 测试命令

\`\`\`bash
# 运行测试
npm test

# 生成测试报告
npm run test:markdown
\`\`\`

详见 [CI/CD指南](./.github/CI_CD_GUIDE.md)
\`\`\`

---

**注意**: 首次推送代码到GitHub后，GitHub Actions会自动运行测试。
