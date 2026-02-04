#!/bin/bash

##############################################
# 无 Docker 快速部署脚本
# 适用于: 1GB 及以上内存的服务器
# 特点: 无需 Docker，直接用 Python 运行
##############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  语音克隆 API - 无 Docker 快速部署"
echo "  适用于: 低配服务器（1GB+）"
echo "  模式: Mock 模式（轻量级）"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "requirements.mock.txt" ]; then
    echo -e "${RED}错误: 请在项目目录下运行此脚本${NC}"
    echo "cd /opt/wechat-miniprogram/voice_cloner/voice-cloning-server"
    exit 1
fi

# 检查系统资源
echo "检查系统资源..."
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "  总内存: ${TOTAL_MEM}MB"

if [ $TOTAL_MEM -lt 800 ]; then
    echo -e "${YELLOW}警告: 可用内存不足 1GB${NC}"
fi
echo ""

# 步骤 1: 停止旧服务
echo -e "${BLUE}[1/6]${NC} 停止旧服务..."
pkill -f "uvicorn src.api.main:app" 2>/dev/null || true
echo -e "${GREEN}✓ 旧服务已停止${NC}"
echo ""

# 步骤 2: 拉取最新代码
echo -e "${BLUE}[2/6]${NC} 拉取最新代码..."
git pull || {
    echo -e "${YELLOW}git pull 失败，继续使用当前代码...${NC}"
}
echo ""

# 步骤 3: 安装 Python 和依赖
echo -e "${BLUE}[3/6]${NC} 检查 Python 环境..."

# 检查 Python 3.9
if ! command -v python3.9 &> /dev/null; then
    echo "Python 3.9 未安装，尝试安装..."
    
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y python3.9 python3.9-venv python3-pip
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y python39 python39-pip
    else
        echo -e "${RED}无法自动安装 Python 3.9，请手动安装${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Python 已就绪${NC}"
echo ""

# 步骤 4: 创建虚拟环境和安装依赖
echo -e "${BLUE}[4/6]${NC} 安装 Python 依赖..."

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3.9 -m venv venv
fi

source venv/bin/activate

echo "安装依赖包（使用阿里云镜像）..."
pip install --upgrade pip -q
pip install -r requirements.mock.txt \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com \
    -q

echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 步骤 5: 配置环境变量
echo -e "${BLUE}[5/6]${NC} 配置环境变量..."

if [ ! -f ".env" ]; then
    cp .env.production .env
fi

# 生成 API_KEY
API_KEY=$(openssl rand -base64 32)
sed -i.bak "s|API_KEY=.*|API_KEY=$API_KEY|" .env

# 确保是 Mock 模式
if ! grep -q "^MODEL_MODE=" .env; then
    echo "MODEL_MODE=mock" >> .env
else
    sed -i.bak "s|MODEL_MODE=.*|MODEL_MODE=mock|" .env
fi

echo -e "${GREEN}✓ 配置完成${NC}"
echo "  API_KEY: $API_KEY"
echo ""

# 步骤 6: 启动服务
echo -e "${BLUE}[6/6]${NC} 启动服务..."

# 创建日志目录
mkdir -p logs

# 启动服务（后台运行）
nohup venv/bin/uvicorn src.api.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    > logs/api.log 2>&1 &

SERVICE_PID=$!
echo "服务 PID: $SERVICE_PID"

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务状态
if ps -p $SERVICE_PID > /dev/null; then
    echo -e "${GREEN}✓ 服务已启动${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    echo "查看日志: tail -f logs/api.log"
    exit 1
fi
echo ""

# 健康检查
echo "=========================================="
echo "  部署结果"
echo "=========================================="
echo ""

echo "健康检查..."
sleep 3

if curl -f http://localhost:8000/health 2>/dev/null; then
    echo -e "${GREEN}✓ 服务运行正常${NC}"
    echo ""
    
    # 显示服务信息
    echo "=========================================="
    echo "  服务信息"
    echo "=========================================="
    echo ""
    
    # 获取公网 IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "获取失败")
    
    echo "本地访问:"
    echo "  API 地址: http://localhost:8000"
    echo "  API 文档: http://localhost:8000/docs"
    echo "  健康检查: http://localhost:8000/health"
    echo ""
    
    if [ "$PUBLIC_IP" != "获取失败" ]; then
        echo "公网访问（需配置安全组开放 8000 端口）:"
        echo "  API 地址: http://$PUBLIC_IP:8000"
        echo "  API 文档: http://$PUBLIC_IP:8000/docs"
        echo ""
    fi
    
    echo "API_KEY: $API_KEY"
    echo ""
    
    echo "内存占用:"
    ps aux | grep "[u]vicorn src.api.main:app" | awk '{printf "  进程: %s, 内存: %s MB\n", $2, $6/1024}'
    echo ""
    
    echo "模式: Mock 模式（轻量级）"
    echo "  - ✅ 快速响应"
    echo "  - ✅ 低资源占用（~200MB）"
    echo "  - ❌ 输出模拟数据（用于测试）"
    echo ""
    
    echo "=========================================="
    echo "  管理命令"
    echo "=========================================="
    echo ""
    echo "查看日志:"
    echo "  tail -f logs/api.log"
    echo ""
    echo "查看进程:"
    echo "  ps aux | grep uvicorn"
    echo ""
    echo "停止服务:"
    echo "  pkill -f 'uvicorn src.api.main:app'"
    echo ""
    echo "重启服务:"
    echo "  pkill -f 'uvicorn src.api.main:app'"
    echo "  nohup venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 1 > logs/api.log 2>&1 &"
    echo ""
    echo "设置开机自启:"
    echo "  ./setup_systemd.sh"
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo "=========================================="
else
    echo -e "${RED}✗ 服务健康检查失败${NC}"
    echo ""
    echo "查看错误日志:"
    echo "  tail -f logs/api.log"
    echo ""
    echo "手动启动测试:"
    echo "  source venv/bin/activate"
    echo "  uvicorn src.api.main:app --host 0.0.0.0 --port 8000"
    echo ""
    exit 1
fi
