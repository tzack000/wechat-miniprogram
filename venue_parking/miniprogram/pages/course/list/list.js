// 课程列表页面
Page({
  data: {
    courses: [],
    loading: false,
    currentType: '', // 当前筛选的课程类型
    typeList: [
      { value: '', label: '全部' },
      { value: 'yoga', label: '瑜伽' },
      { value: 'swimming', label: '游泳' },
      { value: 'basketball', label: '篮球' },
      { value: 'fitness', label: '健身' },
      { value: 'dance', label: '舞蹈' },
      { value: 'other', label: '其他' }
    ],
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad(options) {
    // 从参数中获取教练ID（从教练详情页跳转过来）
    if (options.coachId) {
      this.setData({
        coachId: options.coachId
      })
    }
    this.loadCourses()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      courses: []
    })
    this.loadCourses()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadCourses()
    }
  },

  // 加载课程列表
  async loadCourses() {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'getList',
          type: this.data.currentType || undefined,
          coachId: this.data.coachId || undefined,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      if (res.result.success) {
        const newCourses = res.result.data
        const hasMore = newCourses.length >= this.data.pageSize

        this.setData({
          courses: this.data.page === 1 ? newCourses : [...this.data.courses, ...newCourses],
          hasMore,
          loading: false
        })
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载课程列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 切换课程类型筛选
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.currentType) return

    this.setData({
      currentType: type,
      page: 1,
      hasMore: true,
      courses: []
    })
    this.loadCourses()
  },

  // 跳转到课程详情
  goToDetail(e) {
    const courseId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course/detail/detail?id=${courseId}`
    })
  }
})
