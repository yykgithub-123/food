// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const kitchensCollection = db.collection('kitchens')
const usersCollection = db.collection('users')

// 最大食客数量
const MAX_DINERS = 3

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (event.action) {
    case 'create':
      return await handleCreate(event, openid)
    case 'get':
      return await handleGet(event)
    case 'join':
      return await handleJoin(event, openid)
    case 'leave':
      return await handleLeave(event, openid)
    case 'update':
      return await handleUpdate(event, openid)
    default:
      return {
        success: false,
        errMsg: '未知的操作类型'
      }
  }
}

// 创建厨房
async function handleCreate(event, openid) {
  const { name, avatar, banner, intro } = event.data || {}

  if (!name) {
    return {
      success: false,
      errMsg: '厨房名称不能为空'
    }
  }

  try {
    // 获取当前用户
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userResult.data[0]

    // 创建厨房
    const kitchenResult = await kitchensCollection.add({
      data: {
        name: name,
        avatar: avatar || '',
        banner: banner || '',
        intro: intro || '粒粒今天吃什么',
        chefId: user._id,
        dinerIds: [],  // 改为数组，支持多个食客
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    // 更新用户的 kitchenId
    await usersCollection.doc(user._id).update({
      data: {
        kitchenId: kitchenResult._id,
        role: 'chef',
        updatedAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        _id: kitchenResult._id,
        name: name,
        avatar: avatar || '',
        banner: banner || '',
        intro: intro || '粒粒今天吃什么',
        chefId: user._id,
        dinerIds: []
      }
    }
  } catch (err) {
    console.error('创建厨房失败:', err)
    return {
      success: false,
      errMsg: '创建失败，请重试'
    }
  }
}

// 获取厨房信息
async function handleGet(event) {
  const { kitchenId } = event

  if (!kitchenId) {
    return {
      success: false,
      errMsg: '厨房ID不能为空'
    }
  }

  try {
    const result = await kitchensCollection.doc(kitchenId).get()

    if (result.data) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        errMsg: '厨房不存在'
      }
    }
  } catch (err) {
    console.error('获取厨房信息失败:', err)
    return {
      success: false,
      errMsg: '获取失败'
    }
  }
}

// 加入厨房
async function handleJoin(event, openid) {
  const { kitchenId } = event

  if (!kitchenId) {
    return {
      success: false,
      errMsg: '厨房ID不能为空'
    }
  }

  try {
    // 获取当前用户
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userResult.data[0]

    // 检查用户是否已在某个厨房中
    if (user.kitchenId && user.kitchenId !== kitchenId) {
      return {
        success: false,
        errMsg: '您已在其他厨房中'
      }
    }

    // 获取厨房
    const kitchenResult = await kitchensCollection.doc(kitchenId).get()

    if (!kitchenResult.data) {
      return {
        success: false,
        errMsg: '厨房不存在'
      }
    }

    const kitchen = kitchenResult.data

    // 检查是否已是该厨房成员
    if (user.kitchenId === kitchenId) {
      return {
        success: true,
        data: kitchen,
        message: '您已在该厨房中'
      }
    }

    // 计算当前食客数量（兼容新旧数据结构）
    let dinerIds = kitchen.dinerIds || []
    let currentDinerCount = dinerIds.length

    // 兼容旧数据：如果有 dinerId 但没有 dinerIds
    if (kitchen.dinerId && !kitchen.dinerIds) {
      dinerIds = [kitchen.dinerId]
      currentDinerCount = 1
    }

    if (currentDinerCount >= MAX_DINERS) {
      return {
        success: false,
        errMsg: '该厨房食客已满（最多3人）'
      }
    }

    // 更新厨房的 dinerIds 数组
    await kitchensCollection.doc(kitchenId).update({
      data: {
        dinerIds: _.push(user._id),
        // 清除旧的 dinerId 字段
        dinerId: _.remove(),
        updatedAt: Date.now()
      }
    })

    // 更新用户的 kitchenId 和 role
    await usersCollection.doc(user._id).update({
      data: {
        kitchenId: kitchenId,
        role: 'diner',
        updatedAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        ...kitchen,
        dinerIds: [...dinerIds, user._id]
      }
    }
  } catch (err) {
    console.error('加入厨房失败:', err)
    return {
      success: false,
      errMsg: '加入失败，请重试'
    }
  }
}

// 离开厨房
async function handleLeave(event, openid) {
  const { kitchenId } = event

  if (!kitchenId) {
    return {
      success: false,
      errMsg: '厨房ID不能为空'
    }
  }

  try {
    // 获取当前用户
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userResult.data[0]

    // 获取厨房
    const kitchenResult = await kitchensCollection.doc(kitchenId).get()

    if (!kitchenResult.data) {
      return {
        success: false,
        errMsg: '厨房不存在'
      }
    }

    const kitchen = kitchenResult.data

    // 从 dinerIds 数组中移除用户
    await kitchensCollection.doc(kitchenId).update({
      data: {
        dinerIds: _.pull(user._id),
        updatedAt: Date.now()
      }
    })

    // 更新用户的 kitchenId
    await usersCollection.doc(user._id).update({
      data: {
        kitchenId: null,
        role: 'diner',
        updatedAt: Date.now()
      }
    })

    return {
      success: true,
      message: '已离开厨房'
    }
  } catch (err) {
    console.error('离开厨房失败:', err)
    return {
      success: false,
      errMsg: '离开失败，请重试'
    }
  }
}

// 更新厨房信息
async function handleUpdate(event, openid) {
  const { data } = event

  if (!data || !data.kitchenId) {
    return {
      success: false,
      errMsg: '参数错误'
    }
  }

  try {
    // 验证用户权限
    const userResult = await usersCollection.where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userResult.data[0]

    if (user.kitchenId !== data.kitchenId) {
      return {
        success: false,
        errMsg: '无权限'
      }
    }

    // 过滤可更新的字段
    const allowedFields = ['name', 'avatar', 'banner', 'intro']
    const updateData = {}
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key]
      }
    }
    updateData.updatedAt = Date.now()

    await kitchensCollection.doc(data.kitchenId).update({
      data: updateData
    })

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('更新厨房信息失败:', err)
    return {
      success: false,
      errMsg: '更新失败'
    }
  }
}