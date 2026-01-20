#!/bin/bash

# GitHub Actions 验证脚本
# 帮助验证CI/CD运行状态和测试结果

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════╗"
echo "║     GitHub Actions 运行状态验证工具              ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 获取仓库信息
REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/.git$//')
REPO_PATH=$(echo $REPO_URL | sed 's/https:\/\/github.com\///')
REPO_OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
REPO_NAME=$(echo $REPO_PATH | cut -d'/' -f2)

echo -e "${CYAN}仓库信息${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Owner: $REPO_OWNER"
echo "Repo: $REPO_NAME"
echo "URL: $REPO_URL"
echo ""

# 获取最近的提交
echo -e "${CYAN}最近的提交${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -3 --decorate --color
echo ""

# 检查GitHub CLI
echo -e "${CYAN}检查工具${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v gh &> /dev/null; then
    echo -e "${GREEN}✓${NC} GitHub CLI 已安装"
    GH_VERSION=$(gh --version | head -n1)
    echo "  版本: $GH_VERSION"
    echo ""
    
    # 检查认证状态
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✓${NC} GitHub CLI 已认证"
        echo ""
        
        # 使用GitHub CLI获取Actions状态
        echo -e "${CYAN}GitHub Actions 运行状态${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        echo "正在获取最近的运行记录..."
        gh run list --repo "$REPO_PATH" --limit 5 --json conclusion,status,name,headBranch,createdAt,updatedAt,event,url,workflowName | \
        jq -r '.[] | "
运行ID: \(.databaseId // "N/A")
工作流: \(.workflowName)
分支: \(.headBranch)
状态: \(.status)
结果: \(.conclusion // "运行中")
触发: \(.event)
创建: \(.createdAt)
更新: \(.updatedAt)
链接: \(.url)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'
        
        echo ""
        echo -e "${YELLOW}查看最新运行详情${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        read -p "是否查看最新运行的详细信息? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            gh run view --repo "$REPO_PATH" --log
        fi
        
    else
        echo -e "${YELLOW}⚠${NC} GitHub CLI 未认证"
        echo ""
        echo "运行以下命令进行认证:"
        echo "  gh auth login"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠${NC} GitHub CLI 未安装"
    echo ""
    echo "安装方法:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  Windows: https://github.com/cli/cli#windows"
    echo ""
fi

# 显示Actions链接
echo -e "${CYAN}GitHub Actions 链接${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Actions主页:"
echo "  $REPO_URL/actions"
echo ""
echo "Concurrent Tests工作流:"
echo "  $REPO_URL/actions/workflows/concurrent-test.yml"
echo ""
echo "最新运行:"
echo "  $REPO_URL/actions/runs"
echo ""

# 本地测试验证
echo -e "${CYAN}本地测试验证${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "是否运行本地测试验证? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}运行本地测试...${NC}"
    echo ""
    
    if [ -f "tests/simulate_concurrent_test.js" ]; then
        node tests/simulate_concurrent_test.js
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✓ 本地测试通过！${NC}"
            echo ""
            echo "这表明CI/CD中的测试也应该通过。"
        else
            echo ""
            echo -e "${RED}✗ 本地测试失败${NC}"
            echo ""
            echo "请检查测试代码并修复问题。"
        fi
    else
        echo -e "${RED}✗ 测试文件不存在${NC}"
    fi
fi

# 验证工作流文件
echo ""
echo -e "${CYAN}验证工作流配置${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".github/workflows/concurrent-test.yml" ]; then
    echo -e "${GREEN}✓${NC} concurrent-test.yml 存在"
    
    # 检查YAML语法
    if command -v yamllint &> /dev/null; then
        yamllint .github/workflows/concurrent-test.yml && echo -e "${GREEN}✓${NC} YAML语法正确" || echo -e "${RED}✗${NC} YAML语法错误"
    fi
    
    # 显示触发条件
    echo ""
    echo "工作流触发条件:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    grep -A 10 "^on:" .github/workflows/concurrent-test.yml | head -15
else
    echo -e "${RED}✗${NC} concurrent-test.yml 不存在"
fi

echo ""

if [ -f ".github/workflows/test-badge.yml" ]; then
    echo -e "${GREEN}✓${NC} test-badge.yml 存在"
else
    echo -e "${YELLOW}⚠${NC} test-badge.yml 不存在"
fi

echo ""

# 徽章验证
echo -e "${CYAN}徽章验证${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "README.md" ]; then
    if grep -q "actions/workflows/concurrent-test.yml/badge.svg" README.md; then
        echo -e "${GREEN}✓${NC} README.md 包含Actions徽章"
        
        # 显示徽章
        echo ""
        echo "徽章代码:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep "badge.svg" README.md | head -4
    else
        echo -e "${YELLOW}⚠${NC} README.md 未包含Actions徽章"
    fi
else
    echo -e "${RED}✗${NC} README.md 不存在"
fi

echo ""
echo ""

# 预期测试结果
echo -e "${CYAN}预期测试结果${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "在GitHub Actions中，您应该看到以下结果："
echo ""
echo "Jobs:"
echo "  ✅ concurrent-test (Node 16.x)"
echo "  ✅ concurrent-test (Node 18.x)"
echo "  ✅ concurrent-test (Node 20.x)"
echo "  ✅ code-quality"
echo "  ✅ notification"
echo ""
echo "测试场景:"
echo "  ✅ 正常并发 (20人抢10名额) - 10成功"
echo "  ✅ 高并发 (50人抢10名额) - 10成功"
echo "  ✅ 极限并发 (100人抢10名额) - 10成功"
echo "  ✅ 边界测试 (11人抢10名额) - 10成功"
echo "  ✅ 大名额 (50人抢30名额) - 30成功"
echo ""
echo "验证点:"
echo "  ✅ 无超额预约 (100%)"
echo "  ✅ 数据一致性 (100%)"
echo "  ✅ 成功数准确 (100%)"
echo ""
echo "总结:"
echo "  测试总数: 5"
echo "  通过: 5"
echo "  失败: 0"
echo "  通过率: 100%"
echo ""

# 故障排查建议
echo -e "${CYAN}故障排查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "如果Actions失败，请检查："
echo ""
echo "1. 查看失败的Job日志"
echo "   - 点击失败的Job"
echo "   - 展开失败的步骤"
echo "   - 查看错误信息"
echo ""
echo "2. 本地复现问题"
echo "   npm test"
echo ""
echo "3. 检查工作流配置"
echo "   - 语法是否正确"
echo "   - 路径是否正确"
echo "   - 触发条件是否满足"
echo ""
echo "4. 查看完整指南"
echo "   cat .github/CI_CD_GUIDE.md"
echo ""

# 快速操作菜单
echo -e "${CYAN}快速操作${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 在浏览器中打开Actions页面"
echo "2. 查看最新运行日志"
echo "3. 下载测试产物"
echo "4. 运行本地测试"
echo "5. 查看CI/CD文档"
echo "6. 退出"
echo ""

read -p "选择操作 (1-6): " -n 1 -r CHOICE
echo
echo ""

case $CHOICE in
    1)
        echo "正在打开Actions页面..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "$REPO_URL/actions"
        elif command -v open &> /dev/null; then
            open "$REPO_URL/actions"
        else
            echo "请手动访问: $REPO_URL/actions"
        fi
        ;;
    2)
        if command -v gh &> /dev/null; then
            gh run view --repo "$REPO_PATH" --log
        else
            echo "请安装GitHub CLI或访问: $REPO_URL/actions"
        fi
        ;;
    3)
        echo "测试产物保存在Actions运行页面，点击Artifacts下载"
        echo "$REPO_URL/actions"
        ;;
    4)
        npm test
        ;;
    5)
        if [ -f ".github/CI_CD_GUIDE.md" ]; then
            less .github/CI_CD_GUIDE.md
        else
            echo "文档不存在"
        fi
        ;;
    6)
        echo "退出"
        ;;
    *)
        echo "无效选择"
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}验证完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "访问以下链接查看完整状态:"
echo "  $REPO_URL/actions"
echo ""
