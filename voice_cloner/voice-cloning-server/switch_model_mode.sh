#!/bin/bash

##############################################
# Mock 模式和真实模型快速切换脚本
# 使用方法: 
#   ./switch_model_mode.sh mock   # 切换到 Mock 模式
#   ./switch_model_mode.sh real   # 切换到真实模型
##############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE=$1

if [ -z "$MODE" ]; then
    echo -e "${RED}错误: 请指定模式${NC}"
    echo "使用方法:"
    echo "  $0 mock   # 切换到 Mock 模式"
    echo "  $0 real   # 切换到真实模型"
    exit 1
fi

if [[ "$MODE" != "mock" && "$MODE" != "real" ]]; then
    echo -e "${RED}错误: 模式必须是 'mock' 或 'real'${NC}"
    exit 1
fi

echo "=================================="
echo "语音克隆模型模式切换"
echo "=================================="
echo ""

# 检查配置文件
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}错误: 配置文件不存在: $ENV_FILE${NC}"
    exit 1
fi

# 如果切换到真实模型，检查模型文件
if [ "$MODE" = "real" ]; then
    echo "检查模型文件..."
    
    MODELS=(
        "models/encoder/encoder.pt"
        "models/synthesizer/synthesizer.pt"
        "models/vocoder/vocoder.pt"
    )
    
    MISSING_MODELS=()
    
    for model in "${MODELS[@]}"; do
        if [ ! -f "$model" ]; then
            MISSING_MODELS+=("$model")
        else
            size=$(stat -f%z "$model" 2>/dev/null || stat -c%s "$model" 2>/dev/null)
            echo -e "  ${GREEN}✓${NC} $model ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes"))"
        fi
    done
    
    if [ ${#MISSING_MODELS[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}错误: 以下模型文件缺失:${NC}"
        for model in "${MISSING_MODELS[@]}"; do
            echo -e "  ${RED}✗${NC} $model"
        done
        echo ""
        echo "请先下载模型:"
        echo "  ./download_models_from_cos.sh"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 所有模型文件就绪${NC}"
    echo ""
fi

# 备份配置文件
echo "备份配置文件..."
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ 配置已备份${NC}"
echo ""

# 更新配置
echo "更新配置文件..."

if grep -q "^MODEL_MODE=" "$ENV_FILE"; then
    # 存在则替换
    sed -i.tmp "s/^MODEL_MODE=.*/MODEL_MODE=$MODE/" "$ENV_FILE"
else
    # 不存在则添加
    echo "" >> "$ENV_FILE"
    echo "# 模型模式" >> "$ENV_FILE"
    echo "MODEL_MODE=$MODE" >> "$ENV_FILE"
fi

rm -f "${ENV_FILE}.tmp"

echo -e "${GREEN}✓ 配置已更新: MODEL_MODE=$MODE${NC}"
echo ""

# 显示差异
echo "当前配置:"
echo "----------------------------------------"
grep "MODEL_MODE\|MODEL_.*_PATH\|ENABLE_GPU" "$ENV_FILE" || echo "(无相关配置)"
echo "----------------------------------------"
echo ""

# 询问是否重启服务
echo -e "${YELLOW}需要重启 Docker 服务以应用更改${NC}"
read -p "是否现在重启服务? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "重启服务..."
    echo "----------------------------------------"
    
    # 停止服务
    echo "1. 停止当前服务..."
    docker compose down
    
    # 如果是真实模型，可能需要重新构建
    if [ "$MODE" = "real" ]; then
        echo ""
        echo "2. 重新构建镜像（真实模型需要更多依赖）..."
        docker compose build
    fi
    
    echo ""
    echo "3. 启动服务..."
    docker compose up -d
    
    echo ""
    echo "4. 等待服务就绪..."
    sleep 10
    
    echo ""
    echo "5. 健康检查..."
    if curl -f http://localhost:8000/health 2>/dev/null; then
        echo -e "${GREEN}✓ 服务运行正常${NC}"
        
        echo ""
        echo "查看日志:"
        docker compose logs --tail=20
    else
        echo -e "${RED}✗ 服务健康检查失败${NC}"
        echo "请查看日志: docker compose logs -f"
    fi
    
    echo "----------------------------------------"
else
    echo ""
    echo "跳过重启。请手动执行:"
    echo "  docker compose down"
    if [ "$MODE" = "real" ]; then
        echo "  docker compose build  # 真实模型需要重新构建"
    fi
    echo "  docker compose up -d"
fi

echo ""
echo "=================================="
if [ "$MODE" = "mock" ]; then
    echo -e "${GREEN}✓ 已切换到 Mock 模式${NC}"
    echo ""
    echo "Mock 模式特点:"
    echo "  - ✅ 无需模型文件"
    echo "  - ✅ 低资源占用"
    echo "  - ✅ 快速响应"
    echo "  - ❌ 输出假数据（正弦波）"
    echo ""
    echo "适用场景:"
    echo "  - API 接口测试"
    echo "  - 前端联调"
    echo "  - 原型演示"
else
    echo -e "${GREEN}✓ 已切换到真实模型${NC}"
    echo ""
    echo "真实模型特点:"
    echo "  - ✅ 高质量语音输出"
    echo "  - ✅ 真实的声音克隆"
    echo "  - ⚠️  需要较多资源（RAM: 4GB+）"
    echo "  - ⚠️  推理速度较慢（无 GPU）"
    echo ""
    echo "适用场景:"
    echo "  - 生产环境"
    echo "  - 真实用户使用"
    echo ""
    if ! command -v nvidia-smi &> /dev/null; then
        echo -e "${YELLOW}提示: 未检测到 GPU，将使用 CPU 推理（较慢）${NC}"
        echo "如需加速，请考虑使用腾讯云 GPU 实例"
    else
        echo -e "${GREEN}检测到 GPU，推理性能将得到提升${NC}"
    fi
fi
echo "=================================="
