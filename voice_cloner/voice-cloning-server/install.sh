#!/bin/bash

# 语音克隆 API 服务器 - 安装脚本

echo "======================================"
echo "语音克隆 API 服务器 - 安装依赖"
echo "======================================"
echo ""

# 检查 Python 版本
echo "检查 Python 版本..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python 版本: $python_version"

if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo "错误: 需要 Python 3.8 或更高版本"
    exit 1
fi

echo "✓ Python 版本检查通过"
echo ""

# 创建虚拟环境（可选）
read -p "是否创建虚拟环境？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
    echo "✓ 虚拟环境创建完成"
    echo ""
    echo "激活虚拟环境..."
    source venv/bin/activate
    echo "✓ 虚拟环境已激活"
    echo ""
fi

# 升级 pip
echo "升级 pip..."
pip install --upgrade pip
echo "✓ pip 升级完成"
echo ""

# 安装依赖
echo "安装依赖包..."
pip install -r requirements.txt
echo "✓ 依赖包安装完成"
echo ""

# 创建必要的目录
echo "创建目录结构..."
mkdir -p models/encoder
mkdir -p models/synthesizer
mkdir -p models/vocoder
mkdir -p logs
echo "✓ 目录创建完成"
echo ""

# 复制环境配置文件
if [ ! -f .env ]; then
    echo "创建环境配置文件..."
    cp .env.example .env 2>/dev/null || echo "警告: 未找到 .env.example，请手动创建 .env 文件"
    echo "✓ 环境配置文件已创建"
else
    echo "✓ 环境配置文件已存在"
fi
echo ""

# 创建 __init__.py 文件
echo "创建 Python 模块文件..."
touch src/__init__.py
touch src/api/__init__.py
touch src/encoder/__init__.py
touch src/synthesizer/__init__.py
touch src/vocoder/__init__.py
echo "✓ Python 模块文件创建完成"
echo ""

echo "======================================"
echo "✓ 安装完成！"
echo "======================================"
echo ""
echo "下一步操作:"
echo "1. 编辑 .env 文件配置环境变量"
echo "2. （可选）下载真实的 AI 模型文件放到 models/ 目录"
echo "3. 运行 ./start_server.sh 启动服务器"
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "提示: 记得激活虚拟环境:"
    echo "  source venv/bin/activate"
    echo ""
fi
