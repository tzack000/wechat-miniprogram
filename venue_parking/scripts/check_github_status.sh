#!/bin/bash

# GitHub Actions 状态检查脚本
# 需要 GitHub CLI (gh) 或 curl + GitHub token

echo "=========================================="
echo "GitHub Actions 状态检查"
echo "=========================================="
echo ""

REPO="tzack000/wechat-venue-parking-miniprogram"
COMMIT="7f8bd1c"

echo "仓库: $REPO"
echo "提交: $COMMIT"
echo ""

# 方法 1: 使用 gh CLI (如果已安装)
if command -v gh &> /dev/null; then
    echo "使用 GitHub CLI 检查..."
    echo ""
    
    echo "最近的 workflow 运行："
    gh run list --repo "$REPO" --limit 5
    
    echo ""
    echo "最新运行详情："
    gh run view --repo "$REPO"
    
else
    echo "⚠️ 未安装 GitHub CLI (gh)"
    echo ""
    echo "请选择以下方式之一："
    echo ""
    echo "1. 安装 GitHub CLI："
    echo "   Ubuntu/Debian: sudo apt install gh"
    echo "   macOS: brew install gh"
    echo "   然后运行: gh auth login"
    echo ""
    echo "2. 直接访问网页："
    echo "   https://github.com/$REPO/actions"
    echo ""
    echo "3. 使用 API (需要 GitHub token)："
    echo "   curl -H 'Authorization: token YOUR_TOKEN' \\"
    echo "        https://api.github.com/repos/$REPO/actions/runs"
fi

echo ""
echo "=========================================="
echo "手动检查链接："
echo "=========================================="
echo ""
echo "Actions 页面:"
echo "https://github.com/$REPO/actions"
echo ""
echo "特定提交的检查："
echo "https://github.com/$REPO/commit/$COMMIT/checks"
echo ""
echo "README (查看徽章状态):"
echo "https://github.com/$REPO"
echo ""
