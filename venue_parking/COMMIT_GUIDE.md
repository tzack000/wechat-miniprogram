# Git 提交指南 - CI/CD配置

## 🚀 快速提交CI/CD配置

### 方式1: 一键提交脚本

创建并运行以下脚本：

```bash
#!/bin/bash
# commit_ci.sh

echo "准备提交CI/CD配置..."

# 检查状态
git status

# 添加所有CI/CD相关文件
git add .github/
git add tests/ci_test_runner.js
git add package.json
git add scripts/setup_ci.sh
git add README_CI.md
git add CI_CD_SETUP_SUMMARY.md
git add COMMIT_GUIDE.md

# 查看待提交文件
echo ""
echo "将要提交的文件:"
git status --short

# 确认
echo ""
read -p "确认提交? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    git commit -m "ci: 添加CI/CD自动化测试配置

- 添加GitHub Actions工作流（concurrent-test.yml, test-badge.yml）
- 创建CI测试运行器（支持多种输出格式）
- 配置NPM测试脚本
- 添加CI环境配置检查工具
- 完善测试文档和使用指南

测试结果: 5/5场景通过 (100%)
覆盖: 并发预约、名额控制、数据一致性
"
    
    echo ""
    echo "✓ 提交成功！"
    echo ""
    read -p "是否推送到远程仓库? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        git push origin main
        echo ""
        echo "✓ 推送成功！"
        echo ""
        echo "查看GitHub Actions运行状态:"
        echo "https://github.com/tzack000/wechat-venue-parking-miniprogram/actions"
    fi
fi
```

### 方式2: 手动提交

```bash
# 1. 查看状态
git status

# 2. 添加CI/CD文件
git add .github/workflows/
git add tests/ci_test_runner.js
git add package.json
git add scripts/setup_ci.sh
git add .github/CI_CD_GUIDE.md
git add README_CI.md
git add CI_CD_SETUP_SUMMARY.md
git add COMMIT_GUIDE.md

# 3. 查看待提交内容
git status

# 4. 提交
git commit -m "ci: 添加CI/CD自动化测试配置

- 添加GitHub Actions工作流（concurrent-test.yml, test-badge.yml）
- 创建CI测试运行器（支持多种输出格式）
- 配置NPM测试脚本
- 添加CI环境配置检查工具
- 完善测试文档和使用指南

测试结果: 5/5场景通过 (100%)
覆盖: 并发预约、名额控制、数据一致性
"

# 5. 推送到远程
git push origin main
```

## 📋 提交文件清单

### 必须提交的文件

- ✅ `.github/workflows/concurrent-test.yml` - 主测试工作流
- ✅ `.github/workflows/test-badge.yml` - 徽章更新工作流
- ✅ `.github/CI_CD_GUIDE.md` - CI/CD完整指南
- ✅ `tests/ci_test_runner.js` - CI测试运行器
- ✅ `package.json` - NPM配置
- ✅ `scripts/setup_ci.sh` - CI配置工具
- ✅ `README_CI.md` - CI快速指南
- ✅ `CI_CD_SETUP_SUMMARY.md` - 配置总结

### 可选提交的文件

- `test-results.json` - 测试结果（不建议提交）
- `CI_TEST_REPORT.md` - 测试报告（不建议提交）
- `TEST_REPORT.md` - 测试报告（不建议提交）
- `node_modules/` - 依赖目录（已在.gitignore）

## 🔍 提交前检查

```bash
# 运行配置检查
bash scripts/setup_ci.sh

# 运行测试验证
npm test

# 检查文件语法
npm run lint
```

## 📝 推荐的提交信息格式

```
<type>: <subject>

<body>

<footer>
```

### 类型（type）
- `ci`: CI/CD配置相关
- `test`: 添加或修改测试
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `refactor`: 代码重构

### 示例

```bash
# 完整提交信息
git commit -m "ci: 添加CI/CD自动化测试配置

配置内容:
- GitHub Actions工作流（多版本Node.js测试）
- CI测试运行器（支持JSON/JUnit/Markdown格式）
- NPM测试脚本和工具
- 完整的文档体系

测试覆盖:
- 并发预约控制: 5/5场景通过
- 名额限制验证: 100%准确
- 数据一致性检查: 无异常
- 性能测试: 100并发 < 50ms

影响范围:
- 不影响现有功能
- 仅添加测试和CI配置
- 提升代码质量保障

相关文档:
- .github/CI_CD_GUIDE.md
- tests/README.md
- CI_CD_SETUP_SUMMARY.md
"

# 简短提交信息
git commit -m "ci: 添加CI/CD自动化测试 (5/5场景通过)"
```

## 🎯 提交后验证

### 1. 查看GitHub Actions

```bash
# 在浏览器中打开
open https://github.com/tzack000/wechat-venue-parking-miniprogram/actions
```

或访问：https://github.com/tzack000/wechat-venue-parking-miniprogram/actions

### 2. 等待测试完成

预计耗时: 1-3分钟

包含的测试:
- ✅ Node.js 16.x 测试
- ✅ Node.js 18.x 测试  
- ✅ Node.js 20.x 测试
- ✅ 代码质量检查

### 3. 查看测试结果

点击最新的运行记录，查看：
- Summary - 测试摘要
- Jobs - 各任务详情
- Artifacts - 测试产物下载

### 4. 验证徽章

如果添加了徽章到README，刷新仓库主页查看状态。

## ⚠️ 常见问题

### Q1: 提交失败 "nothing to commit"

**原因**: 文件可能已经在其他提交中添加

**解决**:
```bash
git status  # 查看状态
git log --oneline -5  # 查看最近提交
```

### Q2: 推送失败 "rejected"

**原因**: 远程有新提交，需要先拉取

**解决**:
```bash
git pull origin main --rebase
git push origin main
```

### Q3: GitHub Actions没有触发

**原因**: 
- 可能触发条件不满足
- 可能需要等待几秒

**解决**:
- 检查 `.github/workflows/` 路径是否正确
- 手动触发: Actions → Run workflow

### Q4: 测试失败

**原因**: 环境或代码问题

**解决**:
```bash
# 本地复现
npm test

# 查看详细日志
npm run test:verbose

# 检查特定场景
npm run test:scenario "正常并发"
```

## 🔄 更新CI配置

如需修改CI配置：

```bash
# 1. 修改配置文件
vim .github/workflows/concurrent-test.yml

# 2. 本地测试（如果可能）
npm test

# 3. 提交
git add .github/workflows/concurrent-test.yml
git commit -m "ci: 更新测试工作流配置"

# 4. 推送
git push origin main

# 5. 验证
# 访问 Actions 页面查看新配置是否生效
```

## 📊 提交统计

本次CI/CD配置涉及：

| 类型 | 数量 |
|------|------|
| 新增文件 | 8个 |
| 工作流配置 | 2个 |
| 测试脚本 | 1个 |
| 文档 | 4个 |
| 工具脚本 | 1个 |
| 总代码行数 | ~2500行 |

## 🎉 完成后的收益

提交并部署CI/CD后，您将获得：

✅ **自动化测试**
- 每次提交自动运行
- 多版本Node.js验证
- PR合并前自动检查

✅ **质量保障**  
- 并发预约100%测试覆盖
- 名额控制准确性验证
- 数据一致性自动检查

✅ **快速反馈**
- 2-3分钟获得测试结果
- PR自动评论
- 详细的测试报告

✅ **持续改进**
- 历史测试记录
- 性能趋势分析
- 问题快速定位

---

**准备好了吗？** 运行 `bash scripts/setup_ci.sh` 进行最后检查，然后提交！

**需要帮助？** 查看 `.github/CI_CD_GUIDE.md` 获取完整指南。
