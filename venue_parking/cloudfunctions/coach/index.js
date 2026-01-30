// 云函数入口文件 - 教练模块
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const coachesCollection = db.collection('coaches')
const coursesCollection = db.collection('courses')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getList':
      return await getList(event)
    case 'getDetail':
      return await getDetail(event.coachId)
    case 'add':
      return await addCoach(openid, event.coachData)
    case 'update':
      return await updateCoach(openid, event.coachId, event.coachData)
    case 'disable':
      return await setCoachStatus(openid, event.coachId, false)
    case 'enable':
      return await setCoachStatus(openid, event.coachId, true)
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

// 获取教练列表
async function getList(params) {
  try {
    const { specialty, pageSize = 20, page = 1 } = params
    
    const query = {
      enabled: true
    }
    
    // 按擅长领域筛选
    if (specialty) {
      query.specialties = _.in([specialty])
    }
    
    const countResult = await coachesCollection.where(query).count()
    const total = countResult.total
    
    const result = await coachesCollection
      .where(query)
      .orderBy('rating', 'desc')
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
    console.error('获取教练列表失败:', error)
    return {
      success: false,
      message: '获取教练列表失败',
      error: error.message
    }
  }
}

// 获取教练详情
async function getDetail(coachId) {
  try {
    if (!coachId) {
      return {
        success: false,
        message: '教练ID不能为空'
      }
    }
    
    // 获取教练信息
    const coachResult = await coachesCollection.doc(coachId).get()
    
    if (!coachResult.data) {
      return {
        success: false,
        message: '教练不存在'
      }
    }
    
    const coach = coachResult.data
    
    // 获取该教练可授课的课程
    const coursesResult = await coursesCollection
      .where({
        coachIds: _.in([coachId]),
        enabled: true
      })
      .get()
    
    return {
      success: true,
      data: {
        ...coach,
        courses: coursesResult.data
      }
    }
  } catch (error) {
    console.error('获取教练详情失败:', error)
    return {
      success: false,
      message: '获取教练详情失败',
      error: error.message
    }
  }
}

// 添加教练（管理员）
async function addCoach(openid, coachData) {
  try {
    // 检查管理员权限
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    // 验证必填字段
    if (!coachData.name) {
      return {
        success: false,
        message: '教练姓名不能为空'
      }
    }
    
    const now = new Date()
    const newCoach = {
      ...coachData,
      enabled: coachData.enabled !== false,
      rating: coachData.rating || 5.0,
      createTime: now,
      updateTime: now
    }
    
    const result = await coachesCollection.add({
      data: newCoach
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...newCoach
      },
      message: '添加教练成功'
    }
  } catch (error) {
    console.error('添加教练失败:', error)
    return {
      success: false,
      message: '添加教练失败',
      error: error.message
    }
  }
}

// 更新教练信息（管理员）
async function updateCoach(openid, coachId, coachData) {
  try {
    // 检查管理员权限
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!coachId) {
      return {
        success: false,
        message: '教练ID不能为空'
      }
    }
    
    const updateData = {
      ...coachData,
      updateTime: new Date()
    }
    
    // 移除不应该更新的字段
    delete updateData._id
    delete updateData._openid
    delete updateData.createTime
    
    await coachesCollection.doc(coachId).update({
      data: updateData
    })
    
    return {
      success: true,
      message: '更新教练信息成功'
    }
  } catch (error) {
    console.error('更新教练信息失败:', error)
    return {
      success: false,
      message: '更新教练信息失败',
      error: error.message
    }
  }
}

// 设置教练状态（管理员）
async function setCoachStatus(openid, coachId, enabled) {
  try {
    // 检查管理员权限
    const isAdmin = await checkAdmin(openid)
    if (!isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }
    
    if (!coachId) {
      return {
        success: false,
        message: '教练ID不能为空'
      }
    }
    
    await coachesCollection.doc(coachId).update({
      data: {
        enabled,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: enabled ? '启用教练成功' : '停用教练成功'
    }
  } catch (error) {
    console.error('设置教练状态失败:', error)
    return {
      success: false,
      message: '设置教练状态失败',
      error: error.message
    }
  }
}
