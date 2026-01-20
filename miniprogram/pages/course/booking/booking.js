// 课程预约确认页面
Page({
  data: {
    scheduleId: '',
    schedule: null,
    course: null,
    coach: null,
    userName: '',
    userPhone: '',
    remark: '',
    submitting: false
  },

  onLoad(options) {
    if (options.scheduleId) {
      this.setData({ scheduleId: options.scheduleId })
      this.loadScheduleDetail()
    }
  },

  // 加载排期详情
  async loadScheduleDetail() {
    wx.showLoading({ title: '加载中...' })

    try {
      // 这里需要获取排期详情，包括课程和教练信息
      // 为了简化，我们通过scheduleId从缓存或重新查询获取
      // 实际项目中可能需要一个专门的接口
      
      wx.hideLoading()
      
      // 这里应该从上一页传递完整信息或通过API获取
      // 暂时使用简化方案
    } catch (error) {
      wx.hideLoading()
      console.error('加载排期详情失败:', error)
    }
  },

  // 输入预约人姓名
  onNameInput(e) {
    this.setData({
      userName: e.detail.value
    })
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      userPhone: e.detail.value
    })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交预约
  async onSubmit() {
    // 验证必填项
    if (!this.data.userName) {
      wx.showToast({
        title: '请输入预约人姓名',
        icon: 'none'
      })
      return
    }

    if (!this.data.userPhone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(this.data.userPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'book',
          bookingData: {
            scheduleId: this.data.scheduleId,
            userName: this.data.userName,
            userPhone: this.data.userPhone,
            remark: this.data.remark
          }
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '预约成功',
          icon: 'success'
        })

        // 延迟跳转到我的课程页面
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/user/courses/courses'
          })
        }, 1500)
      } else {
        wx.showModal({
          title: '预约失败',
          content: res.result.message || '请稍后重试',
          showCancel: false
        })
        this.setData({ submitting: false })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('提交预约失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
      this.setData({ submitting: false })
    }
  }
})
