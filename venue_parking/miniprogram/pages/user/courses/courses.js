// 我的课程页面
Page({
  data: {
    bookings: [],
    loading: false,
    currentTab: 'all', // all, confirmed, cancelled, completed
    tabs: [
      { value: 'all', label: '全部' },
      { value: 'confirmed', label: '已预约' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ],
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    this.loadMyBookings()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      bookings: []
    })
    this.loadMyBookings()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadMyBookings()
    }
  },

  // 切换标签
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return

    this.setData({
      currentTab: tab,
      page: 1,
      hasMore: true,
      bookings: []
    })
    this.loadMyBookings()
  },

  // 加载我的预约
  async loadMyBookings() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'getMyBookings',
          status: this.data.currentTab === 'all' ? undefined : this.data.currentTab,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      if (res.result.success) {
        const newBookings = res.result.data
        const hasMore = newBookings.length >= this.data.pageSize

        this.setData({
          bookings: this.data.page === 1 ? newBookings : [...this.data.bookings, ...newBookings],
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
      console.error('加载我的预约失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 取消预约
  onCancelBooking(e) {
    const bookingId = e.currentTarget.dataset.id
    const booking = this.data.bookings.find(b => b._id === bookingId)

    if (!booking) return

    // 检查是否可以取消
    const now = new Date()
    const courseDateTime = new Date(`${booking.date} ${booking.startTime}`)
    const hoursDiff = (courseDateTime - now) / (1000 * 60 * 60)

    if (hoursDiff < 2) {
      wx.showModal({
        title: '无法取消',
        content: '已超过可取消时间（课程开始前2小时）',
        showCancel: false
      })
      return
    }

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个课程预约吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.cancelBooking(bookingId)
        }
      }
    })
  },

  // 执行取消预约
  async cancelBooking(bookingId) {
    wx.showLoading({ title: '取消中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'course',
        data: {
          action: 'cancelBooking',
          bookingId
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        })

        // 刷新列表
        this.setData({
          page: 1,
          hasMore: true,
          bookings: []
        })
        this.loadMyBookings()
      } else {
        wx.showModal({
          title: '取消失败',
          content: res.result.message || '请稍后重试',
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('取消预约失败:', error)
      wx.showToast({
        title: '取消失败，请重试',
        icon: 'none'
      })
    }
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      completed: '已完成'
    }
    return statusMap[status] || status
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      completed: 'status-completed'
    }
    return classMap[status] || ''
  }
})
