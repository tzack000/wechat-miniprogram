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
