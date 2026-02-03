#!/bin/bash

#####################################
# Docker 环境清理和修复脚本
# 清理旧的 Ubuntu 仓库配置
# 重新安装 Docker (Debian)
#####################################

set -e

echo "========================================"
echo "Docker 环境清理和修复"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查 root 权限
if [[ $EUID -ne 0 ]]; then
   error "此脚本需要 root 权限"
   echo "请使用: sudo $0"
   exit 1
fi

echo "步骤 1/6: 停止 Docker 服务..."
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true
success "Docker 服务已停止"
echo ""

echo "步骤 2/6: 卸载旧版本 Docker..."
apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>/dev/null || true
apt-get purge -y docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>/dev/null || true
apt-get autoremove -y
success "旧版本已卸载"
echo ""

echo "步骤 3/6: 清理 Docker 仓库配置..."
# 删除所有 Docker 相关的仓库文件
rm -f /etc/apt/sources.list.d/docker.list
rm -f /etc/apt/sources.list.d/docker.list.save
rm -f /etc/apt/sources.list.d/archive_uri-*
# 清理 GPG 密钥
rm -rf /etc/apt/keyrings/docker.gpg
rm -rf /usr/share/keyrings/docker-archive-keyring.gpg
# 清理 APT 缓存
apt-get clean
rm -rf /var/lib/apt/lists/*
success "仓库配置已清理"
echo ""

echo "步骤 4/6: 检测系统类型..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "操作系统: $ID $VERSION_ID"
    echo "代号: $VERSION_CODENAME"
    
    if [ "$ID" != "debian" ]; then
        warning "警告: 检测到非 Debian 系统: $ID"
        echo "此脚本针对 Debian 优化，继续执行可能有问题"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    error "无法检测操作系统"
    exit 1
fi
success "系统检测完成"
echo ""

echo "步骤 5/6: 安装 Docker (Debian)..."
# 更新包索引
apt-get update

# 安装依赖
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 创建密钥目录
mkdir -p /etc/apt/keyrings

# 下载 Docker GPG 密钥 (Debian)
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置权限
chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库 (Debian)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新包索引
apt-get update

# 安装 Docker
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

success "Docker 安装完成"
echo ""

echo "步骤 6/6: 验证安装..."
# 启动 Docker
systemctl start docker
systemctl enable docker

# 检查版本
echo "Docker 版本: $(docker --version)"

# 测试 Docker
if docker run --rm hello-world > /dev/null 2>&1; then
    success "Docker 运行正常"
else
    error "Docker 测试失败"
    exit 1
fi

# 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

echo "Docker Compose 版本: $(docker-compose --version)"
success "验证完成"
echo ""

echo "========================================"
echo "Docker 环境修复完成！"
echo "========================================"
echo ""
echo "现在可以运行部署脚本:"
echo "  cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server"
echo "  sudo ./deploy_cloud.sh"
echo ""
