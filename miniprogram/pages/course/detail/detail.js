// 课程详情页面
const app = getApp()

Page({
  data: {
    courseId: '',
    course: null,
    coaches: [],
    selectedCoachId: '', // 选中的教练ID
    selectedDate: '', // 选中的日期
    dates: [], // 可选日期列表
    schedules: [], // 当前日期的排期列表
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ courseId: options.id })
      this.loadCourseDetail()
      this.initDates()
    }
    
    // 如果从教练详情页跳转过来，自动选中教练
    if (options.coachId) {
      this.setData({ selectedCoachId: options.coachId })
    }
  },

  // 加载课程详情
  async loadCourseDetail() {
    wx.showLoading({ title: '加载中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'getDetail',
          courseId: this.data.courseId
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        this.setData({
          course: res.result.data,
          coaches: res.result.data.coaches || []
        })
        
        // 如果有预设的教练ID，加载该教练的排期
        if (this.data.selectedCoachId && this.data.selectedDate) {
          this.loadSchedules()
        }
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('加载课程详情失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 初始化日期列表（未来7天）
  initDates() {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dateStr = this.formatDate(date)
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
      const label = i === 0 ? '今天' : i === 1 ? '明天' : `${date.getMonth() + 1}/${date.getDate()}`
      
      dates.push({
        date: dateStr,
        label,
        weekDay
      })
    }
    
    this.setData({
      dates,
      selectedDate: dates[0].date
    })
    
    // 加载第一天的排期
    this.loadSchedules()
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 选择教练
  onCoachSelect(e) {
    const coachId = e.currentTarget.dataset.id
    this.setData({ selectedCoachId: coachId })
    this.loadSchedules()
  },

  // 选择日期
  onDateSelect(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ selectedDate: date })
    this.loadSchedules()
  },

  // 加载课程排期
  async loadSchedules() {
    if (this.data.loading) return
    if (!this.data.selectedDate) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'getSchedules',
          courseId: this.data.courseId,
          coachId: this.data.selectedCoachId || undefined,
          date: this.data.selectedDate
        }
      })

      if (res.result.success) {
        this.setData({
          schedules: res.result.data,
          loading: false
        })
      } else {
        wx.showToast({
          title: res.result.message || '加载排期失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载排期失败:', error)
      wx.showToast({
        title: '加载排期失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 预约课程
  onBook(e) {
    const schedule = e.currentTarget.dataset.schedule
    
    // 检查是否登录
    if (!app.globalData.userInfo || !app.globalData.userInfo._openid) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/profile/profile'
            })
          }
        }
      })
      return
    }
    
    // 检查排期状态
    if (schedule.status === 'cancelled') {
      wx.showToast({
        title: '该排期已取消',
        icon: 'none'
      })
      return
    }
    
    if (schedule.status === 'full' || schedule.availableSeats <= 0) {
      wx.showToast({
        title: '该场次名额已满',
        icon: 'none'
      })
      return
    }
    
    // 跳转到预约确认页面
    wx.navigateTo({
      url: `/pages/course/booking/booking?scheduleId=${schedule._id}`
    })
  },

  // 查看教练详情
  goToCoachDetail(e) {
    const coachId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/coach/detail/detail?id=${coachId}`
    })
  }
})
