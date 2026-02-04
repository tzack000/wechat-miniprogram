#!/bin/bash

##############################################
# 低配服务器（2核1GB）快速部署脚本
# Mock 模式专用 - 轻量级版本
##############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  语音克隆 API - 低配服务器快速部署"
echo "  适用于: 2核1GB 服务器"
echo "  模式: Mock 模式（轻量级）"
echo "=========================================="
echo ""

# 检查系统资源
echo "检查系统资源..."
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
CPU_CORES=$(nproc)

echo "  CPU 核心数: $CPU_CORES"
echo "  总内存: ${TOTAL_MEM}MB"

if [ $TOTAL_MEM -lt 900 ]; then
    echo -e "${RED}警告: 可用内存不足 1GB，可能导致构建失败${NC}"
    echo "建议:"
    echo "  1. 关闭其他服务释放内存"
    echo "  2. 创建 swap 交换空间"
    read -p "是否继续? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 步骤 1: 拉取最新代码
echo -e "${BLUE}[1/6]${NC} 拉取最新代码..."
git pull || {
    echo -e "${RED}git pull 失败，尝试重置...${NC}"
    git fetch origin
    git reset --hard origin/main
}
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

# 步骤 2: 安装 Docker
echo -e "${BLUE}[2/6]${NC} 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，开始安装..."
    chmod +x install_docker_china.sh
    sudo ./install_docker_china.sh
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi
echo ""

# 步骤 3: 配置 API_KEY
echo -e "${BLUE}[3/6]${NC} 配置 API_KEY..."
if [ ! -f .env.production ]; then
    echo -e "${RED}.env.production 不存在${NC}"
    exit 1
fi

API_KEY=$(openssl rand -base64 32)
sed -i.bak "s|API_KEY=.*|API_KEY=$API_KEY|" .env.production
echo -e "${GREEN}✓ API_KEY 已生成${NC}"
echo "  API_KEY: $API_KEY"
echo ""

# 步骤 4: 清理旧容器和镜像（释放空间）
echo -e "${BLUE}[4/6]${NC} 清理旧资源..."
docker compose -f docker-compose.mock.yml down 2>/dev/null || true
docker system prune -f
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 步骤 5: 构建镜像（轻量级）
echo -e "${BLUE}[5/6]${NC} 构建 Docker 镜像（轻量级 Mock 版本）..."
echo "  注意: 这将需要 2-3 分钟，请耐心等待..."
echo ""

# 使用轻量级配置构建
if docker compose -f docker-compose.mock.yml build --no-cache; then
    echo ""
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo ""
    echo -e "${RED}✗ 镜像构建失败${NC}"
    echo ""
    echo "可能的原因:"
    echo "  1. 内存不足 - 尝试创建 swap 空间"
    echo "  2. 网络问题 - 检查网络连接"
    echo "  3. 磁盘空间不足 - 清理磁盘空间"
    echo ""
    echo "建议操作:"
    echo "  # 创建 2GB swap 空间"
    echo "  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048"
    echo "  sudo chmod 600 /swapfile"
    echo "  sudo mkswap /swapfile"
    echo "  sudo swapon /swapfile"
    echo ""
    exit 1
fi
echo ""

# 步骤 6: 启动服务
echo -e "${BLUE}[6/6]${NC} 启动服务..."
docker compose -f docker-compose.mock.yml up -d

echo "等待服务启动..."
sleep 15
echo ""

# 检查服务状态
echo "=========================================="
echo "  部署结果"
echo "=========================================="
echo ""

echo "服务状态:"
docker compose -f docker-compose.mock.yml ps
echo ""

echo "健康检查:"
if curl -f http://localhost:8000/health 2>/dev/null; then
    echo -e "${GREEN}✓ 服务运行正常${NC}"
    echo ""
    
    # 显示服务信息
    echo "=========================================="
    echo "  服务信息"
    echo "=========================================="
    echo ""
    echo "API 地址: http://localhost:8000"
    echo "API 文档: http://localhost:8000/docs"
    echo "健康检查: http://localhost:8000/health"
    echo ""
    echo "API_KEY: $API_KEY"
    echo ""
    echo "模式: Mock 模式（轻量级）"
    echo "  - ✅ 快速响应"
    echo "  - ✅ 低资源占用"
    echo "  - ❌ 输出模拟数据（用于测试）"
    echo ""
    echo "查看日志:"
    echo "  docker compose -f docker-compose.mock.yml logs -f"
    echo ""
    echo "停止服务:"
    echo "  docker compose -f docker-compose.mock.yml down"
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo "=========================================="
else
    echo -e "${RED}✗ 服务健康检查失败${NC}"
    echo ""
    echo "查看错误日志:"
    echo "  docker compose -f docker-compose.mock.yml logs --tail=50"
    echo ""
    exit 1
fi
