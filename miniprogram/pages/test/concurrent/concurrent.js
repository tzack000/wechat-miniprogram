// 并发预约测试页面
Page({
  data: {
    testScheduleId: '',
    testResults: null,
    testing: false,
    concurrency: 20, // 默认并发数
    testHistory: []
  },

  onLoad() {
    this.loadTestHistory()
  },

  // 步骤1：创建测试排期
  async setupTest() {
    wx.showLoading({ title: '创建测试排期...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'testConcurrentBooking',
        data: {
          action: 'setupTest'
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        const scheduleId = res.result.data.scheduleId
        this.setData({
          testScheduleId: scheduleId,
          testResults: null
        })

        wx.showModal({
          title: '测试排期创建成功',
          content: `课程: ${res.result.data.courseName}\n日期: ${res.result.data.date}\n时间: ${res.result.data.time}\n最大人数: ${res.result.data.maxStudents}\n\nscheduleId: ${scheduleId}`,
          showCancel: false,
          confirmText: '开始测试'
        })
      } else {
        wx.showModal({
          title: '创建失败',
          content: res.result.message,
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('创建测试排期失败:', error)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
    }
  },

  // 步骤2：运行并发测试
  async runTest() {
    if (!this.data.testScheduleId) {
      wx.showToast({
        title: '请先创建测试排期',
        icon: 'none'
      })
      return
    }

    if (this.data.testing) return

    this.setData({ testing: true })
    wx.showLoading({ title: `运行${this.data.concurrency}并发测试...` })

    try {
      const startTime = Date.now()
      
      const res = await wx.cloud.callFunction({
        name: 'testConcurrentBooking',
        data: {
          action: 'runConcurrentTest',
          scheduleId: this.data.testScheduleId,
          concurrency: this.data.concurrency
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      wx.hideLoading()

      if (res.result.success) {
        const testResult = {
          ...res.result.data,
          timestamp: new Date().toLocaleString(),
          clientDuration: `${duration}ms`
        }

        this.setData({
          testResults: testResult,
          testing: false
        })

        this.saveTestHistory(testResult)

        // 显示测试结果
        const passed = res.result.testPassed
        wx.showModal({
          title: passed ? '✓ 测试通过' : '✗ 测试失败',
          content: this.formatTestResult(testResult),
          showCancel: false,
          confirmText: '查看详情'
        })
      } else {
        wx.showModal({
          title: '测试执行失败',
          content: res.result.message,
          showCancel: false
        })
        this.setData({ testing: false })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('运行测试失败:', error)
      wx.showToast({
        title: '测试失败',
        icon: 'none'
      })
      this.setData({ testing: false })
    }
  },

  // 步骤3：检查结果
  async checkResults() {
    if (!this.data.testScheduleId) {
      wx.showToast({
        title: '请先创建测试排期',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '检查结果...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'testConcurrentBooking',
        data: {
          action: 'checkResults',
          scheduleId: this.data.testScheduleId
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        const data = res.result.data
        const passed = data.validation.testPassed

        wx.showModal({
          title: passed ? '✓ 验证通过' : '✗ 验证失败',
          content: this.formatCheckResult(data),
          showCancel: false
        })
      } else {
        wx.showModal({
          title: '检查失败',
          content: res.result.message,
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('检查结果失败:', error)
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      })
    }
  },

  // 清理测试数据
  async cleanup() {
    wx.showModal({
      title: '确认清理',
      content: '将删除测试排期和所有相关预约记录',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' })

          try {
            const result = await wx.cloud.callFunction({
              name: 'testConcurrentBooking',
              data: {
                action: 'cleanup',
                scheduleId: this.data.testScheduleId
              }
            })

            wx.hideLoading()

            if (result.result.success) {
              wx.showToast({
                title: '清理成功',
                icon: 'success'
              })

              this.setData({
                testScheduleId: '',
                testResults: null
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('清理失败:', error)
            wx.showToast({
              title: '清理失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 修改并发数
  onConcurrencyChange(e) {
    this.setData({
      concurrency: parseInt(e.detail.value) || 20
    })
  },

  // 格式化测试结果
  formatTestResult(result) {
    return `并发数: ${result.testConfig.concurrency}
最大人数: ${result.testConfig.maxStudents}
用时: ${result.testConfig.duration}

结果统计:
成功: ${result.results.successCount}
失败: ${result.results.failCount}
错误: ${result.results.errorCount}

最终状态:
已预约: ${result.finalState.bookedCount}
实际记录: ${result.finalState.actualBookings}
状态: ${result.finalState.status}

验证结果:
${result.validation.noOverbooking ? '✓' : '✗'} 无超额预约
${result.validation.dataConsistent ? '✓' : '✗'} 数据一致性
${result.validation.testPassed ? '✓' : '✗'} 总体通过`
  },

  // 格式化检查结果
  formatCheckResult(data) {
    let content = `排期信息:
最大人数: ${data.schedule.maxStudents}
已预约: ${data.schedule.bookedCount}
状态: ${data.schedule.status}

预约记录:
总数: ${data.bookings.total}
已确认: ${data.bookings.confirmed}
已取消: ${data.bookings.cancelled}

验证结果:
${data.validation.dataConsistent ? '✓' : '✗'} 数据一致
${data.validation.noOverbooking ? '✓' : '✗'} 无超额`

    if (data.issues.length > 0) {
      content += `\n\n问题:\n${data.issues.join('\n')}`
    }

    return content
  },

  // 保存测试历史
  saveTestHistory(result) {
    const history = this.data.testHistory
    history.unshift({
      timestamp: result.timestamp,
      passed: result.validation.testPassed,
      concurrency: result.testConfig.concurrency,
      duration: result.testConfig.duration
    })

    // 只保留最近10条
    if (history.length > 10) {
      history.pop()
    }

    this.setData({ testHistory: history })
    wx.setStorageSync('test_history', history)
  },

  // 加载测试历史
  loadTestHistory() {
    try {
      const history = wx.getStorageSync('test_history') || []
      this.setData({ testHistory: history })
    } catch (error) {
      console.error('加载测试历史失败:', error)
    }
  }
})
