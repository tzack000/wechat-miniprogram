// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 云开发环境 ID,需要在云开发控制台创建后替换
        traceUser: true
      });
    }

    // 获取系统信息
    this.globalData.systemInfo = wx.getSystemInfoSync();
    
    // 检查更新
    this.checkUpdate();
    
    // 初始化用户信息
    this.initUserInfo();
  },

  onShow() {
    console.log('App Show');
  },

  onHide() {
    console.log('App Hide');
  },

  // 检查小程序更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager();
    
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        console.log('发现新版本');
      }
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好,是否重启应用?',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });

    updateManager.onUpdateFailed(() => {
      console.error('新版本下载失败');
    });
  },

  // 初始化用户信息
  initUserInfo() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
    }
  },

  // 全局数据
  globalData: {
    isLoggedIn: false,
    userInfo: null,
    systemInfo: null,
    voiceProfile: null // 用户声纹档案
  }
});
