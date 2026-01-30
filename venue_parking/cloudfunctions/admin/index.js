// 云函数入口文件 - 管理员设置
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'setAdmin':
      return await setAdmin(event.targetOpenid, event.secretKey)
    case 'setSelfAdmin':
      return await setSelfAdmin(openid, event.secretKey)
    case 'getAdminList':
      return await getAdminList(openid)
    case 'removeAdmin':
      return await removeAdmin(openid, event.targetOpenid)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 设置管理员密钥（首次部署时需要修改）
const ADMIN_SECRET_KEY = 'your-admin-secret-key-2026'

// 将指定用户设为管理员
async function setAdmin(targetOpenid, secretKey) {
  try {
    // 验证密钥
    if (secretKey !== ADMIN_SECRET_KEY) {
      return {
        success: false,
        message: '密钥错误'
      }
    }

    if (!targetOpenid) {
      return {
        success: false,
        message: '请提供目标用户openid'
      }
    }

    const result = await usersCollection.where({
      _openid: targetOpenid
    }).update({
      data: {
        isAdmin: true,
        updateTime: db.serverDate()
      }
    })

    if (result.stats.updated === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    return {
      success: true,
      message: '设置管理员成功'
    }
  } catch (err) {
    console.error('设置管理员失败:', err)
    return {
      success: false,
      message: '设置管理员失败'
    }
  }
}

// 将当前用户设为管理员（需要密钥验证）
async function setSelfAdmin(openid, secretKey) {
  try {
    // 验证密钥
    if (secretKey !== ADMIN_SECRET_KEY) {
      return {
        success: false,
        message: '密钥错误'
      }
    }

    // 检查用户是否存在
    const userRes = await usersCollection.where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      // 用户不存在，创建新用户并设为管理员
      await usersCollection.add({
        data: {
          _openid: openid,
          nickName: '管理员',
          avatarUrl: '',
          phone: '',
          isAdmin: true,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 用户存在，更新为管理员
      await usersCollection.where({
        _openid: openid
      }).update({
        data: {
          isAdmin: true,
          updateTime: db.serverDate()
        }
      })
    }

    // 获取更新后的用户信息
    const updatedUser = await usersCollection.where({
      _openid: openid
    }).get()

    return {
      success: true,
      message: '设置管理员成功',
      userInfo: updatedUser.data[0]
    }
  } catch (err) {
    console.error('设置管理员失败:', err)
    return {
      success: false,
      message: '设置管理员失败'
    }
  }
}

// 获取管理员列表（仅管理员可用）
async function getAdminList(openid) {
  try {
    // 检查当前用户是否为管理员
    const currentUser = await usersCollection.where({
      _openid: openid
    }).get()

    if (currentUser.data.length === 0 || !currentUser.data[0].isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }

    // 获取所有管理员
    const adminList = await usersCollection.where({
      isAdmin: true
    }).get()

    return {
      success: true,
      data: adminList.data
    }
  } catch (err) {
    console.error('获取管理员列表失败:', err)
    return {
      success: false,
      message: '获取管理员列表失败'
    }
  }
}

// 移除管理员（仅管理员可用）
async function removeAdmin(operatorOpenid, targetOpenid) {
  try {
    // 检查操作者是否为管理员
    const operator = await usersCollection.where({
      _openid: operatorOpenid
    }).get()

    if (operator.data.length === 0 || !operator.data[0].isAdmin) {
      return {
        success: false,
        message: '无权限操作'
      }
    }

    // 不能移除自己的管理员权限
    if (operatorOpenid === targetOpenid) {
      return {
        success: false,
        message: '不能移除自己的管理员权限'
      }
    }

    await usersCollection.where({
      _openid: targetOpenid
    }).update({
      data: {
        isAdmin: false,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '移除管理员成功'
    }
  } catch (err) {
    console.error('移除管理员失败:', err)
    return {
      success: false,
      message: '移除管理员失败'
    }
  }
}
