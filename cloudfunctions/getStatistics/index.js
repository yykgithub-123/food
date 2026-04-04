// 云函数：获取统计数据
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { kitchenId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 获取订单统计
    const ordersResult = await db.collection('orders').where({ kitchenId }).get()
    const orders = ordersResult.data

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length
    }

    // 获取菜品统计
    const dishesResult = await db.collection('dishes').where({ kitchenId }).count()
    stats.totalDishes = dishesResult.total

    // 获取分类统计
    const categoriesResult = await db.collection('categories').where({ kitchenId }).count()
    stats.totalCategories = categoriesResult.total

    return { success: true, data: stats }
  } catch (err) {
    console.error('获取统计失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}