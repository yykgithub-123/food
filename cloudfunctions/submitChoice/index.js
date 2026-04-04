// 云函数：提交选择（下单）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const ordersCollection = db.collection('orders')
const cartCollection = db.collection('cartItems')

exports.main = async (event, context) => {
  const { kitchenId, items } = event

  if (!kitchenId || !items || items.length === 0) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 创建订单
    const orderResult = await ordersCollection.add({
      data: {
        kitchenId,
        items,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    // 清空购物车
    const cartItems = await cartCollection.where({ kitchenId }).get()
    const deleteTasks = cartItems.data.map(item =>
      cartCollection.doc(item._id).remove()
    )
    await Promise.all(deleteTasks)

    return { success: true, data: { orderId: orderResult._id } }
  } catch (err) {
    console.error('下单失败:', err)
    return { success: false, errMsg: '下单失败' }
  }
}