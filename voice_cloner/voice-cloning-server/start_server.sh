#!/bin/bash

# 语音克隆 API 服务器 - 启动脚本

echo "======================================"
echo "语音克隆 API 服务器"
echo "======================================"
echo ""

# 检查虚拟环境
if [ -d "venv" ]; then
    echo "检测到虚拟环境，正在激活..."
    source venv/bin/activate
    echo "✓ 虚拟环境已激活"
    echo ""
fi

# 检查环境配置
if [ ! -f ".env" ]; then
    echo "警告: 未找到 .env 文件"
    echo "使用默认配置启动..."
    echo ""
fi

# 检查日志目录
if [ ! -d "logs" ]; then
    echo "创建日志目录..."
    mkdir -p logs
    echo "✓ 日志目录已创建"
    echo ""
fi

# 加载环境变量
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 获取配置
HOST=${API_HOST:-0.0.0.0}
PORT=${API_PORT:-8000}

echo "服务器配置:"
echo "  地址: http://$HOST:$PORT"
echo "  文档: http://$HOST:$PORT/docs"
echo "  模式: Mock (模拟)"
echo ""

echo "======================================"
echo "启动服务器..."
echo "======================================"
echo ""

# 启动服务器
cd src/api
python main.py

# 或者使用 uvicorn 启动
# uvicorn main:app --host $HOST --port $PORT --reload
