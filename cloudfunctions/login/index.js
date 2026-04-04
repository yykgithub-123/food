// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (event.action) {
    case 'login':
      return await handleLogin(event, openid)
    case 'getUserInfo':
      return await handleGetUserInfo(openid)
    case 'updateUser':
      return await handleUpdateUser(event, openid)
    default:
      return {
        success: false,
        errMsg: '未知的操作类型'
      }
  }
}

// 处理登录
async function handleLogin(event, openid) {
  const { nickname, role, avatar } = event

  if (!nickname) {
    return {
      success: false,
      errMsg: '昵称不能为空'
    }
  }

  try {
    // 查找是否已存在用户
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length > 0) {
      // 用户已存在，更新信息
      const user = userResult.data[0]
      await usersCollection.doc(user._id).update({
        data: {
          nickname: nickname,
          role: role || user.role,
          avatar: avatar || user.avatar,
          updatedAt: Date.now()
        }
      })
      return {
        success: true,
        data: {
          ...user,
          nickname,
          role: role || user.role,
          avatar: avatar || user.avatar
        },
        isNewUser: false
      }
    } else {
      // 新用户，创建记录
      const result = await usersCollection.add({
        data: {
          openid: openid,
          nickname: nickname,
          role: role || 'diner',
          avatar: avatar || '',
          kitchenId: null,
          theme: 'pink',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      })

      return {
        success: true,
        data: {
          _id: result._id,
          openid: openid,
          nickname: nickname,
          role: role || 'diner',
          avatar: avatar || '',
          kitchenId: null,
          theme: 'pink'
        },
        isNewUser: true
      }
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      errMsg: '登录失败，请重试'
    }
  }
}

// 获取用户信息
async function handleGetUserInfo(openid) {
  try {
    const result = await usersCollection.where({
      openid: openid
    }).get()

    if (result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      }
    } else {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return {
      success: false,
      errMsg: '获取用户信息失败'
    }
  }
}

// 更新用户信息
async function handleUpdateUser(event, openid) {
  const { data } = event

  if (!data) {
    return {
      success: false,
      errMsg: '更新数据不能为空'
    }
  }

  try {
    // 获取用户
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const userId = userResult.data[0]._id

    // 过滤可更新的字段
    const allowedFields = ['nickname', 'avatar', 'role', 'theme', 'kitchenId']
    const updateData = {}
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key]
      }
    }
    updateData.updatedAt = Date.now()

    await usersCollection.doc(userId).update({
      data: updateData
    })

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('更新用户信息失败:', err)
    return {
      success: false,
      errMsg: '更新失败'
    }
  }
}