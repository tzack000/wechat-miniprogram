# 开发环境配置指南

## 前置要求

### 1. Node.js 环境
- **版本**: Node.js >= 14.x
- **安装**: https://nodejs.org/
- **验证**: `node -v` 和 `npm -v`

### 2. Python 环境 (用于 AI 模型服务)
- **版本**: Python >= 3.8
- **安装**: https://www.python.org/
- **验证**: `python --version` 或 `python3 --version`

### 3. 微信开发者工具
- **下载**: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- **版本**: 最新稳定版

### 4. 微信小程序账号
- 注册微信小程序: https://mp.weixin.qq.com/
- 获取 AppID 并配置到 `project.config.json`

### 5. 云开发环境
- 在微信开发者工具中开通云开发
- 创建云开发环境并获取环境 ID
- 配置到 `miniprogram/app.js`

## 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd wechat-voice-cloner-miniprogram
```

### 2. 安装 Node.js 依赖
```bash
# 安装项目依赖
npm install

# 安装云函数依赖
cd cloudfunctions/login && npm install && cd ../..
cd cloudfunctions/query && npm install && cd ../..
cd cloudfunctions/upload && npm install && cd ../..
cd cloudfunctions/extract && npm install && cd ../..
cd cloudfunctions/synthesize && npm install && cd ../..
```

### 3. 安装 Python 依赖 (AI 模型服务)
```bash
# 创建虚拟环境(推荐)
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 4. 配置项目
1. 修改 `project.config.json` 中的 `appid`
2. 修改 `miniprogram/app.js` 中的云开发环境 ID (`env`)
3. 在云开发控制台创建数据库集合(参考 `cloudfunctions/database-init.md`)
4. 在云开发控制台创建云存储桶: `recordings` 和 `audio-outputs`

### 5. 上传云函数
在微信开发者工具中:
1. 右键点击 `cloudfunctions/login` -> 上传并部署:云端安装依赖
2. 重复上述步骤上传其他云函数

### 6. 运行项目
1. 用微信开发者工具打开项目根目录
2. 点击"编译"按钮
3. 在模拟器或真机中预览

## 开发工具

### 推荐 IDE
- **Visual Studio Code** (推荐)
  - 插件: vscode-wxml, minapp, prettier

### 音频处理工具
- **FFmpeg**: 用于音频格式转换
  - 安装: https://ffmpeg.org/download.html
  - 验证: `ffmpeg -version`

## 环境变量

在云开发控制台配置以下环境变量:

```
ENV_ID=your-env-id
MAX_DAILY_QUOTA=10
MAX_STORAGE_PER_USER=104857600
```

## 常见问题

### 1. 云函数调用失败
- 检查云开发环境是否开通
- 检查云函数是否已部署
- 检查权限设置

### 2. 音频上传失败
- 检查云存储桶是否已创建
- 检查文件大小限制(默认 10MB)
- 检查存储权限配置

### 3. Python 依赖安装失败
- 尝试使用清华镜像: `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`
- 检查 Python 版本是否符合要求

## 下一步

完成环境配置后,可以开始开发:
1. 参考 `openspec/changes/wechat-voice-cloner-miniprogram/design.md` 了解架构设计
2. 参考 `openspec/changes/wechat-voice-cloner-miniprogram/tasks.md` 查看开发任务
3. 从任务 5 开始实现具体功能模块
