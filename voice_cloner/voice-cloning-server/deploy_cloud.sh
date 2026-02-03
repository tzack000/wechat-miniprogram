#!/bin/bash

#####################################
# 通用 Docker 部署脚本
# 语音克隆 API 服务器
# 支持: Ubuntu 18.04+, Debian 10+
#####################################

set -e  # 遇到错误立即退出

echo "========================================"
echo "语音克隆 API - Docker 部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 函数：打印信息消息
info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 步骤1：检查是否有root权限
echo "步骤 1/11: 检查权限..."
if [[ $EUID -ne 0 ]]; then
   error "此脚本需要 root 权限"
   echo "请使用: sudo $0"
   exit 1
fi
success "权限检查通过"
echo ""

# 步骤2：检测操作系统
echo "步骤 2/11: 检测操作系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    CODENAME=$VERSION_CODENAME
else
    error "无法检测操作系统"
    exit 1
fi

info "操作系统: $OS $VER ($CODENAME)"

# 验证支持的系统
case $OS in
    ubuntu)
        info "检测到 Ubuntu 系统"
        OS_TYPE="ubuntu"
        ;;
    debian)
        info "检测到 Debian 系统"
        OS_TYPE="debian"
        ;;
    *)
        error "不支持的操作系统: $OS"
        echo "支持的系统: Ubuntu 18.04+, Debian 10+"
        exit 1
        ;;
esac
success "系统兼容性检查通过"
echo ""

# 步骤3：检查并安装 Docker
echo "步骤 3/11: 检查 Docker..."
if ! command -v docker &> /dev/null; then
    warning "Docker 未安装，开始安装..."
    
    # 卸载旧版本
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # 更新包索引
    info "更新包索引..."
    apt-get update
    
    # 安装依赖
    info "安装依赖包..."
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # 添加 Docker 官方 GPG 密钥
    info "添加 Docker GPG 密钥..."
    mkdir -p /etc/apt/keyrings
    
    if [ "$OS_TYPE" = "ubuntu" ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        DOCKER_REPO="https://download.docker.com/linux/ubuntu"
    else
        curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        DOCKER_REPO="https://download.docker.com/linux/debian"
    fi
    
    # 设置仓库
    info "配置 Docker 仓库..."
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] $DOCKER_REPO \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 设置权限
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # 安装 Docker Engine
    info "安装 Docker Engine..."
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    success "Docker 安装完成"
else
    success "Docker 已安装: $(docker --version)"
fi
echo ""

# 步骤4：启动 Docker 服务
echo "步骤 4/11: 启动 Docker 服务..."
systemctl start docker
systemctl enable docker
success "Docker 服务已启动"
echo ""

# 步骤5：检查并安装 Docker Compose
echo "步骤 5/11: 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    warning "Docker Compose 未安装，开始安装..."
    
    # 下载 Docker Compose
    info "下载 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建符号链接（兼容性）
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose 2>/dev/null || true
    
    success "Docker Compose 安装完成"
else
    success "Docker Compose 已安装: $(docker-compose --version)"
fi
echo ""

# 步骤6：验证 Docker 安装
echo "步骤 6/11: 验证 Docker 安装..."
if docker run --rm hello-world > /dev/null 2>&1; then
    success "Docker 运行正常"
else
    warning "Docker 测试失败，但继续部署..."
fi
echo ""

# 步骤7：配置防火墙
echo "步骤 7/11: 配置防火墙..."
if command -v ufw &> /dev/null; then
    # 开放必要端口
    ufw allow 8000/tcp  # API 端口
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 22/tcp    # SSH
    
    # 如果 UFW 未启动，则启动
    ufw --force enable
    
    success "防火墙配置完成"
elif command -v firewall-cmd &> /dev/null; then
    # FirewallD (CentOS/RHEL)
    firewall-cmd --permanent --add-port=8000/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    success "防火墙配置完成 (FirewallD)"
else
    warning "未检测到防火墙工具，请手动配置"
fi
echo ""

# 步骤8：创建必要的目录
echo "步骤 8/11: 创建目录结构..."
mkdir -p logs
mkdir -p models/encoder
mkdir -p models/synthesizer
mkdir -p models/vocoder
success "目录创建完成"
echo ""

# 步骤9：检查环境配置文件
echo "步骤 9/11: 检查环境配置..."
if [ ! -f .env.production ]; then
    error ".env.production 文件不存在"
    echo "正在创建默认配置文件..."
    
    # 生成随机 API_KEY
    RANDOM_KEY=$(openssl rand -base64 32)
    
    cat > .env.production << EOF
# 生产环境配置
# 自动生成于 $(date)

# API 服务器配置
API_HOST=0.0.0.0
API_PORT=8000

# 模型路径（模拟模式下不需要真实模型文件）
MODEL_ENCODER_PATH=models/encoder/encoder.pt
MODEL_SYNTHESIZER_PATH=models/synthesizer/synthesizer.pt
MODEL_VOCODER_PATH=models/vocoder/vocoder.pt

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/api.log

# 性能配置
MAX_WORKERS=4
ENABLE_GPU=false

# 安全配置 - 生产环境必须修改
API_KEY=$RANDOM_KEY
ALLOWED_ORIGINS=*
EOF
    
    success "已创建默认配置文件"
    warning "请检查并修改 .env.production 中的配置"
else
    success "环境配置文件存在"
fi
echo ""

# 步骤10：停止并移除旧容器
echo "步骤 10/11: 清理旧容器..."
docker-compose down 2>/dev/null || true
docker rm -f voice-cloning-api 2>/dev/null || true
success "旧容器已清理"
echo ""

# 步骤11：构建并启动服务
echo "步骤 11/11: 构建并启动服务..."
info "构建 Docker 镜像（这可能需要几分钟）..."
docker-compose build

info "启动服务..."
docker-compose up -d

success "服务已启动"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 15

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
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTH_CHECK=$(curl -s http://localhost:8000/health 2>/dev/null || echo "")
    
    if [ -n "$HEALTH_CHECK" ]; then
        echo "$HEALTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_CHECK"
        success "健康检查通过"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            warning "健康检查失败，重试 $RETRY_COUNT/$MAX_RETRIES..."
            sleep 3
        else
            error "健康检查失败"
            echo "请检查容器日志: docker-compose logs"
        fi
    fi
done
echo ""

# 获取服务器公网IP
echo "========================================"
echo "部署信息:"
echo "========================================"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://ifconfig.me 2>/dev/null || echo "无法获取公网IP")
echo "操作系统: $OS $VER"
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
echo "进入容器: docker exec -it voice-cloning-api bash"
echo ""

success "部署完成！"
echo ""
warning "重要提示:"
echo "1. 请在云服务商控制台配置安全组，开放 8000 端口"
echo "2. API_KEY 已随机生成，请查看 .env.production"
echo "3. 建议配置 Nginx 反向代理和 HTTPS"
echo "4. 定期备份日志和数据"
echo "5. 从外网测试: curl http://$PUBLIC_IP:8000/health"
echo ""

# 显示 API_KEY
if [ -f .env.production ]; then
    API_KEY=$(grep "^API_KEY=" .env.production | cut -d'=' -f2)
    if [ -n "$API_KEY" ] && [ "$API_KEY" != "your-production-secret-key-here" ]; then
        echo "========================================"
        echo "API 认证密钥 (请妥善保管):"
        echo "========================================"
        echo "$API_KEY"
        echo ""
    fi
fi
