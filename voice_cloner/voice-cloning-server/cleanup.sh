#!/bin/bash

##############################################
# 环境清理脚本
# 用途: 清理部署相关的所有资源
##############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  语音克隆 API - 环境清理"
echo "=========================================="
echo ""

# 确认清理
read -p "确定要清理环境吗？这将停止所有服务并删除相关资源。(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消清理"
    exit 0
fi

echo ""
echo "开始清理..."
echo ""

# 1. 停止所有运行的服务
echo -e "${BLUE}[1/7]${NC} 停止运行的服务..."
pkill -f 'uvicorn src.api.main:app' 2>/dev/null || true
docker compose -f docker-compose.yml down 2>/dev/null || true
docker compose -f docker-compose.mock.yml down 2>/dev/null || true
echo -e "${GREEN}✓ 服务已停止${NC}"
echo ""

# 2. 删除 Python 虚拟环境
echo -e "${BLUE}[2/7]${NC} 删除 Python 虚拟环境..."
if [ -d "venv" ]; then
    rm -rf venv/
    echo -e "${GREEN}✓ 虚拟环境已删除${NC}"
else
    echo -e "${GREEN}✓ 虚拟环境不存在，跳过${NC}"
fi
echo ""

# 3. 清理 Docker 资源
echo -e "${BLUE}[3/7]${NC} 清理 Docker 资源..."
if command -v docker &> /dev/null; then
    # 停止所有容器
    CONTAINERS=$(docker ps -aq 2>/dev/null)
    if [ ! -z "$CONTAINERS" ]; then
        docker stop $CONTAINERS 2>/dev/null || true
    fi
    
    # 删除项目相关容器
    docker rm voice-cloning-api voice-nginx 2>/dev/null || true
    
    # 删除项目镜像
    docker rmi voice-cloning-server-voice-api 2>/dev/null || true
    docker rmi voice-cloning-api 2>/dev/null || true
    
    # 清理未使用的资源
    docker system prune -f 2>/dev/null || true
    
    echo -e "${GREEN}✓ Docker 资源已清理${NC}"
else
    echo -e "${GREEN}✓ Docker 未安装，跳过${NC}"
fi
echo ""

# 4. 删除日志文件
echo -e "${BLUE}[4/7]${NC} 删除日志文件..."
rm -rf logs/*.log 2>/dev/null || true
rm -f api.log nohup.out 2>/dev/null || true
echo -e "${GREEN}✓ 日志已删除${NC}"
echo ""

# 5. 删除临时文件
echo -e "${BLUE}[5/7]${NC} 删除临时文件..."
rm -f .env.bak .env.production.bak 2>/dev/null || true
rm -f *.pyc 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
rm -f test_embedding.json output_batch.zip 2>/dev/null || true
rm -f output.wav test_audio.wav 2>/dev/null || true
echo -e "${GREEN}✓ 临时文件已删除${NC}"
echo ""

# 6. 清理系统服务（如果配置过）
echo -e "${BLUE}[6/7]${NC} 清理系统服务..."
if [ -f "/etc/systemd/system/voice-api.service" ]; then
    sudo systemctl stop voice-api 2>/dev/null || true
    sudo systemctl disable voice-api 2>/dev/null || true
    sudo rm -f /etc/systemd/system/voice-api.service
    sudo systemctl daemon-reload
    echo -e "${GREEN}✓ 系统服务已删除${NC}"
else
    echo -e "${GREEN}✓ 无系统服务，跳过${NC}"
fi
echo ""

# 7. 显示清理结果
echo -e "${BLUE}[7/7]${NC} 验证清理结果..."
echo ""

# 检查残留进程
if pgrep -f uvicorn > /dev/null; then
    echo -e "${YELLOW}⚠ 警告: 仍有 uvicorn 进程在运行${NC}"
    ps aux | grep "[u]vicorn"
else
    echo -e "${GREEN}✓ 无残留的 Python 服务进程${NC}"
fi

# 检查 Docker 容器
if command -v docker &> /dev/null; then
    CONTAINERS=$(docker ps -a --filter "name=voice" --format "{{.Names}}" 2>/dev/null)
    if [ -z "$CONTAINERS" ]; then
        echo -e "${GREEN}✓ 无残留的 Docker 容器${NC}"
    else
        echo -e "${YELLOW}⚠ 警告: 仍有 Docker 容器${NC}"
        echo "$CONTAINERS"
    fi
fi

# 检查端口占用
if sudo lsof -i :8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 警告: 端口 8000 仍被占用${NC}"
    sudo lsof -i :8000
else
    echo -e "${GREEN}✓ 端口 8000 已释放${NC}"
fi

# 检查磁盘使用
echo ""
echo "当前目录磁盘使用:"
du -sh . 2>/dev/null || echo "无法统计"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ 环境清理完成！${NC}"
echo "=========================================="
echo ""
echo "清理摘要:"
echo "  ✓ 服务已停止"
echo "  ✓ 虚拟环境已删除"
echo "  ✓ Docker 资源已清理"
echo "  ✓ 日志文件已删除"
echo "  ✓ 临时文件已清除"
echo ""
echo "保留的内容:"
echo "  - 源代码（可通过 git 管理）"
echo "  - 配置文件 (.env.production)"
echo "  - 文档和脚本"
echo ""
echo "如需完全删除项目:"
echo "  cd /opt && sudo rm -rf wechat-miniprogram/"
echo ""
echo "如需重新部署:"
echo "  ./deploy_no_docker.sh"
echo ""
