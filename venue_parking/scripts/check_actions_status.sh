#!/bin/bash

# GitHub Actions 状态检查脚本
# 帮助查看CI/CD运行状态和添加徽章

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════╗"
echo "║       GitHub Actions 状态检查和徽章添加          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 获取仓库信息
REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/.git$//')
REPO_PATH=$(echo $REPO_URL | sed 's/https:\/\/github.com\///')

echo -e "${BLUE}仓库信息${NC}"
echo "URL: $REPO_URL"
echo "Path: $REPO_PATH"
echo ""

# 检查最新提交
echo -e "${BLUE}最新提交${NC}"
git log --oneline -1
echo ""

# Actions链接
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤1: 查看GitHub Actions运行状态${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "在浏览器中打开以下链接："
echo ""
echo -e "${BLUE}Actions主页:${NC}"
echo "$REPO_URL/actions"
echo ""
echo -e "${BLUE}最新运行:${NC}"
echo "$REPO_URL/actions/workflows/concurrent-test.yml"
echo ""

# 检查是否安装了GitHub CLI
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✓${NC} 检测到GitHub CLI，可以直接查看状态"
    echo ""
    echo "运行以下命令查看状态："
    echo "  gh run list --repo $REPO_PATH"
    echo "  gh run view --repo $REPO_PATH"
    echo ""
    
    read -p "是否现在运行 gh run list 查看状态? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        gh run list --repo $REPO_PATH --limit 5
    fi
else
    echo -e "${YELLOW}⚠${NC} 未安装GitHub CLI"
    echo "安装方法: https://cli.github.com/"
    echo ""
fi

# 等待用户确认
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤2: 确认测试结果${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "请在浏览器中查看GitHub Actions运行结果"
echo ""
echo "预期结果："
echo "  ✅ Node.js 16.x - concurrent-test"
echo "  ✅ Node.js 18.x - concurrent-test"
echo "  ✅ Node.js 20.x - concurrent-test"
echo "  ✅ code-quality"
echo "  ✅ notification"
echo ""
echo "测试场景："
echo "  ✅ 正常并发 (20人抢10名额)"
echo "  ✅ 高并发 (50人抢10名额)"
echo "  ✅ 极限并发 (100人抢10名额)"
echo "  ✅ 边界测试 (11人抢10名额)"
echo "  ✅ 大名额 (50人抢30名额)"
echo ""

read -p "所有测试是否都通过了? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${RED}✗${NC} 测试未通过，请检查失败原因"
    echo ""
    echo "排查建议："
    echo "  1. 查看失败的job详细日志"
    echo "  2. 本地运行测试: npm test"
    echo "  3. 查看 .github/CI_CD_GUIDE.md 故障排查章节"
    echo ""
    exit 1
fi

# 生成徽章
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤3: 添加徽章到README${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 徽章代码
BADGE_ACTIONS="[![Concurrent Tests]($REPO_URL/actions/workflows/concurrent-test.yml/badge.svg)]($REPO_URL/actions/workflows/concurrent-test.yml)"
BADGE_NODE="![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)"
BADGE_TESTS="![Test Pass Rate](https://img.shields.io/badge/tests-100%25-brightgreen)"
BADGE_COVERAGE="![Coverage](https://img.shields.io/badge/coverage-concurrent%20booking-blue)"

echo "将以下徽章代码添加到 README.md 顶部："
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$BADGE_ACTIONS"
echo "$BADGE_NODE"
echo "$BADGE_TESTS"
echo "$BADGE_COVERAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 保存到临时文件
cat > /tmp/badges.md << EOF
$BADGE_ACTIONS
$BADGE_NODE
$BADGE_TESTS
$BADGE_COVERAGE
EOF

echo "徽章代码已保存到: /tmp/badges.md"
echo ""

# 询问是否自动添加
read -p "是否自动添加徽章到README.md? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "正在备份README.md..."
    cp README.md README.md.backup
    
    echo "正在添加徽章..."
    
    # 读取README第一行
    FIRST_LINE=$(head -n 1 README.md)
    
    # 创建新的README
    {
        echo "$FIRST_LINE"
        echo ""
        echo "$BADGE_ACTIONS"
        echo "$BADGE_NODE"
        echo "$BADGE_TESTS"
        echo "$BADGE_COVERAGE"
        echo ""
        tail -n +2 README.md
    } > README.md.new
    
    mv README.md.new README.md
    
    echo -e "${GREEN}✓${NC} 徽章已添加到README.md"
    echo ""
    
    # 显示差异
    echo "修改内容："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    head -n 10 README.md
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 提交
    read -p "是否提交并推送到GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "正在提交..."
        git add README.md
        git commit -m "docs: 添加CI/CD测试徽章

- 添加GitHub Actions状态徽章
- 添加Node.js版本徽章
- 添加测试通过率徽章
- 添加测试覆盖范围徽章
"
        
        echo "正在推送..."
        git push origin main
        
        echo ""
        echo -e "${GREEN}✓${NC} 徽章已成功添加并推送到GitHub"
        echo ""
        echo "刷新GitHub仓库主页即可看到徽章："
        echo "$REPO_URL"
    else
        echo ""
        echo "已跳过推送，您可以稍后手动提交："
        echo "  git add README.md"
        echo "  git commit -m \"docs: 添加CI/CD测试徽章\""
        echo "  git push origin main"
    fi
else
    echo ""
    echo "请手动编辑README.md，在文件开头添加徽章"
    echo ""
    echo "1. 打开 README.md"
    echo "2. 在标题下方添加徽章代码（已保存在 /tmp/badges.md）"
    echo "3. 保存并提交"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤4: 验证徽章显示${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "访问GitHub仓库主页查看徽章："
echo "$REPO_URL"
echo ""
echo "徽章应该显示："
echo "  • Concurrent Tests - passing (绿色)"
echo "  • node >=16.0.0 (绿色)"
echo "  • tests 100% (绿色)"
echo "  • coverage concurrent booking (蓝色)"
echo ""

# 完成总结
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✓ 完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "CI/CD配置已完成并运行成功！"
echo ""
echo "关键链接："
echo "  • Actions运行: $REPO_URL/actions"
echo "  • 仓库主页: $REPO_URL"
echo "  • CI/CD指南: $REPO_URL/blob/main/.github/CI_CD_GUIDE.md"
echo ""
echo "本地命令："
echo "  • 运行测试: npm test"
echo "  • 生成报告: npm run test:markdown"
echo "  • 配置检查: bash scripts/setup_ci.sh"
echo ""

echo -e "${GREEN}🎉 恭喜！CI/CD自动化测试已完全就绪！${NC}"
