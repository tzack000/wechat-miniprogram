#!/bin/bash

#####################################
# Docker 安装脚本 - 使用国内镜像源
# 专为中国大陆网络环境优化
#####################################

set -e

echo "========================================"
echo "Docker 安装 (国内镜像源)"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✓ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${BLUE}ℹ $1${NC}"; }

# 检查 root 权限
if [[ $EUID -ne 0 ]]; then
   error "此脚本需要 root 权限"
   echo "请使用: sudo $0"
   exit 1
fi

echo "步骤 1/8: 检测系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    info "系统: $ID $VERSION_ID ($VERSION_CODENAME)"
else
    error "无法检测操作系统"
    exit 1
fi
success "系统检测完成"
echo ""

echo "步骤 2/8: 清理环境..."
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true
apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>/dev/null || true
rm -f /etc/apt/sources.list.d/docker.list*
rm -rf /etc/apt/keyrings/docker.gpg
apt-get clean
rm -rf /var/lib/apt/lists/*
success "环境清理完成"
echo ""

echo "步骤 3/8: 更新系统..."
apt-get update
success "系统更新完成"
echo ""

echo "步骤 4/8: 安装依赖..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common
success "依赖安装完成"
echo ""

echo "步骤 5/8: 配置 Docker 仓库 (使用阿里云镜像)..."
mkdir -p /etc/apt/keyrings

# 尝试使用多个镜像源
info "尝试从阿里云下载 GPG 密钥..."
if curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null; then
    info "使用阿里云镜像源"
    DOCKER_REPO="https://mirrors.aliyun.com/docker-ce/linux/debian"
    success "GPG 密钥下载成功 (阿里云)"
elif curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null; then
    info "使用清华大学镜像源"
    DOCKER_REPO="https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian"
    success "GPG 密钥下载成功 (清华)"
elif curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null; then
    info "使用中科大镜像源"
    DOCKER_REPO="https://mirrors.ustc.edu.cn/docker-ce/linux/debian"
    success "GPG 密钥下载成功 (中科大)"
else
    warning "国内镜像源均失败，尝试官方源..."
    if curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null; then
        DOCKER_REPO="https://download.docker.com/linux/debian"
        success "GPG 密钥下载成功 (官方)"
    else
        error "所有源均失败，无法下载 GPG 密钥"
        echo ""
        echo "可能的原因:"
        echo "1. 网络连接问题"
        echo "2. 防火墙限制"
        echo "3. DNS 解析问题"
        echo ""
        echo "请尝试:"
        echo "1. 检查网络连接: ping -c 3 mirrors.aliyun.com"
        echo "2. 检查防火墙设置"
        echo "3. 使用方案2: Docker 官方便捷脚本"
        exit 1
    fi
fi

chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] $DOCKER_REPO \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

info "Docker 仓库: $DOCKER_REPO"
success "Docker 仓库配置完成"
echo ""

echo "步骤 6/8: 安装 Docker..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
success "Docker 安装完成"
echo ""

echo "步骤 7/8: 配置 Docker..."
# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 配置 Docker 镜像加速 (可选)
if [ ! -f /etc/docker/daemon.json ]; then
    info "配置 Docker 镜像加速..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    systemctl daemon-reload
    systemctl restart docker
    success "镜像加速配置完成"
fi
echo ""

echo "步骤 8/8: 验证安装..."
echo "Docker 版本: $(docker --version)"

# 测试 Docker
info "测试 Docker (使用国内镜像)..."
if docker run --rm registry.cn-hangzhou.aliyuncs.com/library/hello-world > /dev/null 2>&1; then
    success "Docker 运行正常"
elif docker run --rm hello-world > /dev/null 2>&1; then
    success "Docker 运行正常"
else
    warning "Docker 测试失败，但安装已完成"
fi

# 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    info "安装 Docker Compose..."
    
    # 尝试从多个源下载
    COMPOSE_VERSION="v2.24.0"
    COMPOSE_INSTALLED=false
    
    # 尝试从 GitHub 镜像下载
    if curl -L "https://ghproxy.com/https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null; then
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        COMPOSE_INSTALLED=true
        info "Docker Compose 已安装 (GitHub 镜像)"
    fi
    
    # 尝试从官方源下载
    if [ "$COMPOSE_INSTALLED" = false ]; then
        if curl -L "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null; then
            chmod +x /usr/local/bin/docker-compose
            ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
            COMPOSE_INSTALLED=true
            info "Docker Compose 已安装 (官方源)"
        fi
    fi
    
    if [ "$COMPOSE_INSTALLED" = false ]; then
        warning "Docker Compose 下载失败，将使用 docker compose (插件版)"
    fi
fi

if command -v docker-compose &> /dev/null; then
    echo "Docker Compose 版本: $(docker-compose --version)"
else
    echo "Docker Compose 插件版本: $(docker compose version)"
fi

success "验证完成"
echo ""

echo "========================================"
echo "Docker 安装成功！"
echo "========================================"
echo ""
echo "Docker 信息:"
echo "  版本: $(docker --version)"
echo "  镜像源: $DOCKER_REPO"
echo "  状态: $(systemctl is-active docker)"
echo ""
echo "下一步:"
echo "  cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server"
echo "  docker-compose build"
echo "  docker-compose up -d"
echo ""
