#!/bin/bash

#####################################
# 腾讯云服务器 Docker 部署脚本
# 语音克隆 API 服务器
#####################################

set -e  # 遇到错误立即退出

echo "========================================"
echo "语音克隆 API - 腾讯云 Docker 部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印成功消息
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 函数：打印警告消息
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 函数：打印错误消息
error() {
    echo -e "${RED}✗ $1${NC}"
}

# 步骤1：检查是否有root权限
echo "步骤 1/10: 检查权限..."
if [[ $EUID -ne 0 ]]; then
   error "此脚本需要 root 权限"
   echo "请使用: sudo $0"
   exit 1
fi
success "权限检查通过"
echo ""

# 步骤2：检查并安装 Docker
echo "步骤 2/10: 检查 Docker..."
if ! command -v docker &> /dev/null; then
    warning "Docker 未安装，开始安装..."
    
    # 卸载旧版本
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # 更新包索引
    apt-get update
    
    # 安装依赖
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # 添加 Docker 官方 GPG 密钥
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # 设置仓库
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装 Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    success "Docker 安装完成"
else
    success "Docker 已安装: $(docker --version)"
fi
echo ""

# 步骤3：启动 Docker 服务
echo "步骤 3/10: 启动 Docker 服务..."
systemctl start docker
systemctl enable docker
success "Docker 服务已启动"
echo ""

# 步骤4：检查并安装 Docker Compose
echo "步骤 4/10: 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    warning "Docker Compose 未安装，开始安装..."
    
    # 下载 Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    success "Docker Compose 安装完成"
else
    success "Docker Compose 已安装: $(docker-compose --version)"
fi
echo ""

# 步骤5：配置防火墙
echo "步骤 5/10: 配置防火墙..."
if command -v ufw &> /dev/null; then
    # 开放必要端口
    ufw allow 8000/tcp  # API 端口
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 22/tcp    # SSH
    
    # 如果 UFW 未启动，则启动
    ufw --force enable
    
    success "防火墙配置完成"
else
    warning "UFW 未安装，请手动配置防火墙"
fi
echo ""

# 步骤6：创建必要的目录
echo "步骤 6/10: 创建目录结构..."
mkdir -p logs
mkdir -p models/encoder
mkdir -p models/synthesizer
mkdir -p models/vocoder
success "目录创建完成"
echo ""

# 步骤7：检查环境配置文件
echo "步骤 7/10: 检查环境配置..."
if [ ! -f .env.production ]; then
    error ".env.production 文件不存在"
    echo "请先创建 .env.production 文件并配置生产环境变量"
    exit 1
fi
success "环境配置文件存在"
echo ""

# 步骤8：停止并移除旧容器
echo "步骤 8/10: 清理旧容器..."
docker-compose down 2>/dev/null || true
docker rm -f voice-cloning-api 2>/dev/null || true
success "旧容器已清理"
echo ""

# 步骤9：构建 Docker 镜像
echo "步骤 9/10: 构建 Docker 镜像..."
docker build -t voice-cloning-api:latest .
success "Docker 镜像构建完成"
echo ""

# 步骤10：启动容器
echo "步骤 10/10: 启动服务..."
docker-compose up -d
success "服务已启动"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查容器状态
echo ""
echo "========================================"
echo "容器状态:"
echo "========================================"
docker-compose ps
echo ""

# 检查健康状态
echo "========================================"
echo "健康检查:"
echo "========================================"
HEALTH_CHECK=$(curl -s http://localhost:8000/health || echo "failed")
echo "$HEALTH_CHECK"
echo ""

# 获取服务器公网IP
echo "========================================"
echo "部署信息:"
echo "========================================"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "无法获取公网IP")
echo "公网IP: $PUBLIC_IP"
echo "API地址: http://$PUBLIC_IP:8000"
echo "API文档: http://$PUBLIC_IP:8000/docs"
echo "健康检查: http://$PUBLIC_IP:8000/health"
echo ""

# 显示日志命令
echo "========================================"
echo "常用命令:"
echo "========================================"
echo "查看日志: docker-compose logs -f"
echo "查看容器状态: docker-compose ps"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart"
echo "查看实时日志: docker logs -f voice-cloning-api"
echo ""

success "部署完成！"
echo ""
warning "重要提示:"
echo "1. 请在腾讯云控制台配置安全组，开放 8000 端口"
echo "2. 请修改 .env.production 中的 API_KEY"
echo "3. 建议配置 Nginx 反向代理和 HTTPS"
echo "4. 定期备份日志和数据"
echo ""
