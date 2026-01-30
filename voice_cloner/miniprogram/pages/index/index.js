// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasVoiceProfile: false,
    voiceProfileStatus: '', // 'ready', 'processing', 'failed', ''
    features: [
      {
        id: 1,
        title: '录制声音',
        desc: '录制您的声音样本',
        icon: '🎙️',
        path: '/pages/record/record'
      },
      {
        id: 2,
        title: '语音合成',
        desc: '输入文本生成语音',
        icon: '🔊',
        path: '/pages/synthesize/synthesize'
      },
      {
        id: 3,
        title: '我的音频',
        desc: '查看历史记录',
        icon: '📝',
        path: '/pages/audio-list/audio-list'
      }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.loadVoiceProfile();
  },

  // 检查登录状态
  checkLoginStatus() {
    if (app.globalData.isLoggedIn) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    } else {
      this.login();
    }
  },

  // 登录
  login() {
    wx.showLoading({ title: '登录中...' });
    
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        wx.hideLoading();
        console.log('登录成功', res);
        
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = res.result.userInfo;
        
        this.setData({
          userInfo: res.result.userInfo
        });
        
        wx.setStorageSync('token', res.result.token);
        wx.setStorageSync('userInfo', res.result.userInfo);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('登录失败', err);
        wx.showToast({
          title: '登录失败,请重试',
          icon: 'none'
        });
      }
    });
  },

  // 加载声纹档案
  loadVoiceProfile() {
    if (!app.globalData.isLoggedIn) return;

    wx.cloud.callFunction({
      name: 'query',
      data: {
        action: 'getVoiceProfile'
      },
      success: (res) => {
        if (res.result.success && res.result.data) {
          const profile = res.result.data;
          this.setData({
            hasVoiceProfile: true,
            voiceProfileStatus: profile.status
          });
          app.globalData.voiceProfile = profile;
        }
      },
      fail: (err) => {
        console.error('加载声纹档案失败', err);
      }
    });
  },

  // 导航到功能页面
  navigateTo(e) {
    const { path } = e.currentTarget.dataset;
    
    // 如果是语音合成,检查是否已有声纹档案
    if (path === '/pages/synthesize/synthesize' && !this.data.hasVoiceProfile) {
      wx.showModal({
        title: '提示',
        content: '请先录制您的声音样本以创建声音模型',
        confirmText: '去录制',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/record/record' });
          }
        }
      });
      return;
    }
    
    wx.navigateTo({ url: path });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '语音克隆助手 - 用你的声音说任何话',
      path: '/pages/index/index'
    };
  }
});
