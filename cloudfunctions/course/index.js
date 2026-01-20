// 云函数入口文件 - 课程模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const coursesCollection = db.collection('courses')
const schedulesCollection = db.collection('course_schedules')
const bookingsCollection = db.collection('course_bookings')
const coachesCollection = db.collection('coaches')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    // 课程相关
    case 'getList':
      return await getList(event)
    case 'listByCoach':
      return await getList({ ...event, coachId: event.coachId })
    case 'getDetail':
      return await getDetail(event.courseId)
    case 'add':
      return await addCourse(openid, event.courseData)
    case 'update':
      return await updateCourse(openid, event.courseId, event.courseData)
    case 'disable':
      return await setCourseStatus(openid, event.courseId, false)
    case 'enable':
      return await setCourseStatus(openid, event.courseId, true)
    
    // 排期相关
    case 'getSchedules':
      return await getSchedules(event)
    case 'addSchedule':
      return await addSchedule(openid, event.scheduleData)
    case 'cancelSchedule':
      return await cancelSchedule(openid, event.scheduleId)
    
    // 预约相关
    case 'book':
      return await bookCourse(openid, event.bookingData)
    case 'getMyBookings':
      return await getMyBookings(openid, event)
    case 'cancelBooking':
      return await cancelBooking(openid, event.bookingId)
    case 'getBookingDetail':
      return await getBookingDetail(openid, event.bookingId)
    
    // 管理员功能
    case 'getAllBookings':
      return await getAllBookings(openid, event)
    case 'adminCancelBooking':
      return await adminCancelBooking(openid, event.bookingId)
    
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 检查是否为管理员
async function checkAdmin(openid) {
  const userRes = await usersCollection.where({
    _openid: openid
  }).get()
  
  return userRes.data.length > 0 && userRes.data[0].isAdmin === true
}

// 获取课程列表
async function getList(params) {
  try {
    const { type, coachId, pageSize = 20, page = 1 } = params
    
    const query = {
      enabled: true
    }
    
    if (type) {
      query.type = type
    }
    
    if (coachId) {
      query.coachIds = _.in([coachId])
    }
    
    const countResult = await coursesCollection.where(query).count()
    const total = countResult.total
    
    const result = await coursesCollection
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: result.data,
      total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    return {
      success: false,
      message: '获取课程列表失败',
      error: error.message
    }
  }
}

// 获取课程详情
async function getDetail(courseId) {
  try {
    if (!courseId) {
      return {
        success: false,
        message: '课程ID不能为空'
      }
    }
    
    const courseResult = await coursesCollection.doc(courseId).get()
    
    if (!courseResult.data) {
      return {
        success: false,
        message: '课程不存在'
      }
    }
    
    const course = courseResult.data
    
    // 获取可授课的教练信息
    if (course.coachIds && course.coachIds.length > 0) {
      const coachesResult = await coachesCollection
        .where({
          _id: _.in(course.coachIds),
          enabled: true
        })
        .get()
      
      course.coaches = coachesResult.data
    }
    
    return {
      success: true,
      data: course
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
    return {
      success: false,
      message: '获取课程详情失败',
      error: error.message
    }
  }
}

// 添加课程（管理员）
async function addCourse(openid, courseData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!courseData.name) {
      return {
        success: false,
        message: '课程名称不能为空'
      }
    }
    
    const now = new Date()
    const newCourse = {
      ...courseData,
      enabled: courseData.enabled !== false,
      createTime: now,
      updateTime: now
    }
    
    const result = await coursesCollection.add({
      data: newCourse
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...newCourse
      },
      message: '添加课程成功'
    }
  } catch (error) {
    console.error('添加课程失败:', error)
    return {
      success: false,
      message: '添加课程失败',
      error: error.message
    }
  }
}

// 更新课程（管理员）
async function updateCourse(openid, courseId, courseData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!courseId) {
      return {
        success: false,
        message: '课程ID不能为空'
      }
    }
    
    const updateData = {
      ...courseData,
      updateTime: new Date()
    }
    
    delete updateData._id
    delete updateData._openid
    delete updateData.createTime
    
    await coursesCollection.doc(courseId).update({
      data: updateData
    })
    
    return {
      success: true,
      message: '更新课程成功'
    }
  } catch (error) {
    console.error('更新课程失败:', error)
    return {
      success: false,
      message: '更新课程失败',
      error: error.message
    }
  }
}

// 设置课程状态（管理员）
async function setCourseStatus(openid, courseId, enabled) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!courseId) {
      return {
        success: false,
        message: '课程ID不能为空'
      }
    }
    
    await coursesCollection.doc(courseId).update({
      data: {
        enabled,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: enabled ? '启用课程成功' : '停用课程成功'
    }
  } catch (error) {
    console.error('设置课程状态失败:', error)
    return {
      success: false,
      message: '设置课程状态失败',
      error: error.message
    }
  }
}

// 获取课程排期
async function getSchedules(params) {
  try {
    const { courseId, coachId, date, startDate, endDate } = params
    
    if (!courseId) {
      return {
        success: false,
        message: '课程ID不能为空'
      }
    }
    
    const query = {
      courseId,
      status: _.neq('cancelled')
    }
    
    if (coachId) {
      query.coachId = coachId
    }
    
    if (date) {
      query.date = date
    } else if (startDate && endDate) {
      query.date = _.gte(startDate).and(_.lte(endDate))
    }
    
    const result = await schedulesCollection
      .where(query)
      .orderBy('date', 'asc')
      .orderBy('startTime', 'asc')
      .get()
    
    // 为每个排期添加教练信息
    const schedules = result.data
    if (schedules.length > 0) {
      const coachIds = [...new Set(schedules.map(s => s.coachId))]
      const coachesResult = await coachesCollection
        .where({
          _id: _.in(coachIds)
        })
        .get()
      
      const coachMap = {}
      coachesResult.data.forEach(coach => {
        coachMap[coach._id] = coach
      })
      
      schedules.forEach(schedule => {
        schedule.coachInfo = coachMap[schedule.coachId] || null
        schedule.availableSeats = schedule.maxStudents - schedule.bookedCount
      })
    }
    
    return {
      success: true,
      data: schedules
    }
  } catch (error) {
    console.error('获取课程排期失败:', error)
    return {
      success: false,
      message: '获取课程排期失败',
      error: error.message
    }
  }
}

// 添加课程排期（管理员）
async function addSchedule(openid, scheduleData) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const { courseId, coachId, date, startTime, endTime, maxStudents, venueId } = scheduleData
    
    if (!courseId || !coachId || !date || !startTime || !endTime) {
      return {
        success: false,
        message: '必填信息不完整'
      }
    }
    
    const now = new Date()
    const newSchedule = {
      courseId,
      coachId,
      date,
      startTime,
      endTime,
      maxStudents: maxStudents || 20,
      bookedCount: 0,
      status: 'available',
      venueId: venueId || null,
      createTime: now,
      updateTime: now
    }
    
    const result = await schedulesCollection.add({
      data: newSchedule
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...newSchedule
      },
      message: '添加排期成功'
    }
  } catch (error) {
    console.error('添加排期失败:', error)
    return {
      success: false,
      message: '添加排期失败',
      error: error.message
    }
  }
}

// 取消排期（管理员）
async function cancelSchedule(openid, scheduleId) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!scheduleId) {
      return {
        success: false,
        message: '排期ID不能为空'
      }
    }
    
    // 更新排期状态
    await schedulesCollection.doc(scheduleId).update({
      data: {
        status: 'cancelled',
        updateTime: new Date()
      }
    })
    
    // 取消所有相关预约
    await bookingsCollection.where({
      scheduleId,
      status: _.in(['pending', 'confirmed'])
    }).update({
      data: {
        status: 'cancelled',
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '取消排期成功'
    }
  } catch (error) {
    console.error('取消排期失败:', error)
    return {
      success: false,
      message: '取消排期失败',
      error: error.message
    }
  }
}

// 预约课程
async function bookCourse(openid, bookingData) {
  try {
    const { scheduleId, userName, userPhone, remark } = bookingData
    
    if (!scheduleId || !userName || !userPhone) {
      return {
        success: false,
        message: '必填信息不完整'
      }
    }
    
    // 获取排期信息
    const scheduleResult = await schedulesCollection.doc(scheduleId).get()
    if (!scheduleResult.data) {
      return {
        success: false,
        message: '排期不存在'
      }
    }
    
    const schedule = scheduleResult.data
    
    // 检查排期状态
    if (schedule.status === 'cancelled') {
      return {
        success: false,
        message: '该排期已取消'
      }
    }
    
    if (schedule.status === 'full' || schedule.bookedCount >= schedule.maxStudents) {
      return {
        success: false,
        message: '该场次名额已满'
      }
    }
    
    // 检查是否已预约
    const existingBooking = await bookingsCollection.where({
      _openid: openid,
      scheduleId,
      status: _.in(['confirmed', 'pending'])
    }).get()
    
    if (existingBooking.data.length > 0) {
      return {
        success: false,
        message: '您已预约该场次课程'
      }
    }
    
    // 获取课程和教练信息
    const courseResult = await coursesCollection.doc(schedule.courseId).get()
    const coachResult = await coachesCollection.doc(schedule.coachId).get()
    
    const course = courseResult.data
    const coach = coachResult.data
    
    // 开启事务
    const transaction = await db.startTransaction()
    
    try {
      // 创建预约记录
      const now = new Date()
      const booking = {
        _openid: openid,
        scheduleId,
        courseId: schedule.courseId,
        courseName: course.name,
        coachId: schedule.coachId,
        coachName: coach.name,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: 'confirmed',
        userName,
        userPhone,
        remark: remark || '',
        createTime: now,
        updateTime: now
      }
      
      const bookingResult = await transaction.collection('course_bookings').add({
        data: booking
      })
      
      // 更新排期的已预约人数
      const newBookedCount = schedule.bookedCount + 1
      const newStatus = newBookedCount >= schedule.maxStudents ? 'full' : 'available'
      
      await transaction.collection('course_schedules').doc(scheduleId).update({
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
        data: {
          _id: bookingResult._id,
          ...booking
        },
        message: '预约成功'
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('预约课程失败:', error)
    return {
      success: false,
      message: '预约课程失败，请重试',
      error: error.message
    }
  }
}

// 获取我的预约
async function getMyBookings(openid, params) {
  try {
    const { status, pageSize = 20, page = 1 } = params
    
    const query = {
      _openid: openid
    }
    
    if (status) {
      query.status = status
    }
    
    const countResult = await bookingsCollection.where(query).count()
    const total = countResult.total
    
    const result = await bookingsCollection
      .where(query)
      .orderBy('date', 'desc')
      .orderBy('startTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: result.data,
      total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取我的预约失败:', error)
    return {
      success: false,
      message: '获取我的预约失败',
      error: error.message
    }
  }
}

// 取消预约
async function cancelBooking(openid, bookingId) {
  try {
    if (!bookingId) {
      return {
        success: false,
        message: '预约ID不能为空'
      }
    }
    
    // 获取预约信息
    const bookingResult = await bookingsCollection.doc(bookingId).get()
    if (!bookingResult.data) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    const booking = bookingResult.data
    
    // 验证是否为本人预约
    if (booking._openid !== openid) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    // 检查预约状态
    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return {
        success: false,
        message: '该预约无法取消'
      }
    }
    
    // 检查是否超过可取消时间（课程开始前2小时）
    const now = new Date()
    const courseDateTime = new Date(`${booking.date} ${booking.startTime}`)
    const timeDiff = courseDateTime - now
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    if (hoursDiff < 2) {
      return {
        success: false,
        message: '已超过可取消时间（课程开始前2小时），无法取消'
      }
    }
    
    // 开启事务
    const transaction = await db.startTransaction()
    
    try {
      // 更新预约状态
      await transaction.collection('course_bookings').doc(bookingId).update({
        data: {
          status: 'cancelled',
          updateTime: new Date()
        }
      })
      
      // 更新排期的已预约人数
      const scheduleResult = await transaction.collection('course_schedules')
        .doc(booking.scheduleId).get()
      
      if (scheduleResult.data) {
        const schedule = scheduleResult.data
        const newBookedCount = Math.max(0, schedule.bookedCount - 1)
        const newStatus = newBookedCount >= schedule.maxStudents ? 'full' : 'available'
        
        await transaction.collection('course_schedules').doc(booking.scheduleId).update({
          data: {
            bookedCount: newBookedCount,
            status: newStatus,
            updateTime: new Date()
          }
        })
      }
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: '取消预约成功'
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('取消预约失败:', error)
    return {
      success: false,
      message: '取消预约失败',
      error: error.message
    }
  }
}

// 获取预约详情
async function getBookingDetail(openid, bookingId) {
  try {
    if (!bookingId) {
      return {
        success: false,
        message: '预约ID不能为空'
      }
    }
    
    const bookingResult = await bookingsCollection.doc(bookingId).get()
    if (!bookingResult.data) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    const booking = bookingResult.data
    
    // 验证是否为本人预约
    if (booking._openid !== openid) {
      return {
        success: false,
        message: '无权限查看'
      }
    }
    
    return {
      success: true,
      data: booking
    }
  } catch (error) {
    console.error('获取预约详情失败:', error)
    return {
      success: false,
      message: '获取预约详情失败',
      error: error.message
    }
  }
}

// 获取所有预约（管理员）
async function getAllBookings(openid, params) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    const { courseId, coachId, date, status, pageSize = 20, page = 1 } = params
    
    const query = {}
    
    if (courseId) {
      query.courseId = courseId
    }
    
    if (coachId) {
      query.coachId = coachId
    }
    
    if (date) {
      query.date = date
    }
    
    if (status) {
      query.status = status
    }
    
    const countResult = await bookingsCollection.where(query).count()
    const total = countResult.total
    
    const result = await bookingsCollection
      .where(query)
      .orderBy('date', 'desc')
      .orderBy('startTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      success: true,
      data: result.data,
      total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取所有预约失败:', error)
    return {
      success: false,
      message: '获取所有预约失败',
      error: error.message
    }
  }
}

// 管理员取消预约
async function adminCancelBooking(openid, bookingId) {
  try {
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!bookingId) {
      return {
        success: false,
        message: '预约ID不能为空'
      }
    }
    
    // 获取预约信息
    const bookingResult = await bookingsCollection.doc(bookingId).get()
    if (!bookingResult.data) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    const booking = bookingResult.data
    
    // 开启事务
    const transaction = await db.startTransaction()
    
    try {
      // 更新预约状态
      await transaction.collection('course_bookings').doc(bookingId).update({
        data: {
          status: 'cancelled',
          updateTime: new Date()
        }
      })
      
      // 更新排期的已预约人数
      if (booking.status === 'confirmed' || booking.status === 'pending') {
        const scheduleResult = await transaction.collection('course_schedules')
          .doc(booking.scheduleId).get()
        
        if (scheduleResult.data) {
          const schedule = scheduleResult.data
          const newBookedCount = Math.max(0, schedule.bookedCount - 1)
          const newStatus = newBookedCount >= schedule.maxStudents ? 'full' : 'available'
          
          await transaction.collection('course_schedules').doc(booking.scheduleId).update({
            data: {
              bookedCount: newBookedCount,
              status: newStatus,
              updateTime: new Date()
            }
          })
        }
      }
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: '取消预约成功'
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('取消预约失败:', error)
    return {
      success: false,
      message: '取消预约失败',
      error: error.message
    }
  }
}
