Page({
  data: {
    coachId: '',
    coach: {},
    courses: [],
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ coachId: options.id })
      this.loadCoachDetail()
      this.loadCoachCourses()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载教练详情
  async loadCoachDetail() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'coach',
        data: {
          action: 'get',
          id: this.data.coachId
        }
      })

      if (res.result.success) {
        this.setData({
          coach: res.result.data,
          loading: false
        })
        
        // 设置页面标题为教练名字
        wx.setNavigationBarTitle({
          title: res.result.data.name
        })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载教练详情失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 加载教练的授课课程
  async loadCoachCourses() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'listByCoach',
          coachId: this.data.coachId
        }
      })

      if (res.result.success) {
        this.setData({
          courses: res.result.data
        })
      }
    } catch (error) {
      console.error('加载教练课程失败:', error)
    }
  },

  // 点击课程卡片
  onCourseTap(e) {
    const courseId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course/detail/detail?id=${courseId}`
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `教练：${this.data.coach.name}`,
      path: `/pages/coach/detail/detail?id=${this.data.coachId}`
    }
  }
})
