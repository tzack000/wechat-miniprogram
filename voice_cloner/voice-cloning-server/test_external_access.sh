#!/bin/bash

#####################################
# API 外网访问测试脚本
# 测试所有 API 端点
#####################################

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# 检查参数
if [ -z "$1" ]; then
    error "请提供服务器 IP 地址"
    echo "用法: $0 <SERVER_IP>"
    echo "示例: $0 123.45.67.89"
    exit 1
fi

SERVER_IP=$1
BASE_URL="http://$SERVER_IP:8000"

echo "========================================"
echo "API 外网访问测试"
echo "========================================"
echo "服务器: $SERVER_IP"
echo "API 地址: $BASE_URL"
echo ""

# 测试 1: 根路径
echo "测试 1/5: 根路径..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    success "根路径可访问 (HTTP $HTTP_CODE)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    error "根路径访问失败 (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# 测试 2: 健康检查
echo "测试 2/5: 健康检查..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    success "健康检查通过 (HTTP $HTTP_CODE)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    error "健康检查失败 (HTTP $HTTP_CODE)"
    echo "$BODY"
fi
echo ""

# 测试 3: API 文档
echo "测试 3/5: API 文档..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/docs" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    success "API 文档可访问 (HTTP $HTTP_CODE)"
    info "在浏览器中访问: $BASE_URL/docs"
else
    error "API 文档访问失败 (HTTP $HTTP_CODE)"
fi
echo ""

# 测试 4: 创建测试音频并上传
echo "测试 4/5: 测试声纹提取 API..."
if command -v python3 &> /dev/null; then
    # 创建临时测试音频
    python3 << 'EOF' > /tmp/test_audio_upload.wav 2>/dev/null
import numpy as np
import sys
try:
    import soundfile as sf
    sample_rate = 16000
    duration = 3
    t = np.linspace(0, duration, sample_rate * duration)
    audio = np.sin(2 * np.pi * 440 * t) * 0.5
    audio = audio.astype(np.float32)
    sf.write('/tmp/test_audio_upload.wav', audio, sample_rate)
except ImportError:
    print("跳过音频测试 (需要 soundfile 库)", file=sys.stderr)
    sys.exit(1)
EOF
    
    if [ -f /tmp/test_audio_upload.wav ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/extract-embedding" \
            -F "audio=@/tmp/test_audio_upload.wav" 2>&1)
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "200" ]; then
            success "声纹提取 API 正常 (HTTP $HTTP_CODE)"
            echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"成功: {d.get('success')}, 维度: {d.get('dimension')}\")" 2>/dev/null
        else
            error "声纹提取 API 失败 (HTTP $HTTP_CODE)"
        fi
        rm -f /tmp/test_audio_upload.wav
    else
        info "跳过声纹提取测试（需要 soundfile 库）"
    fi
else
    info "跳过声纹提取测试（需要 Python3）"
fi
echo ""

# 测试 5: 网络延迟
echo "测试 5/5: 网络延迟..."
PING_RESULT=$(ping -c 3 "$SERVER_IP" 2>&1)
if [ $? -eq 0 ]; then
    AVG_TIME=$(echo "$PING_RESULT" | grep "avg" | awk -F'/' '{print $5}')
    if [ -n "$AVG_TIME" ]; then
        success "平均延迟: ${AVG_TIME}ms"
    else
        success "网络可达"
    fi
else
    error "无法 ping 通服务器（可能被防火墙阻止）"
fi
echo ""

# 总结
echo "========================================"
echo "测试总结"
echo "========================================"
echo "服务器 IP: $SERVER_IP"
echo "API 地址: $BASE_URL"
echo ""
echo "快速访问链接:"
echo "  API 文档: $BASE_URL/docs"
echo "  健康检查: $BASE_URL/health"
echo ""
echo "提示:"
echo "  1. 如果所有测试都失败，请检查腾讯云安全组是否开放了 8000 端口"
echo "  2. 如果部分测试失败，请查看服务器日志: docker compose logs"
echo "  3. 确保服务器防火墙允许 8000 端口: sudo ufw status"
echo ""
