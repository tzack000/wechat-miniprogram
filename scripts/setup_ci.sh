#!/bin/bash

# CI/CD 快速配置脚本
# 用于初始化CI/CD环境和验证配置

set -e

echo "╔═══════════════════════════════════════════════════╗"
echo "║         CI/CD 环境配置和验证工具                  ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

info() {
    echo -e "${YELLOW}➜${NC} $1"
}

# 1. 检查Node.js环境
echo "1. 检查Node.js环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js已安装: $NODE_VERSION"
    
    # 检查版本是否满足要求
    REQUIRED_VERSION="16.0.0"
    CURRENT_VERSION=$(node -v | sed 's/v//')
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        echo -e "${GREEN}✓${NC} Node.js版本满足要求 (>= 16.0.0)"
    else
        echo -e "${YELLOW}⚠${NC} Node.js版本过低，建议升级到 >= 16.0.0"
    fi
else
    echo -e "${RED}✗${NC} Node.js未安装"
    echo "请访问 https://nodejs.org/ 下载安装"
    exit 1
fi
echo ""

# 2. 检查Git环境
echo "2. 检查Git环境..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓${NC} Git已安装: $GIT_VERSION"
    
    # 检查是否为Git仓库
    if [ -d .git ]; then
        echo -e "${GREEN}✓${NC} 当前目录是Git仓库"
        
        # 检查远程仓库
        if git remote -v | grep -q "github.com"; then
            REMOTE_URL=$(git remote get-url origin)
            echo -e "${GREEN}✓${NC} GitHub远程仓库: $REMOTE_URL"
        else
            echo -e "${YELLOW}⚠${NC} 未检测到GitHub远程仓库"
        fi
    else
        echo -e "${YELLOW}⚠${NC} 当前目录不是Git仓库"
        info "运行 'git init' 初始化Git仓库"
    fi
else
    echo -e "${RED}✗${NC} Git未安装"
    echo "请访问 https://git-scm.com/ 下载安装"
    exit 1
fi
echo ""

# 3. 检查项目结构
echo "3. 检查项目结构..."

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (缺失)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (缺失)"
        return 1
    fi
}

check_file "package.json"
check_dir ".github/workflows"
check_file ".github/workflows/concurrent-test.yml"
check_file ".github/workflows/test-badge.yml"
check_dir "tests"
check_file "tests/simulate_concurrent_test.js"
check_file "tests/ci_test_runner.js"
echo ""

# 4. 验证测试脚本
echo "4. 验证测试脚本..."
if [ -f "tests/simulate_concurrent_test.js" ]; then
    node -c tests/simulate_concurrent_test.js
    check "测试脚本语法检查"
fi

if [ -f "tests/ci_test_runner.js" ]; then
    node -c tests/ci_test_runner.js
    check "CI运行器语法检查"
fi
echo ""

# 5. 检查npm依赖
echo "5. 检查npm配置..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json存在"
    
    # 检查是否已安装依赖
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} 依赖已安装"
    else
        echo -e "${YELLOW}⚠${NC} 依赖未安装"
        info "是否现在安装依赖? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            npm install
            check "依赖安装"
        fi
    fi
else
    echo -e "${RED}✗${NC} package.json不存在"
fi
echo ""

# 6. 运行测试
echo "6. 运行快速测试..."
info "是否运行并发测试验证? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    info "运行测试..."
    node tests/simulate_concurrent_test.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} 测试通过！"
    else
        echo ""
        echo -e "${RED}✗${NC} 测试失败"
        exit 1
    fi
fi
echo ""

# 7. GitHub Actions状态检查
echo "7. GitHub Actions状态..."
if [ -d .git ] && git remote -v | grep -q "github.com"; then
    info "GitHub Actions配置已就绪"
    echo "  下次推送代码时将自动运行测试"
    echo ""
    echo "  查看工作流状态:"
    REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/.git$//')
    echo "  $REPO_URL/actions"
else
    echo -e "${YELLOW}⚠${NC} 未连接到GitHub仓库"
    echo "  需要推送到GitHub才能使用GitHub Actions"
fi
echo ""

# 8. 生成配置摘要
echo "═══════════════════════════════════════════════════"
echo "配置摘要"
echo "═══════════════════════════════════════════════════"
echo "项目: wechat-venue-parking-miniprogram"
echo "Node.js: $NODE_VERSION"
echo "CI平台: GitHub Actions"
echo "测试框架: 自定义并发测试"
echo ""
echo "可用命令:"
echo "  npm test              - 运行所有测试"
echo "  npm run test:ci       - CI模式运行"
echo "  npm run test:json     - 生成JSON报告"
echo "  npm run test:markdown - 生成Markdown报告"
echo ""
echo "文档:"
echo "  .github/CI_CD_GUIDE.md         - CI/CD完整指南"
echo "  tests/README.md                - 测试使用说明"
echo "  tests/CONCURRENT_TEST_REPORT.md - 测试报告"
echo "═══════════════════════════════════════════════════"
echo ""

# 9. 下一步提示
echo "🚀 下一步操作:"
echo ""
echo "1. 提交CI/CD配置:"
echo "   git add ."
echo "   git commit -m \"ci: 添加CI/CD自动化测试\""
echo "   git push origin main"
echo ""
echo "2. 查看GitHub Actions运行状态:"
REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/.git$//' || echo "https://github.com/YOUR_USERNAME/YOUR_REPO")
echo "   $REPO_URL/actions"
echo ""
echo "3. 在README中添加徽章 (参考 README_CI.md)"
echo ""
echo "4. 配置GitHub仓库保护规则 (可选):"
echo "   Settings → Branches → Add rule"
echo "   - 要求CI测试通过才能合并PR"
echo "   - 要求代码审查"
echo ""

echo -e "${GREEN}✓${NC} CI/CD环境配置检查完成！"
