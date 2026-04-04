// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const ordersCollection = db.collection('orders')

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.action) {
    case 'list':
      return await handleList(event)
    case 'create':
      return await handleCreate(event)
    case 'updateStatus':
      return await handleUpdateStatus(event)
    case 'getByDate':
      return await handleGetByDate(event)
    default:
      return { success: false, errMsg: '未知的操作类型' }
  }
}

// 获取订单列表
async function handleList(event) {
  const { kitchenId, status } = event

  if (!kitchenId) {
    return { success: false, errMsg: '缺少厨房ID' }
  }

  try {
    let query = ordersCollection.where({ kitchenId })

    if (status && status !== 'all') {
      query = ordersCollection.where({ kitchenId, status })
    }

    const result = await query.orderBy('createdAt', 'desc').get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取订单失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 创建订单
async function handleCreate(event) {
  const { data } = event

  if (!data || !data.kitchenId || !data.items || data.items.length === 0) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const addResult = await ordersCollection.add({
      data: {
        kitchenId: data.kitchenId,
        items: data.items,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        _id: addResult._id,
        kitchenId: data.kitchenId,
        items: data.items,
        status: 'pending'
      }
    }
  } catch (err) {
    console.error('创建订单失败:', err)
    return { success: false, errMsg: '创建失败' }
  }
}

// 更新订单状态
async function handleUpdateStatus(event) {
  const { orderId, status } = event

  if (!orderId || !status) {
    return { success: false, errMsg: '参数错误' }
  }

  const validStatus = ['pending', 'completed', 'cancelled']
  if (!validStatus.includes(status)) {
    return { success: false, errMsg: '无效的状态' }
  }

  try {
    await ordersCollection.doc(orderId).update({
      data: {
        status: status,
        updatedAt: Date.now()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}

// 按日期获取订单（使用北京时间 UTC+8）
async function handleGetByDate(event) {
  const { kitchenId, date } = event

  if (!kitchenId || !date) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 使用北京时间 (UTC+8) 计算当天的开始和结束时间戳
    // date 格式: 'YYYY-MM-DD'
    const [year, month, day] = date.split('-').map(Number)

    // 北京时间当天 00:00:00 对应的 UTC 时间戳（减8小时）
    const beijingStartMs = new Date(year, month - 1, day).getTime()
    const utcStartMs = beijingStartMs - 8 * 60 * 60 * 1000

    // 北京时间当天 23:59:59 对应的 UTC 时间戳（加16小时后减1毫秒）
    const utcEndMs = utcStartMs + 24 * 60 * 60 * 1000 - 1

    const result = await ordersCollection
      .where({
        kitchenId,
        createdAt: _.gte(utcStartMs).and(_.lte(utcEndMs))
      })
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('按日期获取订单失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}