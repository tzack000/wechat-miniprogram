# 微信语音克隆小程序

> 通过用户录制声音样本,实现个性化文本转语音(TTS)的微信小程序

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 项目简介

本项目是一个基于微信小程序和云开发的语音克隆应用。用户只需录制1-3分钟的声音样本,系统即可提取声音特征,之后用户输入任意文本,即可生成符合自己音色的语音。

### 核心功能

- 🎙️ **声音录制**: 录制用户声音样本,提供参考文本指导
- 🔊 **语音合成**: 输入任意文本,生成个性化语音
- 📝 **音频管理**: 查看、播放、分享和下载历史音频
- 👤 **用户中心**: 管理声纹档案,查看使用配额

### 技术特点

- 前后端分离架构
- 微信云开发(云函数 + 云数据库 + 云存储)
- 深度学习语音克隆模型(SV2TTS)
- 异步任务队列处理
- 音频质量检测和优化

## 项目结构

```
wechat-voice-cloner-miniprogram/
├── miniprogram/              # 小程序前端代码
│   ├── pages/               # 页面文件
│   │   ├── index/          # 首页
│   │   ├── record/         # 录音页面
│   │   ├── synthesize/     # 语音合成页面
│   │   ├── audio-list/     # 音频列表页面
│   │   └── profile/        # 个人中心
│   ├── components/          # 自定义组件
│   ├── utils/              # 工具函数
│   ├── app.js              # 小程序入口
│   └── app.json            # 小程序配置
├── cloudfunctions/          # 云函数
│   ├── login/              # 用户登录
│   ├── upload/             # 文件上传
│   ├── extract/            # 声音特征提取
│   ├── synthesize/         # 语音合成
│   └── query/              # 数据查询
├── openspec/               # OpenSpec 规格文档
│   └── changes/            # 变更管理
│       └── wechat-voice-cloner-miniprogram/
│           ├── proposal.md # 项目提案
│           ├── design.md   # 技术设计
│           ├── specs/      # 功能规格
│           └── tasks.md    # 任务清单
├── docs/                   # 项目文档
│   └── SETUP.md           # 环境搭建指南
├── package.json            # Node.js 依赖
├── requirements.txt        # Python 依赖
└── README.md              # 项目说明

```

## 快速开始

### 前置要求

- Node.js >= 14.x
- Python >= 3.8
- 微信开发者工具
- 微信小程序账号(AppID)

### 安装步骤

详细的安装步骤请参考 [环境搭建指南](docs/SETUP.md)

```bash
# 1. 克隆项目
git clone <repository-url>
cd wechat-voice-cloner-miniprogram

# 2. 安装依赖
npm install

# 3. 配置项目
# - 修改 project.config.json 中的 appid
# - 修改 miniprogram/app.js 中的云开发环境 ID

# 4. 用微信开发者工具打开项目
# - 上传云函数
# - 创建数据库集合和云存储桶
# - 点击编译运行
```

## 核心技术栈

### 前端
- **微信小程序框架**: WXML + WXSS + JavaScript
- **云开发**: 云函数 + 云数据库 + 云存储

### 后端
- **云函数**: Node.js (wx-server-sdk)
- **数据库**: MongoDB (微信云开发)
- **存储**: 云对象存储

### AI 模型
- **语音克隆**: SV2TTS / YourTTS
- **深度学习**: PyTorch + TorchAudio
- **音频处理**: Librosa + FFmpeg

## 架构设计

```
用户录音 → 上传云存储 → 云函数触发特征提取 → 存储声纹特征
用户输入文本 → 调用TTS API → 云端合成音频 → 返回音频URL → 小程序播放
```

详细的架构设计请参考:
- [技术设计文档](openspec/changes/wechat-voice-cloner-miniprogram/design.md)
- [功能规格](openspec/changes/wechat-voice-cloner-miniprogram/specs/)

## 开发进度

### 已完成 ✅
- [x] 项目初始化和环境搭建
- [x] 小程序基础框架搭建
- [x] 云函数目录结构
- [x] 数据库设计
- [x] 项目文档

### 进行中 🚧
- [ ] 语音录制模块
- [ ] 声音特征提取服务
- [ ] 文本转语音合成
- [ ] 音频管理模块

### 待开发 📋
查看完整的开发任务: [tasks.md](openspec/changes/wechat-voice-cloner-miniprogram/tasks.md)

## 数据库设计

### 主要集合

1. **voice_profiles**: 用户声纹档案
2. **tts_tasks**: TTS 任务记录
3. **audio_files**: 音频文件记录
4. **users**: 用户信息

详细的数据库设计请参考 [database-init.md](cloudfunctions/database-init.md)

## API 接口

### 核心接口
- `POST /api/voice-profile/upload`: 上传录音样本
- `POST /api/voice-profile/extract`: 触发特征提取
- `GET /api/voice-profile/:id`: 获取声纹档案
- `POST /api/tts/synthesize`: 文本转语音
- `GET /api/tts/task/:taskId`: 查询TTS任务状态

## 配额和限制

- 每日TTS合成次数: 10次/用户
- 单次文本长度: 1-500字
- 录音时长: 30秒-5分钟
- 用户存储空间: 100MB

## 安全和隐私

- ✅ 所有API调用需要微信用户身份认证
- ✅ 声纹数据与用户ID强绑定,禁止跨用户访问
- ✅ 音频文件使用签名URL,限时访问(24小时)
- ✅ 敏感数据传输使用HTTPS加密
- ✅ 提供数据删除功能,符合隐私保护法规

## 贡献指南

欢迎贡献代码! 请遵循以下步骤:

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目问题: [GitHub Issues](https://github.com/your-repo/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-repo/discussions)

## 致谢

- 微信小程序官方文档
- SV2TTS 语音克隆模型
- OpenSpec 规格管理框架

---

**注意**: 本项目仅供学习和研究使用,请勿用于非法用途。使用他人声音进行克隆需获得明确授权。
