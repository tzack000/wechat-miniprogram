#!/bin/bash

##############################################
# 从腾讯云 COS 下载语音克隆模型
# 使用方法: ./download_models_from_cos.sh
##############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "语音克隆模型下载工具"
echo "=================================="
echo ""

# 配置 COS 地址（需要替换为您的实际地址）
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
COS_BASE_URL="https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com"

# 如果是在腾讯云内网，使用内网地址（免流量费）
if ping -c 1 -W 1 metadata.tencentyun.com &> /dev/null; then
    echo -e "${GREEN}检测到腾讯云内网环境，使用内网地址下载${NC}"
    COS_BASE_URL="https://${COS_BUCKET}.cos-internal.${COS_REGION}.myqcloud.com"
else
    echo -e "${YELLOW}使用公网地址下载（会产生流量费）${NC}"
fi

# 创建模型目录
mkdir -p models/{encoder,synthesizer,vocoder}

# 模型文件定义
declare -A MODELS=(
    ["encoder"]="models/encoder/encoder.pt"
    ["synthesizer"]="models/synthesizer/synthesizer.pt"
    ["vocoder"]="models/vocoder/vocoder.pt"
)

# 预期的模型大小（字节）
declare -A MODEL_SIZES=(
    ["encoder"]=17000000      # ~17 MB
    ["synthesizer"]=370000000 # ~370 MB
    ["vocoder"]=50000000      # ~50 MB
)

# 下载函数
download_model() {
    local model_name=$1
    local local_path=$2
    local remote_url="${COS_BASE_URL}/${local_path}"
    
    echo ""
    echo -e "${YELLOW}正在下载 ${model_name} 模型...${NC}"
    echo "  URL: ${remote_url}"
    echo "  保存到: ${local_path}"
    
    # 检查文件是否已存在
    if [ -f "${local_path}" ]; then
        local file_size=$(stat -f%z "${local_path}" 2>/dev/null || stat -c%s "${local_path}" 2>/dev/null)
        local expected_size=${MODEL_SIZES[$model_name]}
        
        if [ $file_size -gt $((expected_size / 2)) ]; then
            echo -e "${GREEN}✓ 文件已存在且大小正常，跳过下载${NC}"
            return 0
        else
            echo -e "${YELLOW}! 文件已存在但大小异常，重新下载${NC}"
            rm -f "${local_path}"
        fi
    fi
    
    # 下载文件（支持断点续传）
    if wget -c "${remote_url}" -O "${local_path}" --progress=bar:force 2>&1 | tail -f -n +6; then
        echo -e "${GREEN}✓ ${model_name} 下载完成${NC}"
        
        # 验证文件大小
        local file_size=$(stat -f%z "${local_path}" 2>/dev/null || stat -c%s "${local_path}" 2>/dev/null)
        echo "  文件大小: $(numfmt --to=iec-i --suffix=B $file_size 2>/dev/null || echo "${file_size} bytes")"
        
        return 0
    else
        echo -e "${RED}✗ ${model_name} 下载失败${NC}"
        return 1
    fi
}

# 主下载流程
echo ""
echo "开始下载模型文件..."
echo "总大小约: 437 MB"
echo ""

FAILED_MODELS=()

for model_name in "${!MODELS[@]}"; do
    local_path="${MODELS[$model_name]}"
    
    if ! download_model "$model_name" "$local_path"; then
        FAILED_MODELS+=("$model_name")
    fi
done

# 结果汇总
echo ""
echo "=================================="
echo "下载完成"
echo "=================================="

if [ ${#FAILED_MODELS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 所有模型下载成功！${NC}"
    echo ""
    echo "模型文件列表:"
    ls -lh models/*/*.pt 2>/dev/null || echo "  (未找到模型文件)"
    echo ""
    echo "下一步:"
    echo "  1. 检查模型文件是否完整"
    echo "  2. 运行: ./switch_to_real_model.sh"
    echo "  3. 重新构建 Docker: docker compose build"
    echo "  4. 重启服务: docker compose up -d"
    exit 0
else
    echo -e "${RED}✗ 以下模型下载失败:${NC}"
    for model in "${FAILED_MODELS[@]}"; do
        echo "  - $model"
    done
    echo ""
    echo "请检查:"
    echo "  1. COS 地址是否正确（脚本顶部配置）"
    echo "  2. COS 文件是否已上传"
    echo "  3. 网络连接是否正常"
    echo "  4. 是否有足够的磁盘空间"
    exit 1
fi
