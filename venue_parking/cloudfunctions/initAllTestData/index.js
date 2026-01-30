// 统一的测试数据初始化云函数
// 整合场馆、课程、教练等所有测试数据的初始化
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// ============ 场馆数据 ============
const venuesData = [
  {
    name: '篮球场A',
    type: 'basketball',
    typeName: '篮球场',
    description: '标准室内篮球场，木地板，配备空调和照明设施。可容纳10人同时使用。',
    location: 'A栋1楼',
    capacity: 10,
    price: 100,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: ['images/venues/basketball_1.jpg'],
    facilities: ['空调', '照明', '更衣室', '饮水机'],
    rules: '1. 请穿运动鞋入场\n2. 请爱护场地设施\n3. 请勿携带食物入场',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '篮球场B',
    type: 'basketball',
    typeName: '篮球场',
    description: '室外标准篮球场，塑胶地面，夜间有照明。适合业余比赛。',
    location: 'B栋户外',
    capacity: 10,
    price: 60,
    priceUnit: '元/小时',
    openTime: '06:00',
    closeTime: '22:00',
    images: ['images/venues/basketball_2.jpg'],
    facilities: ['照明', '观众席'],
    rules: '1. 雨天暂停开放\n2. 请穿运动鞋入场',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '羽毛球馆1号场',
    type: 'badminton',
    typeName: '羽毛球场',
    description: '专业羽毛球场地，PVC运动地板，层高12米，灯光充足。',
    location: 'C栋2楼',
    capacity: 4,
    price: 50,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: ['images/venues/badminton_1.jpg'],
    facilities: ['空调', '照明', '更衣室', '球拍租借'],
    rules: '1. 请穿专业羽毛球鞋\n2. 可租借球拍（10元/副）',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '羽毛球馆2号场',
    type: 'badminton',
    typeName: '羽毛球场',
    description: '专业羽毛球场地，适合双打比赛。',
    location: 'C栋2楼',
    capacity: 4,
    price: 50,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: ['images/venues/badminton_2.jpg'],
    facilities: ['空调', '照明', '更衣室'],
    rules: '1. 请穿专业羽毛球鞋',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '游泳馆',
    type: 'swimming',
    typeName: '游泳池',
    description: '50米标准泳道，恒温水池，水深1.2-2米。配备专业救生员。',
    location: 'D栋负1楼',
    capacity: 50,
    price: 40,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '21:00',
    images: ['images/venues/swimming_1.jpg'],
    facilities: ['恒温', '淋浴间', '更衣室', '储物柜', '救生员'],
    rules: '1. 请佩戴泳帽\n2. 入池前请淋浴\n3. 禁止跳水\n4. 儿童需家长陪同',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    needApproval: true,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '乒乓球室',
    type: 'table_tennis',
    typeName: '乒乓球',
    description: '配备6张标准乒乓球台，空调开放。',
    location: 'A栋3楼',
    capacity: 12,
    price: 20,
    priceUnit: '元/小时',
    openTime: '08:00',
    closeTime: '22:00',
    images: ['images/venues/table_tennis_1.jpg'],
    facilities: ['空调', '照明', '球拍租借'],
    rules: '1. 请爱护球台\n2. 可租借球拍（5元/副）',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '健身房',
    type: 'gym',
    typeName: '健身房',
    description: '配备各类健身器材，包括跑步机、动感单车、力量训练区等。',
    location: 'E栋1楼',
    capacity: 30,
    price: 30,
    priceUnit: '元/次',
    openTime: '06:00',
    closeTime: '23:00',
    images: ['images/venues/gym_1.jpg'],
    facilities: ['空调', '淋浴间', '更衣室', '储物柜', '饮水机'],
    rules: '1. 请穿运动服装\n2. 使用器材后请归位\n3. 大重量训练请有人保护',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '网球场',
    type: 'tennis',
    typeName: '网球场',
    description: '室外硬地网球场，符合国际标准。夜间有灯光照明。',
    location: 'F栋户外',
    capacity: 4,
    price: 80,
    priceUnit: '元/小时',
    openTime: '06:00',
    closeTime: '22:00',
    images: ['images/venues/tennis_1.jpg'],
    facilities: ['照明', '观众席', '休息区'],
    rules: '1. 请穿网球鞋\n2. 雨天暂停开放',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '瑜伽室',
    type: 'yoga',
    typeName: '瑜伽室',
    description: '安静舒适的瑜伽练习空间，提供瑜伽垫和辅助器材。',
    location: 'E栋2楼',
    capacity: 15,
    price: 25,
    priceUnit: '元/次',
    openTime: '07:00',
    closeTime: '21:00',
    images: ['images/venues/yoga_1.jpg'],
    facilities: ['空调', '镜子', '瑜伽垫', '更衣室'],
    rules: '1. 请保持安静\n2. 请勿穿鞋入内\n3. 请提前10分钟到场',
    status: 'available',
    enabled: true,
    slotDuration: 60,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    name: '足球场（维护中）',
    type: 'football',
    typeName: '足球场',
    description: '标准11人制足球场，天然草坪。目前正在进行草坪维护。',
    location: 'G区户外',
    capacity: 22,
    price: 500,
    priceUnit: '元/场',
    openTime: '08:00',
    closeTime: '20:00',
    images: ['images/venues/football_1.jpg'],
    facilities: ['照明', '更衣室', '观众席'],
    rules: '1. 请穿足球鞋\n2. 禁止携带钉鞋',
    status: 'maintenance',
    enabled: false,
    slotDuration: 120,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
]

// ============ 教练数据 ============
function getCoachesData() {
  const now = new Date()
  return [
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
}

// ============ 课程数据 ============
function getCoursesData(coachIds) {
  const now = new Date()
  return [
    {
      name: '哈他瑜伽基础课',
      type: 'yoga',
      typeName: '瑜伽',
      description: '适合零基础学员，学习基本的瑜伽体式和呼吸法，帮助放松身心、改善体态。',
      duration: 60,
      price: 88,
      maxStudents: 15,
      coachIds: [coachIds[0]],
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
      coachIds: [coachIds[0]],
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
      coachIds: [coachIds[1]],
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
      coachIds: [coachIds[1]],
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
      coachIds: [coachIds[2]],
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
      coachIds: [coachIds[2]],
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
      coachIds: [coachIds[3]],
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
      coachIds: [coachIds[3]],
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
      coachIds: [coachIds[4]],
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
      coachIds: [coachIds[4]],
      venueId: null,
      images: ['images/courses/dance_2.jpg'],
      enabled: true,
      createTime: now,
      updateTime: now
    }
  ]
}

// ============ 停车配置数据 ============
const parkingConfigData = {
  totalSpaces: 200,
  availableSpaces: 180,
  visitorSpaces: 50,
  reservableSpaces: 30,
  maxReserveDays: 7,
  maxReserveHours: 4,
  rules: '1. 请按规定位置停放\n2. 访客请提前登记\n3. 预约车位请准时到达\n4. 超时占用将取消预约资格',
  openTime: '00:00',
  closeTime: '24:00',
  createTime: db.serverDate(),
  updateTime: db.serverDate()
}

// ============ 用户数据 ============
const usersData = [
  {
    _openid: 'test_admin_openid_001',
    nickName: '管理员张三',
    avatarUrl: '',
    phone: '13800138001',
    isAdmin: true,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    _openid: 'test_user_openid_001',
    nickName: '用户李四',
    avatarUrl: '',
    phone: '13800138002',
    isAdmin: false,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  },
  {
    _openid: 'test_user_openid_002',
    nickName: '用户王五',
    avatarUrl: '',
    phone: '13800138003',
    isAdmin: false,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
]

// ============ 工具函数 ============

// 清除所有数据
async function clearAllData() {
  const collections = [
    'venues', 'users', 'bookings', 'parking_records', 'parking_config',
    'coaches', 'courses', 'course_schedules', 'course_bookings'
  ]
  
  console.log('开始清除所有数据...')
  
  for (const collectionName of collections) {
    try {
      const countRes = await db.collection(collectionName).count()
      if (countRes.total > 0) {
        // 分批删除
        const batchSize = 100
        const batchTimes = Math.ceil(countRes.total / batchSize)
        
        for (let i = 0; i < batchTimes; i++) {
          const docs = await db.collection(collectionName).limit(batchSize).get()
          const deletePromises = docs.data.map(doc => 
            db.collection(collectionName).doc(doc._id).remove()
          )
          await Promise.all(deletePromises)
        }
        console.log(`集合 ${collectionName} 清除完成 (${countRes.total}条)`)
      }
    } catch (e) {
      console.log(`集合 ${collectionName} 清除失败或不存在:`, e.message)
    }
  }
  
  console.log('数据清除完成')
}

// 初始化场馆数据
async function initVenues() {
  console.log('初始化场馆数据...')
  const venueIds = []
  
  for (const venue of venuesData) {
    const res = await db.collection('venues').add({ data: venue })
    venueIds.push(res._id)
  }
  
  console.log(`场馆数据初始化完成: ${venueIds.length}个场馆`)
  return venueIds
}

// 初始化用户数据
async function initUsers() {
  console.log('初始化用户数据...')
  
  for (const user of usersData) {
    await db.collection('users').add({ data: user })
  }
  
  console.log(`用户数据初始化完成: ${usersData.length}个用户`)
  return usersData.map(u => u._openid)
}

// 初始化停车配置
async function initParkingConfig() {
  console.log('初始化停车配置...')
  await db.collection('parking_config').add({ data: parkingConfigData })
  console.log('停车配置初始化完成')
}

// 初始化教练数据
async function initCoaches() {
  console.log('初始化教练数据...')
  const coaches = getCoachesData()
  const coachIds = []
  
  for (const coach of coaches) {
    const res = await db.collection('coaches').add({ data: coach })
    coachIds.push(res._id)
  }
  
  console.log(`教练数据初始化完成: ${coachIds.length}个教练`)
  return coachIds
}

// 初始化课程数据
async function initCourses(coachIds) {
  console.log('初始化课程数据...')
  const courses = getCoursesData(coachIds)
  const courseData = []
  
  for (const course of courses) {
    const res = await db.collection('courses').add({ data: course })
    courseData.push({
      _id: res._id,
      coachId: course.coachIds[0]
    })
  }
  
  console.log(`课程数据初始化完成: ${courseData.length}个课程`)
  return courseData
}

// 初始化课程排期
async function initSchedules(courses) {
  console.log('初始化课程排期...')
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
  
  console.log(`课程排期初始化完成: ${schedules.length}个排期`)
  return schedules
}

// 生成示例预约数据
function generateBookingsData(venueIds, userOpenids) {
  const today = new Date()
  const bookings = []
  
  // 生成一些历史预约
  for (let i = 0; i < 5; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - i - 1)
    const dateStr = pastDate.toISOString().split('T')[0]
    
    bookings.push({
      _openid: userOpenids[i % 2 === 0 ? 1 : 2],
      venueId: venueIds[i % venueIds.length],
      venueName: venuesData[i % venuesData.length].name,
      date: dateStr,
      timeSlot: `${10 + i}:00-${11 + i}:00`,
      status: 'completed',
      totalPrice: venuesData[i % venuesData.length].price,
      contactName: i % 2 === 0 ? '李四' : '王五',
      contactPhone: i % 2 === 0 ? '13800138002' : '13800138003',
      remark: '测试历史预约',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    })
  }
  
  // 生成一些待处理的预约
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 1)
  const futureDateStr = futureDate.toISOString().split('T')[0]
  
  bookings.push({
    _openid: userOpenids[1],
    venueId: venueIds[0],
    venueName: venuesData[0].name,
    date: futureDateStr,
    timeSlot: '14:00-15:00',
    status: 'pending',
    totalPrice: venuesData[0].price,
    contactName: '李四',
    contactPhone: '13800138002',
    remark: '明天的篮球场预约',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  return bookings
}

// 初始化预约数据
async function initBookings(venueIds, userOpenids) {
  console.log('初始化预约数据...')
  const bookingsData = generateBookingsData(venueIds, userOpenids)
  
  for (const booking of bookingsData) {
    await db.collection('bookings').add({ data: booking })
  }
  
  console.log(`预约数据初始化完成: ${bookingsData.length}条预约`)
  return bookingsData.length
}

// 生成停车记录数据
function generateParkingRecordsData(userOpenids) {
  const today = new Date()
  const records = []
  
  // 当前在场车辆
  records.push({
    _openid: userOpenids[1],
    plateNumber: '粤A12345',
    ownerName: '李四',
    phone: '13800138002',
    type: 'visitor',
    typeName: '日常登记',
    purpose: '员工车辆',
    entryTime: db.serverDate(),
    exitTime: null,
    status: 'entered',
    remark: '员工车辆',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  // 访客预约
  records.push({
    _openid: userOpenids[1],
    plateNumber: '粤C11111',
    ownerName: '访客张先生',
    phone: '13900139001',
    type: 'visitor',
    typeName: '访客登记',
    purpose: '业务洽谈',
    visitee: '李四',
    expectedTime: db.serverDate(),
    status: 'pending',
    remark: '预计下午2点到达',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  })
  
  return records
}

// 初始化停车记录
async function initParkingRecords(userOpenids) {
  console.log('初始化停车记录...')
  const parkingRecordsData = generateParkingRecordsData(userOpenids)
  
  for (const record of parkingRecordsData) {
    await db.collection('parking_records').add({ data: record })
  }
  
  console.log(`停车记录初始化完成: ${parkingRecordsData.length}条记录`)
  return parkingRecordsData.length
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============ 云函数入口 ============
exports.main = async (event, context) => {
  const { 
    action = 'all', 
    clear = false,
    modules = ['venues', 'users', 'coaches', 'courses', 'parking']
  } = event
  
  try {
    const results = {
      success: true,
      message: '',
      data: {},
      summary: []
    }
    
    // 清除现有数据
    if (clear) {
      await clearAllData()
      results.data.cleared = true
      results.summary.push('✓ 清除现有数据完成')
    }
    
    let venueIds = []
    let userOpenids = []
    let coachIds = []
    let courseData = []
    
    // 根据action或modules参数决定初始化哪些模块
    const shouldInit = (module) => {
      return action === 'all' || action === module || modules.includes(module)
    }
    
    // 初始化用户数据（很多模块依赖用户数据）
    if (shouldInit('users')) {
      userOpenids = await initUsers()
      results.data.users = { count: usersData.length }
      results.summary.push(`✓ 用户: ${usersData.length}个`)
    }
    
    // 初始化场馆数据
    if (shouldInit('venues')) {
      venueIds = await initVenues()
      results.data.venues = { count: venueIds.length }
      results.summary.push(`✓ 场馆: ${venueIds.length}个`)
      
      // 如果有场馆和用户，初始化预约数据
      if (venueIds.length > 0 && userOpenids.length > 0) {
        const bookingCount = await initBookings(venueIds, userOpenids)
        results.data.bookings = { count: bookingCount }
        results.summary.push(`✓ 场馆预约: ${bookingCount}条`)
      }
    }
    
    // 初始化停车相关数据
    if (shouldInit('parking')) {
      await initParkingConfig()
      results.data.parkingConfig = { initialized: true }
      results.summary.push('✓ 停车配置: 已初始化')
      
      if (userOpenids.length > 0) {
        const parkingCount = await initParkingRecords(userOpenids)
        results.data.parkingRecords = { count: parkingCount }
        results.summary.push(`✓ 停车记录: ${parkingCount}条`)
      }
    }
    
    // 初始化教练数据
    if (shouldInit('coaches')) {
      coachIds = await initCoaches()
      results.data.coaches = { count: coachIds.length }
      results.summary.push(`✓ 教练: ${coachIds.length}个`)
    }
    
    // 初始化课程数据
    if (shouldInit('courses')) {
      // 如果没有教练ID，先获取
      if (coachIds.length === 0) {
        const coachesRes = await db.collection('coaches').limit(10).get()
        coachIds = coachesRes.data.map(c => c._id)
      }
      
      if (coachIds.length > 0) {
        courseData = await initCourses(coachIds)
        results.data.courses = { count: courseData.length }
        results.summary.push(`✓ 课程: ${courseData.length}个`)
        
        // 初始化课程排期
        const scheduleIds = await initSchedules(courseData)
        results.data.schedules = { count: scheduleIds.length }
        results.summary.push(`✓ 课程排期: ${scheduleIds.length}个`)
      }
    }
    
    results.message = '测试数据初始化完成！'
    console.log('所有数据初始化完成')
    
    return results
    
  } catch (error) {
    console.error('初始化测试数据失败:', error)
    return {
      success: false,
      message: '初始化失败: ' + error.message,
      error: error.toString()
    }
  }
}
