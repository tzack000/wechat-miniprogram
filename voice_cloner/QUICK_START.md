# 🚀 快速合并指南

## 一键执行（推荐）

```bash
cd /Users/tangzhenqian/Documents/code/wechat-voice-cloner-miniprogram
./merge_projects.sh
```

脚本会自动完成：
- ✅ 备份当前项目
- ✅ 克隆原仓库
- ✅ 重组目录结构
- ✅ 创建README和.gitignore
- ✅ 提交更改

---

## 执行后续步骤

### 步骤1: 在GitHub上重命名仓库

1. 访问：https://github.com/tzack000/wechat-venue-parking-miniprogram/settings
2. 找到 "Repository name"
3. 改为：`wechat-miniprogram`
4. 点击 "Rename"

### 步骤2: 推送代码

```bash
cd /Users/tangzhenqian/Documents/code/wechat-miniprogram-temp

# 更新远程地址
git remote set-url origin https://github.com/tzack000/wechat-miniprogram.git

# 推送
git push origin main
```

### 步骤3: 验证

在微信开发者工具中分别打开：
- `wechat-miniprogram-temp/venue_parking/`
- `wechat-miniprogram-temp/voice_cloner/`

确认都能正常运行。

### 步骤4: 清理

```bash
cd /Users/tangzhenqian/Documents/code

# 删除临时目录
rm -rf wechat-miniprogram-temp

# 可选：删除备份（确认无误后）
# rm -rf wechat-voice-cloner-miniprogram-backup-*
```

---

## 最终目录结构

```
wechat-miniprogram/
├── venue_parking/          # 场馆停车小程序
│   └── ...
├── voice_cloner/          # 声音克隆小程序
│   ├── miniprogram/
│   ├── cloudfunctions/
│   ├── voice-cloning-server/
│   └── openspec/
├── .gitignore
└── README.md
```

---

## 完成！🎉

新仓库地址：https://github.com/tzack000/wechat-miniprogram

包含：
- ✅ venue_parking/ - 场馆停车小程序
- ✅ voice_cloner/ - 声音克隆小程序（28.9%完成）
