#!/bin/bash

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  微信小程序项目合并脚本"
echo "=========================================="
echo ""

# 配置
VOICE_CLONER_PATH="/Users/tangzhenqian/Documents/code/wechat-voice-cloner-miniprogram"
WORK_DIR="/Users/tangzhenqian/Documents/code"
TEMP_REPO="wechat-miniprogram-temp"

# 步骤1: 备份
echo "步骤1: 备份当前声音克隆项目..."
cd "$WORK_DIR"
if [ -d "$VOICE_CLONER_PATH" ]; then
    cp -r "$VOICE_CLONER_PATH" "${VOICE_CLONER_PATH}-backup-$(date +%Y%m%d-%H%M%S)"
    echo "✓ 备份完成"
else
    echo "✗ 源目录不存在: $VOICE_CLONER_PATH"
    exit 1
fi

# 步骤2: 克隆原仓库
echo ""
echo "步骤2: 克隆原仓库..."
cd "$WORK_DIR"
if [ -d "$TEMP_REPO" ]; then
    echo "临时目录已存在，删除中..."
    rm -rf "$TEMP_REPO"
fi

git clone https://github.com/tzack000/wechat-venue-parking-miniprogram.git "$TEMP_REPO"
cd "$TEMP_REPO"
echo "✓ 仓库已克隆"

# 步骤3: 创建新目录结构
echo ""
echo "步骤3: 创建目录结构..."
mkdir -p venue_parking
mkdir -p voice_cloner
echo "✓ 目录已创建"

# 步骤4: 移动原有文件
echo ""
echo "步骤4: 移动原项目文件到 venue_parking/..."
# 获取所有文件（排除 .git, venue_parking, voice_cloner）
for item in $(ls -A | grep -v -E "^(\.git|venue_parking|voice_cloner)$"); do
    echo "  移动: $item"
    mv "$item" venue_parking/
done
echo "✓ 原项目已移动"

# 步骤5: 复制声音克隆项目
echo ""
echo "步骤5: 复制声音克隆项目到 voice_cloner/..."
cp -r "$VOICE_CLONER_PATH"/* voice_cloner/
echo "✓ 声音克隆项目已复制"

# 步骤6: 创建根README
echo ""
echo "步骤6: 创建根目录 README.md..."
cat > README.md << 'EOFREADME'
# 微信小程序项目集合

本仓库包含两个微信小程序项目。

## 项目列表

### 1. 场馆停车小程序 (venue_parking/)

场馆停车管理系统的微信小程序端。

**功能**:
- 停车场查询
- 预约停车
- 停车记录管理

**技术栈**:
- 微信小程序原生开发
- 微信云开发

### 2. 声音克隆小程序 (voice_cloner/)

基于AI的声音克隆与语音合成小程序。

**项目状态**: 🚧 开发中

**完成进度**: 46/159 任务 (28.9%)

**已完成模块**:
- ✅ 项目初始化和配置
- ✅ 数据库设计
- ✅ 云存储配置
- ✅ 用户认证系统
- ✅ 录音模块（支持质量检测、波形显示）
- ✅ 音频上传和格式转换
- ✅ 语音克隆模型集成（MockingBird）

**开发中**:
- 🔄 声音特征提取服务
- 📋 语音合成功能
- 📋 用户声纹管理

**技术栈**:
- 前端：微信小程序 + 云开发
- 后端：FastAPI + PyTorch
- 模型：MockingBird (基于SV2TTS)

[查看详细文档](./voice_cloner/README.md)

---

## 目录结构

```
wechat-miniprogram/
├── venue_parking/           # 场馆停车小程序
│   ├── miniprogram/        # 小程序前端
│   ├── cloudfunctions/     # 云函数
│   └── project.config.json
│
├── voice_cloner/           # 声音克隆小程序
│   ├── miniprogram/        # 小程序前端
│   │   ├── pages/         # 页面
│   │   │   ├── index/     # 首页
│   │   │   ├── record/    # 录音页
│   │   │   ├── synthesize/# 合成页
│   │   │   ├── audio-list/# 音频列表
│   │   │   └── profile/   # 个人中心
│   │   ├── app.js
│   │   └── app.json
│   ├── cloudfunctions/     # 云函数
│   │   ├── audioProcess/  # 音频处理
│   │   ├── db-init/       # 数据库初始化
│   │   ├── extract/       # 特征提取
│   │   ├── synthesize/    # 语音合成
│   │   ├── upload/        # 文件上传
│   │   ├── query/         # 数据查询
│   │   ├── cleanup/       # 清理任务
│   │   └── login/         # 用户登录
│   ├── voice-cloning-server/ # API服务器
│   │   ├── src/
│   │   │   └── api/       # FastAPI接口
│   │   ├── models/        # 模型文件
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── openspec/          # 项目文档
│   │   ├── changes/       # 任务追踪
│   │   └── docs/          # 技术文档
│   └── project.config.json
│
├── .gitignore
└── README.md              # 本文件
```

## 快速开始

### 场馆停车小程序

```bash
cd venue_parking
# 使用微信开发者工具打开此目录
```

### 声音克隆小程序

```bash
cd voice_cloner
# 使用微信开发者工具打开此目录
```

详细开发文档请查看各项目目录下的 README.md

## 开发进度（声音克隆小程序）

| 任务组 | 状态 | 进度 |
|--------|------|------|
| 1. 项目初始化 | ✅ | 10/10 |
| 2. 数据库设计 | ✅ | 6/6 |
| 3. 云存储配置 | ✅ | 4/4 |
| 4. 用户认证 | ✅ | 6/6 |
| 5. 录音模块 | ✅ | 10/10 |
| 6. 音频上传 | ✅ | 6/6 |
| 7. 模型集成 | ✅ | 8/8 |
| 8. 特征提取 | 🔄 | 0/9 |
| 9-16. 其他模块 | 📋 | 0/100+ |

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交规范

- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## 许可证

MIT License

## 作者

[@tzack000](https://github.com/tzack000)

## 致谢

- 微信小程序团队
- MockingBird 项目
- 所有贡献者
EOFREADME

echo "✓ README.md 已创建"

# 步骤7: 更新 .gitignore
echo ""
echo "步骤7: 创建/更新 .gitignore..."
cat > .gitignore << 'EOFGITIGNORE'
# macOS
.DS_Store
.AppleDouble
.LSOverride

# 微信小程序
*.log
node_modules/

# 场馆停车小程序
venue_parking/miniprogram/node_modules/
venue_parking/cloudfunctions/*/node_modules/

# 声音克隆小程序 - 小程序端
voice_cloner/miniprogram/node_modules/
voice_cloner/cloudfunctions/*/node_modules/

# 声音克隆小程序 - 服务器端
voice_cloner/voice-cloning-server/venv/
voice_cloner/voice-cloning-server/__pycache__/
voice_cloner/voice-cloning-server/*.pyc
voice_cloner/voice-cloning-server/.env
voice_cloner/voice-cloning-server/logs/
voice_cloner/voice-cloning-server/.pytest_cache/

# 模型文件（过大，不上传）
voice_cloner/voice-cloning-server/models/*.pt
voice_cloner/voice-cloning-server/models/*.pth
voice_cloner/voice-cloning-server/models/*.onnx
voice_cloner/voice-cloning-server/models/*.trt

# 临时文件
voice_cloner/voice-cloning-server/cache/
voice_cloner/voice-cloning-server/temp/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# 临时文件
*.tmp
*.bak

# 系统文件
Thumbs.db
Desktop.ini
ehthumbs.db
EOFGITIGNORE

echo "✓ .gitignore 已创建"

# 步骤8: 检查文件结构
echo ""
echo "步骤8: 检查文件结构..."
echo "venue_parking/ 内容:"
ls -la venue_parking/ | head -10
echo ""
echo "voice_cloner/ 内容:"
ls -la voice_cloner/ | head -10

# 步骤9: Git 提交
echo ""
echo "步骤9: 提交更改到 Git..."
git add .
git status --short

read -p "确认提交这些更改？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "重构: 合并两个项目并重组目录结构

- 将原场馆停车小程序移动到 venue_parking/ 目录
- 添加声音克隆小程序到 voice_cloner/ 目录
- 创建统一的根目录 README.md
- 更新 .gitignore 配置

声音克隆小程序状态:
- 完成进度: 46/159 任务 (28.9%)
- 已完成: 7个任务组
- 开发中: 任务组8（特征提取服务）

项目结构:
- venue_parking/: 稳定版本
- voice_cloner/: 活跃开发中"
    
    echo "✓ 更改已提交"
else
    echo "取消提交"
    exit 0
fi

# 完成
echo ""
echo "=========================================="
echo "  合并完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "1️⃣ 在GitHub上重命名仓库"
echo "   访问: https://github.com/tzack000/wechat-venue-parking-miniprogram/settings"
echo "   将 Repository name 改为: wechat-miniprogram"
echo ""
echo "2️⃣ 更新远程地址并推送"
echo "   cd $PWD"
echo "   git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git"
echo "   git push origin main"
echo ""
echo "3️⃣ 验证合并结果"
echo "   - 在微信开发者工具中打开 venue_parking/"
echo "   - 在微信开发者工具中打开 voice_cloner/"
echo "   - 检查两个项目是否都能正常运行"
echo ""
echo "4️⃣ 清理（可选）"
echo "   cd $WORK_DIR"
echo "   rm -rf $TEMP_REPO  # 删除临时目录"
echo "   # rm -rf wechat-voice-cloner-miniprogram-backup-*  # 删除备份"
echo ""
echo "当前工作目录: $PWD"
echo ""
