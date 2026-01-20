// 并发预约测试云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, scheduleId, concurrency = 10 } = event
  
  try {
    switch (action) {
      case 'setupTest':
        return await setupTestSchedule()
      case 'runConcurrentTest':
        return await runConcurrentBookingTest(scheduleId, concurrency)
      case 'checkResults':
        return await checkTestResults(scheduleId)
      case 'cleanup':
        return await cleanupTestData(scheduleId)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('测试执行失败:', error)
    return {
      success: false,
      message: '测试执行失败',
      error: error.message,
      stack: error.stack
    }
  }
}

// 设置测试排期
async function setupTestSchedule() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dateStr = formatDate(tomorrow)
  
  // 查找一个课程和教练
  const courseRes = await db.collection('courses').limit(1).get()
  if (courseRes.data.length === 0) {
    return {
      success: false,
      message: '没有找到课程，请先初始化数据'
    }
  }
  
  const course = courseRes.data[0]
  const coachId = course.coachIds[0]
  
  // 创建一个只有10个名额的测试排期
  const testSchedule = {
    courseId: course._id,
    coachId: coachId,
    date: dateStr,
    startTime: '23:00',
    endTime: '23:59',
    maxStudents: 10, // 故意设置少量名额用于测试
    bookedCount: 0,
    status: 'available',
    venueId: null,
    isTestData: true, // 标记为测试数据
    createTime: now,
    updateTime: now
  }
  
  const result = await db.collection('course_schedules').add({
    data: testSchedule
  })
  
  return {
    success: true,
    message: '测试排期创建成功',
    data: {
      scheduleId: result._id,
      courseId: course._id,
      courseName: course.name,
      date: dateStr,
      time: '23:00-23:59',
      maxStudents: 10,
      testInfo: '请使用此 scheduleId 运行并发测试'
    }
  }
}

// 运行并发预约测试
async function runConcurrentBookingTest(scheduleId, concurrency) {
  if (!scheduleId) {
    return {
      success: false,
      message: 'scheduleId 不能为空'
    }
  }
  
  console.log(`开始并发测试: scheduleId=${scheduleId}, 并发数=${concurrency}`)
  
  // 获取排期信息
  const scheduleRes = await db.collection('course_schedules').doc(scheduleId).get()
  if (!scheduleRes.data) {
    return {
      success: false,
      message: '排期不存在'
    }
  }
  
  const schedule = scheduleRes.data
  const maxStudents = schedule.maxStudents
  
  console.log(`排期信息: 最大人数=${maxStudents}, 当前已预约=${schedule.bookedCount}`)
  
  // 获取课程和教练信息
  const courseRes = await db.collection('courses').doc(schedule.courseId).get()
  const coachRes = await db.collection('coaches').doc(schedule.coachId).get()
  
  const course = courseRes.data
  const coach = coachRes.data
  
  // 创建并发预约任务
  const bookingPromises = []
  const startTime = Date.now()
  
  for (let i = 0; i < concurrency; i++) {
    const bookingPromise = simulateBooking(
      scheduleId,
      schedule,
      course,
      coach,
      i
    )
    bookingPromises.push(bookingPromise)
  }
  
  // 等待所有预约完成
  const results = await Promise.allSettled(bookingPromises)
  const endTime = Date.now()
  const duration = endTime - startTime
  
  // 统计结果
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failCount = results.filter(r => r.status === 'fulfilled' && !r.value.success).length
  const errorCount = results.filter(r => r.status === 'rejected').length
  
  // 检查最终状态
  const finalSchedule = await db.collection('course_schedules').doc(scheduleId).get()
  const finalBookedCount = finalSchedule.data.bookedCount
  
  // 检查预约记录
  const bookingsRes = await db.collection('course_bookings')
    .where({
      scheduleId: scheduleId,
      status: 'confirmed'
    })
    .count()
  
  const actualBookingCount = bookingsRes.total
  
  // 判断测试是否通过
  const testPassed = (
    finalBookedCount <= maxStudents &&
    actualBookingCount <= maxStudents &&
    finalBookedCount === actualBookingCount
  )
  
  return {
    success: true,
    message: testPassed ? '并发测试通过 ✓' : '并发测试失败 ✗',
    testPassed,
    data: {
      testConfig: {
        scheduleId,
        maxStudents,
        concurrency,
        duration: `${duration}ms`
      },
      results: {
        successCount,
        failCount,
        errorCount,
        totalAttempts: concurrency
      },
      finalState: {
        bookedCount: finalBookedCount,
        actualBookings: actualBookingCount,
        status: finalSchedule.data.status
      },
      validation: {
        noOverbooking: finalBookedCount <= maxStudents,
        dataConsistent: finalBookedCount === actualBookingCount,
        testPassed
      },
      details: results.map((r, i) => ({
        attempt: i + 1,
        status: r.status === 'fulfilled' ? (r.value.success ? '成功' : '失败') : '错误',
        message: r.status === 'fulfilled' ? r.value.message : r.reason?.message || '未知错误'
      }))
    }
  }
}

// 模拟单次预约
async function simulateBooking(scheduleId, schedule, course, coach, index) {
  try {
    // 稍微随机延迟，模拟真实网络情况
    await sleep(Math.random() * 50)
    
    const now = new Date()
    const booking = {
      _openid: `test_user_${index}_${Date.now()}`, // 模拟不同用户
      scheduleId,
      courseId: schedule.courseId,
      courseName: course.name,
      coachId: schedule.coachId,
      coachName: coach.name,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: 'confirmed',
      userName: `测试用户${index}`,
      userPhone: `1380013${String(index).padStart(4, '0')}`,
      remark: `并发测试-${index}`,
      createTime: now,
      updateTime: now
    }
    
    // 开启事务
    const transaction = await db.startTransaction()
    
    try {
      // 检查排期状态
      const scheduleResult = await transaction.collection('course_schedules')
        .doc(scheduleId)
        .get()
      
      if (!scheduleResult.data) {
        throw new Error('排期不存在')
      }
      
      const currentSchedule = scheduleResult.data
      
      if (currentSchedule.status === 'cancelled') {
        throw new Error('排期已取消')
      }
      
      if (currentSchedule.bookedCount >= currentSchedule.maxStudents) {
        throw new Error('名额已满')
      }
      
      // 检查重复预约
      const existingBooking = await transaction.collection('course_bookings')
        .where({
          _openid: booking._openid,
          scheduleId,
          status: _.in(['confirmed', 'pending'])
        })
        .get()
      
      if (existingBooking.data.length > 0) {
        throw new Error('已预约该场次')
      }
      
      // 创建预约记录
      await transaction.collection('course_bookings').add({
        data: booking
      })
      
      // 更新排期人数
      const newBookedCount = currentSchedule.bookedCount + 1
      const newStatus = newBookedCount >= currentSchedule.maxStudents ? 'full' : 'available'
      
      await transaction.collection('course_schedules')
        .doc(scheduleId)
        .update({
          data: {
            bookedCount: newBookedCount,
            status: newStatus,
            updateTime: now
          }
        })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: '预约成功',
        index
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || '预约失败',
      index
    }
  }
}

// 检查测试结果
async function checkTestResults(scheduleId) {
  if (!scheduleId) {
    return {
      success: false,
      message: 'scheduleId 不能为空'
    }
  }
  
  // 获取排期信息
  const scheduleRes = await db.collection('course_schedules').doc(scheduleId).get()
  if (!scheduleRes.data) {
    return {
      success: false,
      message: '排期不存在'
    }
  }
  
  const schedule = scheduleRes.data
  
  // 获取所有预约记录
  const bookingsRes = await db.collection('course_bookings')
    .where({
      scheduleId: scheduleId
    })
    .get()
  
  const allBookings = bookingsRes.data
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed')
  
  // 检查数据一致性
  const isConsistent = schedule.bookedCount === confirmedBookings.length
  const noOverbooking = confirmedBookings.length <= schedule.maxStudents
  
  return {
    success: true,
    data: {
      schedule: {
        maxStudents: schedule.maxStudents,
        bookedCount: schedule.bookedCount,
        status: schedule.status
      },
      bookings: {
        total: allBookings.length,
        confirmed: confirmedBookings.length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length
      },
      validation: {
        dataConsistent: isConsistent,
        noOverbooking: noOverbooking,
        testPassed: isConsistent && noOverbooking
      },
      issues: [
        !isConsistent && `数据不一致: 排期显示${schedule.bookedCount}人，实际${confirmedBookings.length}人`,
        !noOverbooking && `名额超限: 最大${schedule.maxStudents}人，实际${confirmedBookings.length}人`
      ].filter(Boolean)
    }
  }
}

// 清理测试数据
async function cleanupTestData(scheduleId) {
  if (!scheduleId) {
    // 清理所有测试数据
    const schedulesRes = await db.collection('course_schedules')
      .where({
        isTestData: true
      })
      .get()
    
    for (const schedule of schedulesRes.data) {
      await cleanupScheduleData(schedule._id)
    }
    
    return {
      success: true,
      message: '所有测试数据已清理',
      cleaned: schedulesRes.data.length
    }
  } else {
    await cleanupScheduleData(scheduleId)
    return {
      success: true,
      message: '测试数据已清理'
    }
  }
}

async function cleanupScheduleData(scheduleId) {
  // 删除预约记录
  const bookingsRes = await db.collection('course_bookings')
    .where({
      scheduleId: scheduleId
    })
    .get()
  
  for (const booking of bookingsRes.data) {
    await db.collection('course_bookings').doc(booking._id).remove()
  }
  
  // 删除排期
  await db.collection('course_schedules').doc(scheduleId).remove()
}

// 辅助函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
