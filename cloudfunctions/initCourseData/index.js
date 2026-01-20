// 课程数据初始化云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action = 'init', clear = false } = event
  
  try {
    let result = {}
    
    if (action === 'init' || action === 'all') {
      if (clear) {
        await clearAllData()
        result.cleared = true
      }
      
      // 初始化教练数据
      const coaches = await initCoaches()
      result.coaches = coaches
      
      // 初始化课程数据
      const courses = await initCourses(coaches)
      result.courses = courses
      
      // 初始化排期数据
      const schedules = await initSchedules(courses, coaches)
      result.schedules = schedules
    }
    
    return {
      success: true,
      message: '数据初始化成功',
      data: result
    }
  } catch (error) {
    console.error('数据初始化失败:', error)
    return {
      success: false,
      message: '数据初始化失败',
      error: error.message
    }
  }
}

// 清除所有数据
async function clearAllData() {
  const collections = ['coaches', 'courses', 'course_schedules', 'course_bookings']
  
  for (const collectionName of collections) {
    const { data } = await db.collection(collectionName).get()
    for (const doc of data) {
      await db.collection(collectionName).doc(doc._id).remove()
    }
  }
}

// 初始化教练数据
async function initCoaches() {
  const now = new Date()
  const coaches = [
    {
      name: '张教练',
      avatar: 'cloud://prod-xxx.7072-prod-xxx/avatars/coach1.png',
      title: '高级瑜伽导师',
      introduction: '10年瑜伽教学经验，擅长哈他瑜伽、阴瑜伽和流瑜伽，持有国际瑜伽联盟RYT-500认证。',
      specialties: ['瑜伽', '普拉提', '冥想'],
      certifications: ['国际瑜伽联盟RYT-500', '普拉提教练资格证'],
      rating: 4.9,
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '李教练',
      avatar: 'cloud://prod-xxx.7072-prod-xxx/avatars/coach2.png',
      title: '游泳国家一级教练',
      introduction: '前省队游泳运动员，15年游泳教学经验，擅长自由泳、蛙泳、蝶泳教学。',
      specialties: ['游泳', '水上运动'],
      certifications: ['游泳国家一级教练证', '救生员资格证'],
      rating: 5.0,
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '王教练',
      avatar: 'cloud://prod-xxx.7072-prod-xxx/avatars/coach3.png',
      title: '篮球职业教练',
      introduction: 'CBA退役球员，专注青少年篮球培训，擅长篮球基本功和战术训练。',
      specialties: ['篮球', '体能训练'],
      certifications: ['中国篮球协会E级教练证', '体能训练师证书'],
      rating: 4.8,
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '刘教练',
      avatar: 'cloud://prod-xxx.7072-prod-xxx/avatars/coach4.png',
      title: '健身私教',
      introduction: '国家级健身教练，精通增肌减脂、功能性训练和康复训练。',
      specialties: ['健身', '增肌减脂', '康复训练'],
      certifications: ['国家健身教练职业资格证', '运动康复师证'],
      rating: 4.7,
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '陈教练',
      avatar: 'cloud://prod-xxx.7072-prod-xxx/avatars/coach5.png',
      title: '舞蹈编导',
      introduction: '专业舞蹈学院毕业，擅长爵士舞、街舞、拉丁舞教学。',
      specialties: ['舞蹈', '爵士舞', '街舞'],
      certifications: ['中国舞蹈家协会教师资格证', '爵士舞考级教师证'],
      rating: 4.9,
      enabled: true,
      createTime: now,
      updateTime: now
    }
  ]
  
  const coachIds = []
  for (const coach of coaches) {
    const res = await db.collection('coaches').add({ data: coach })
    coachIds.push(res._id)
  }
  
  return coachIds
}

// 初始化课程数据
async function initCourses(coachIds) {
  const now = new Date()
  const courses = [
    {
      name: '哈他瑜伽基础课',
      type: 'yoga',
      typeName: '瑜伽',
      description: '适合零基础学员，学习基本的瑜伽体式和呼吸法，帮助放松身心、改善体态。',
      duration: 60,
      price: 88,
      maxStudents: 15,
      coachIds: [coachIds[0]], // 张教练
      venueId: null,
      images: ['images/courses/yoga_1.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '流瑜伽进阶课',
      type: 'yoga',
      typeName: '瑜伽',
      description: '适合有一定基础的学员，通过连贯的动作流动提升力量和柔韧性。',
      duration: 75,
      price: 108,
      maxStudents: 12,
      coachIds: [coachIds[0]], // 张教练
      venueId: null,
      images: ['images/courses/yoga_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '自由泳基础班',
      type: 'swimming',
      typeName: '游泳',
      description: '从零基础开始学习自由泳，掌握正确的划水、打腿和换气技巧。',
      duration: 60,
      price: 120,
      maxStudents: 8,
      coachIds: [coachIds[1]], // 李教练
      venueId: null,
      images: ['images/courses/swimming_1.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '蛙泳提高课',
      type: 'swimming',
      typeName: '游泳',
      description: '针对有蛙泳基础的学员，纠正动作细节，提升游泳速度和效率。',
      duration: 60,
      price: 120,
      maxStudents: 8,
      coachIds: [coachIds[1]], // 李教练
      venueId: null,
      images: ['images/courses/swimming_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '篮球基础训练',
      type: 'basketball',
      typeName: '篮球',
      description: '学习篮球基本功：运球、传球、投篮，适合青少年和成人初学者。',
      duration: 90,
      price: 150,
      maxStudents: 10,
      coachIds: [coachIds[2]], // 王教练
      venueId: null,
      images: ['images/courses/basketball_1.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '篮球战术进阶',
      type: 'basketball',
      typeName: '篮球',
      description: '学习篮球进攻和防守战术，提升团队配合能力。',
      duration: 90,
      price: 180,
      maxStudents: 10,
      coachIds: [coachIds[2]], // 王教练
      venueId: null,
      images: ['images/courses/basketball_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '增肌塑形私教课',
      type: 'fitness',
      typeName: '健身',
      description: '一对一私教课程，根据个人目标制定训练计划，科学增肌塑形。',
      duration: 60,
      price: 200,
      maxStudents: 1,
      coachIds: [coachIds[3]], // 刘教练
      venueId: null,
      images: ['images/courses/fitness_1.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '减脂燃脂团课',
      type: 'fitness',
      typeName: '健身',
      description: '高强度间歇训练（HIIT），快速燃烧卡路里，适合减脂人群。',
      duration: 45,
      price: 68,
      maxStudents: 20,
      coachIds: [coachIds[3]], // 刘教练
      venueId: null,
      images: ['images/courses/fitness_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '爵士舞入门',
      type: 'dance',
      typeName: '舞蹈',
      description: '学习爵士舞基础动作和节奏感，适合零基础学员。',
      duration: 60,
      price: 98,
      maxStudents: 15,
      coachIds: [coachIds[4]], // 陈教练
      venueId: null,
      images: ['images/courses/dance_1.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    },
    {
      name: '街舞基础班',
      type: 'dance',
      typeName: '舞蹈',
      description: '学习街舞基本律动和简单舞步，释放活力，展现自我。',
      duration: 60,
      price: 98,
      maxStudents: 15,
      coachIds: [coachIds[4]], // 陈教练
      venueId: null,
      images: ['images/courses/dance_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    }
  ]
  
  const courseData = []
  for (const course of courses) {
    const res = await db.collection('courses').add({ data: course })
    courseData.push({
      _id: res._id,
      coachId: course.coachIds[0]
    })
  }
  
  return courseData
}

// 初始化排期数据
async function initSchedules(courses, coachIds) {
  const now = new Date()
  const schedules = []
  
  // 为每个课程创建未来7天的排期
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    
    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)
      const dateStr = formatDate(date)
      
      // 每天创建2-3个时段
      const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '14:00', end: '15:00' },
        { start: '19:00', end: '20:00' }
      ]
      
      for (const slot of timeSlots) {
        const schedule = {
          courseId: course._id,
          coachId: course.coachId,
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          maxStudents: 15,
          bookedCount: 0,
          status: 'available',
          venueId: null,
          createTime: now,
          updateTime: now
        }
        
        const res = await db.collection('course_schedules').add({ data: schedule })
        schedules.push(res._id)
      }
    }
  }
  
  return schedules
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
