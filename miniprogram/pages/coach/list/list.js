Page({
  data: {
    coachList: [],
    filteredCoachList: [],
    searchKeyword: '',
    selectedSpecialty: '',
    specialties: ['瑜伽', '游泳', '篮球', '网球', '健身', '舞蹈'],
    loading: true
  },

  onLoad() {
    this.loadCoaches()
  },

  // 加载教练列表
  async loadCoaches() {
    try {
      this.setData({ loading: true })
      
      const res = await wx.cloud.callFunction({
        name: 'coach',
        data: {
          action: 'list',
          enabled: true
        }
      })

      if (res.result.success) {
        this.setData({
          coachList: res.result.data,
          filteredCoachList: res.result.data,
          loading: false
        })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('加载教练列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.filterCoaches()
  },

  // 切换擅长领域筛选
  onFilterChange(e) {
    const specialty = e.currentTarget.dataset.specialty
    this.setData({ selectedSpecialty: specialty })
    this.filterCoaches()
  },

  // 筛选教练
  filterCoaches() {
    const { coachList, searchKeyword, selectedSpecialty } = this.data
    
    let filtered = coachList

    // 按关键词筛选
    if (searchKeyword) {
      filtered = filtered.filter(coach => 
        coach.name.includes(searchKeyword) ||
        coach.introduction.includes(searchKeyword)
      )
    }

    // 按擅长领域筛选
    if (selectedSpecialty) {
      filtered = filtered.filter(coach => 
        coach.specialties && coach.specialties.includes(selectedSpecialty)
      )
    }

    this.setData({ filteredCoachList: filtered })
  },

  // 点击教练卡片
  onCoachTap(e) {
    const coachId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/coach/detail/detail?id=${coachId}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoaches().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
