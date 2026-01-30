// pages/admin/settings/settings.js
const app = getApp()
const { adminApi } = require('../../../utils/api')
const { showToast, showConfirm, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    isAdmin: false,
    adminList: [],
    loading: true,
    secretKey: '',
    showSecretInput: false
  },

  onLoad() {
    this.checkAdminStatus()
  },

  onShow() {
    if (this.data.isAdmin) {
      this.loadAdminList()
    }
  },

  // 检查管理员状态
  checkAdminStatus() {
    const isAdmin = app.checkAdmin()
    this.setData({ 
      isAdmin,
      loading: false
    })
    
    if (isAdmin) {
      this.loadAdminList()
    }
  },

  // 加载管理员列表
  async loadAdminList() {
    try {
      this.setData({ loading: true })
      const res = await adminApi.getAdminList()
      if (res.success) {
        this.setData({ adminList: res.data })
      }
    } catch (err) {
      console.error('加载管理员列表失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 显示密钥输入框
  showSecretInput() {
    this.setData({ showSecretInput: true })
  },

  // 隐藏密钥输入框
  hideSecretInput() {
    this.setData({ 
      showSecretInput: false,
      secretKey: ''
    })
  },

  // 输入密钥
  onSecretKeyInput(e) {
    this.setData({ secretKey: e.detail.value })
  },

  // 将自己设为管理员
  async setSelfAdmin() {
    const { secretKey } = this.data
    
    if (!secretKey) {
      showToast('请输入管理员密钥')
      return
    }

    const confirmed = await showConfirm('确认操作', '确定要将自己设为管理员吗？')
    if (!confirmed) return

    try {
      showLoading('设置中...')
      const res = await adminApi.setSelfAdmin(secretKey)
      hideLoading()

      if (res.success) {
        showToast('设置成功', 'success')
        // 更新本地状态
        app.globalData.isAdmin = true
        app.globalData.userInfo = res.userInfo
        wx.setStorageSync('userInfo', res.userInfo)
        
        this.setData({ 
          isAdmin: true,
          showSecretInput: false,
          secretKey: ''
        })
        this.loadAdminList()
      } else {
        showToast(res.message || '设置失败')
      }
    } catch (err) {
      hideLoading()
      showToast('设置失败')
      console.error('设置管理员失败:', err)
    }
  },

  // 移除管理员
  async removeAdmin(e) {
    const { openid, name } = e.currentTarget.dataset
    
    const confirmed = await showConfirm('确认操作', `确定要移除 ${name || '该用户'} 的管理员权限吗？`)
    if (!confirmed) return

    try {
      showLoading('处理中...')
      const res = await adminApi.removeAdmin(openid)
      hideLoading()

      if (res.success) {
        showToast('移除成功', 'success')
        this.loadAdminList()
      } else {
        showToast(res.message || '移除失败')
      }
    } catch (err) {
      hideLoading()
      showToast('操作失败')
      console.error('移除管理员失败:', err)
    }
  },

  // 复制 openid
  copyOpenid(e) {
    const { openid } = e.currentTarget.dataset
    wx.setClipboardData({
      data: openid,
      success: () => {
        showToast('已复制', 'success')
      }
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
