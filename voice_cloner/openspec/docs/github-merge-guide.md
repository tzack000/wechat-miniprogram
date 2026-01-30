# 代码合并到GitHub仓库指南

## 目标

将两个小程序项目合并到一个仓库：
- 原有项目：场馆停车小程序 → `venue_parking/` 目录
- 当前项目：声音克隆小程序 → `voice_cloner/` 目录
- 仓库地址：https://github.com/tzack000/wechat-miniprogram（重命名后）

## 合并步骤

### 步骤1: 备份当前声音克隆项目

```bash
# 进入当前项目目录
cd /Users/tangzhenqian/Documents/code/wechat-voice-cloner-miniprogram

# 创建临时备份
cd ..
cp -r wechat-voice-cloner-miniprogram wechat-voice-cloner-miniprogram-backup
echo "✓ 备份完成"
```

### 步骤2: 克隆并重命名原仓库

```bash
# 克隆原仓库
cd /Users/tangzhenqian/Documents/code
git clone https://github.com/tzack000/wechat-venue-parking-miniprogram.git wechat-miniprogram-temp

cd wechat-miniprogram-temp

# 查看当前内容
ls -la
```

### 步骤3: 重组目录结构

```bash
# 创建新的目录结构
mkdir -p venue_parking
mkdir -p voice_cloner

# 移动原有项目到 venue_parking
# 注意：需要根据实际目录结构调整
mv miniprogram venue_parking/ 2>/dev/null || true
mv cloudfunctions venue_parking/ 2>/dev/null || true
mv project.config.json venue_parking/ 2>/dev/null || true

# 如果有其他文件，一起移动
# mv README.md venue_parking/ 2>/dev/null || true
# mv .gitignore venue_parking/ 2>/dev/null || true

echo "✓ 原项目已移动到 venue_parking/"
```

### 步骤4: 复制声音克隆项目

```bash
# 复制声音克隆项目到 voice_cloner
cp -r /Users/tangzhenqian/Documents/code/wechat-voice-cloner-miniprogram/* voice_cloner/

# 确认复制成功
ls -la voice_cloner/

echo "✓ 声音克隆项目已复制到 voice_cloner/"
```

### 步骤5: 创建根目录README

```bash
# 创建根目录的 README.md
cat > README.md << 'EOF'
# 微信小程序项目集合

本仓库包含两个微信小程序项目。

## 项目列表

### 1. 场馆停车小程序 (venue_parking/)

场馆停车管理系统的微信小程序端。

**功能**:
- 停车场查询
- 预约停车
- 停车记录

**技术栈**:
- 微信小程序原生开发
- 微信云开发

[查看详细文档](./venue_parking/README.md)

---

### 2. 声音克隆小程序 (voice_cloner/)

基于AI的声音克隆与语音合成小程序。

**功能**:
- 声音录制与上传
- 声音特征提取
- 文本转语音合成
- 个人声纹管理

**技术栈**:
- 微信小程序 + 云开发
- MockingBird语音克隆模型
- FastAPI后端服务

**项目状态**: 🚧 开发中

**完成进度**: 46/159 任务 (28.9%)

**已完成模块**:
- ✅ 项目初始化和配置
- ✅ 数据库设计
- ✅ 云存储配置
- ✅ 用户认证
- ✅ 录音模块
- ✅ 音频上传和格式转换
- ✅ 语音克隆模型集成

**开发中**:
- 🔄 声音特征提取服务
- 📋 待开发：语音合成、用户界面优化

[查看详细文档](./voice_cloner/README.md)

---

## 目录结构

```
wechat-miniprogram/
├── venue_parking/           # 场馆停车小程序
│   ├── miniprogram/        # 小程序前端代码
│   ├── cloudfunctions/     # 云函数
│   └── project.config.json # 项目配置
│
├── voice_cloner/           # 声音克隆小程序
│   ├── miniprogram/        # 小程序前端代码
│   ├── cloudfunctions/     # 云函数
│   ├── voice-cloning-server/ # API服务器
│   ├── openspec/           # 项目文档和规范
│   └── project.config.json # 项目配置
│
└── README.md               # 本文件
```

## 开发指南

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

## 许可证

MIT License

## 作者

tzack000

## 贡献

欢迎提交 Issue 和 Pull Request
EOF

echo "✓ 根目录 README.md 已创建"
```

### 步骤6: 更新 .gitignore

```bash
# 创建或更新 .gitignore
cat > .gitignore << 'EOF'
# 微信小程序
.DS_Store
*.log
node_modules/

# 场馆停车小程序
venue_parking/miniprogram/node_modules/
venue_parking/cloudfunctions/*/node_modules/

# 声音克隆小程序
voice_cloner/miniprogram/node_modules/
voice_cloner/cloudfunctions/*/node_modules/
voice_cloner/voice-cloning-server/venv/
voice_cloner/voice-cloning-server/models/*.pt
voice_cloner/voice-cloning-server/logs/
voice_cloner/voice-cloning-server/.env

# IDE
.vscode/
.idea/

# 临时文件
*.tmp
*.bak
*~

# 系统文件
Thumbs.db
Desktop.ini
EOF

echo "✓ .gitignore 已更新"
```

### 步骤7: 提交更改

```bash
# 查看状态
git status

# 添加所有更改
git add .

# 提交
git commit -m "重构: 合并两个项目并重组目录结构

- 将原场馆停车小程序移动到 venue_parking/ 目录
- 添加声音克隆小程序到 voice_cloner/ 目录
- 更新仓库 README.md
- 更新 .gitignore

项目状态:
- venue_parking: 稳定版本
- voice_cloner: 开发中 (28.9% 完成)
"

echo "✓ 更改已提交"
```

### 步骤8: 在GitHub上重命名仓库

在GitHub网页上操作：

1. 访问：https://github.com/tzack000/wechat-venue-parking-miniprogram
2. 点击 "Settings"（仓库设置）
3. 在 "Repository name" 中改为：`wechat-miniprogram`
4. 点击 "Rename" 确认

### 步骤9: 更新本地远程地址并推送

```bash
# 更新远程仓库地址（如果GitHub上已重命名）
git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git

# 推送到远程仓库
git push origin main

# 如果推送失败，可能需要强制推送（谨慎使用）
# git push -f origin main

echo "✓ 已推送到 GitHub"
```

---

## 完整脚本（一键执行）

将以下内容保存为 `merge_projects.sh`：

```bash
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
    cp -r "$VOICE_CLONER_PATH" "${VOICE_CLONER_PATH}-backup"
    echo "✓ 备份完成: ${VOICE_CLONER_PATH}-backup"
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

[查看详细文档](./venue_parking/README.md)

---

### 2. 声音克隆小程序 (voice_cloner/)

基于AI的声音克隆与语音合成小程序。

**项目状态**: 🚧 开发中 (28.9% 完成)

**已完成模块**:
- ✅ 项目初始化和配置
- ✅ 数据库设计
- ✅ 云存储配置
- ✅ 用户认证
- ✅ 录音模块
- ✅ 音频上传和格式转换
- ✅ 语音克隆模型集成

[查看详细文档](./voice_cloner/README.md)

---

## 目录结构

\`\`\`
wechat-miniprogram/
├── venue_parking/           # 场馆停车小程序
│   ├── miniprogram/
│   └── cloudfunctions/
│
├── voice_cloner/           # 声音克隆小程序
│   ├── miniprogram/
│   ├── cloudfunctions/
│   ├── voice-cloning-server/
│   └── openspec/
│
└── README.md
\`\`\`

## 开发指南

### 场馆停车小程序
\`\`\`bash
cd venue_parking
# 使用微信开发者工具打开此目录
\`\`\`

### 声音克隆小程序
\`\`\`bash
cd voice_cloner
# 使用微信开发者工具打开此目录
\`\`\`

## 许可证

MIT License

## 作者

tzack000
EOFREADME

echo "✓ README.md 已创建"

# 步骤7: 更新 .gitignore
echo ""
echo "步骤7: 创建/更新 .gitignore..."
cat > .gitignore << 'EOFGITIGNORE'
# 微信小程序
.DS_Store
*.log
node_modules/

# 场馆停车小程序
venue_parking/miniprogram/node_modules/
venue_parking/cloudfunctions/*/node_modules/

# 声音克隆小程序
voice_cloner/miniprogram/node_modules/
voice_cloner/cloudfunctions/*/node_modules/
voice_cloner/voice-cloning-server/venv/
voice_cloner/voice-cloning-server/models/*.pt
voice_cloner/voice-cloning-server/logs/
voice_cloner/voice-cloning-server/.env

# IDE
.vscode/
.idea/

# 临时文件
*.tmp
*.bak
*~

# 系统文件
Thumbs.db
Desktop.ini
EOFGITIGNORE

echo "✓ .gitignore 已创建"

# 步骤8: Git 提交
echo ""
echo "步骤8: 提交更改到 Git..."
git add .
git commit -m "重构: 合并两个项目并重组目录结构

- 将原场馆停车小程序移动到 venue_parking/ 目录
- 添加声音克隆小程序到 voice_cloner/ 目录
- 更新仓库 README.md
- 更新 .gitignore

项目状态:
- venue_parking: 稳定版本
- voice_cloner: 开发中 (28.9% 完成)"

echo "✓ 更改已提交"

# 完成
echo ""
echo "=========================================="
echo "  合并完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 在GitHub上将仓库重命名为 wechat-miniprogram"
echo "   网址: https://github.com/tzack000/wechat-venue-parking-miniprogram/settings"
echo ""
echo "2. 更新远程地址并推送:"
echo "   cd $TEMP_REPO"
echo "   git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git"
echo "   git push origin main"
echo ""
echo "3. 删除临时目录:"
echo "   cd $WORK_DIR"
echo "   rm -rf $TEMP_REPO"
echo ""
```

保存后执行：

```bash
chmod +x merge_projects.sh
./merge_projects.sh
```

---

## 手动执行步骤（如果脚本失败）

### 准备工作

```bash
cd /Users/tangzhenqian/Documents/code

# 1. 备份
cp -r wechat-voice-cloner-miniprogram wechat-voice-cloner-miniprogram-backup

# 2. 克隆
git clone https://github.com/tzack000/wechat-venue-parking-miniprogram.git wechat-miniprogram-temp
cd wechat-miniprogram-temp
```

### 重组目录

```bash
# 3. 创建目录
mkdir venue_parking voice_cloner

# 4. 移动原文件（根据实际情况调整）
# 方法A: 如果是微信小程序标准结构
mv miniprogram venue_parking/
mv cloudfunctions venue_parking/
mv project.config.json venue_parking/

# 方法B: 移动所有文件（排除 .git）
# for file in $(ls -A | grep -v ".git\|venue_parking\|voice_cloner"); do
#     mv "$file" venue_parking/
# done

# 5. 复制声音克隆项目
cp -r /Users/tangzhenqian/Documents/code/wechat-voice-cloner-miniprogram/* voice_cloner/
```

### 提交和推送

```bash
# 6. 创建 README.md 和 .gitignore（使用上面的内容）

# 7. 提交
git add .
git commit -m "重构: 合并两个项目"

# 8. 在GitHub上重命名仓库

# 9. 推送
git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git
git push origin main
```

---

## 验证合并结果

### 检查目录结构

```bash
cd wechat-miniprogram-temp
tree -L 2 -a

# 预期输出:
# .
# ├── .git/
# ├── .gitignore
# ├── README.md
# ├── venue_parking/
# │   ├── miniprogram/
# │   ├── cloudfunctions/
# │   └── project.config.json
# └── voice_cloner/
#     ├── miniprogram/
#     ├── cloudfunctions/
#     ├── voice-cloning-server/
#     ├── openspec/
#     └── project.config.json
```

### 测试小程序

#### 测试场馆停车小程序

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `wechat-miniprogram-temp/venue_parking/` 目录
4. 检查是否能正常运行

#### 测试声音克隆小程序

1. 打开微信开发者工具
2. 选择"导入项目"  
3. 选择 `wechat-miniprogram-temp/voice_cloner/` 目录
4. 检查是否能正常运行

---

## 常见问题

### Q1: 推送时提示"rejected"

**原因**: 远程有未同步的更改

**解决**:
```bash
git pull origin main --rebase
git push origin main
```

### Q2: 仓库重命名后推送失败

**原因**: 远程地址未更新

**解决**:
```bash
git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git
git remote -v  # 验证地址
git push origin main
```

### Q3: 文件过大无法推送

**原因**: 模型文件过大

**解决**:
```bash
# 确保 .gitignore 包含模型文件
echo "voice_cloner/voice-cloning-server/models/*.pt" >> .gitignore
git rm --cached voice_cloner/voice-cloning-server/models/*.pt
git commit -m "移除大文件"
git push origin main
```

---

## 清理工作

合并成功后：

```bash
# 删除临时目录
cd /Users/tangzhenqian/Documents/code
rm -rf wechat-miniprogram-temp

# 如果确认无误，可以删除备份
# rm -rf wechat-voice-cloner-miniprogram-backup
```

---

## 完成检查清单

- [ ] 备份完成
- [ ] 原仓库已克隆
- [ ] 目录结构正确
- [ ] README.md 已创建
- [ ] .gitignore 已更新
- [ ] Git 提交成功
- [ ] GitHub 仓库已重命名
- [ ] 远程地址已更新
- [ ] 推送成功
- [ ] 两个小程序都能正常打开
- [ ] 临时文件已清理

---

## 最终仓库结构

```
https://github.com/tzack000/wechat-miniprogram
│
├── venue_parking/              # 场馆停车小程序
│   ├── miniprogram/
│   │   ├── pages/
│   │   ├── app.js
│   │   └── app.json
│   ├── cloudfunctions/
│   ├── project.config.json
│   └── README.md
│
├── voice_cloner/               # 声音克隆小程序  
│   ├── miniprogram/
│   │   ├── pages/
│   │   │   ├── index/
│   │   │   ├── record/
│   │   │   ├── synthesize/
│   │   │   ├── audio-list/
│   │   │   └── profile/
│   │   ├── app.js
│   │   └── app.json
│   ├── cloudfunctions/
│   │   ├── audioProcess/
│   │   ├── db-init/
│   │   ├── extract/
│   │   ├── synthesize/
│   │   ├── upload/
│   │   ├── query/
│   │   ├── cleanup/
│   │   └── login/
│   ├── voice-cloning-server/
│   │   ├── src/
│   │   ├── models/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── openspec/
│   │   ├── changes/
│   │   └── docs/
│   ├── project.config.json
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 下一步

合并完成后，你可以：

1. ✅ 在新仓库中继续开发声音克隆小程序
2. ✅ 维护场馆停车小程序
3. ✅ 与团队成员分享新的仓库地址
4. ✅ 更新相关文档中的链接

祝合并顺利！🎉
