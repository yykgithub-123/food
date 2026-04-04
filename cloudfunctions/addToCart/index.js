// 云函数：添加到购物车
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const cartCollection = db.collection('cartItems')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { kitchenId, dishId, dishName, dishImage, spec, quantity } = event

  if (!kitchenId || !dishId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 检查是否已存在
    const existResult = await cartCollection.where({
      kitchenId, dishId, spec: spec || ''
    }).get()

    if (existResult.data.length > 0) {
      // 更新数量
      const existItem = existResult.data[0]
      const newQuantity = (existItem.quantity || 1) + (quantity || 1)
      await cartCollection.doc(existItem._id).update({
        data: { quantity: newQuantity }
      })
      return { success: true, data: { _id: existItem._id, quantity: newQuantity } }
    }

    // 新增
    const result = await cartCollection.add({
      data: {
        kitchenId, dishId, dishName, dishImage,
        spec: spec || '',
        quantity: quantity || 1,
        openid: wxContext.OPENID,
        createdAt: Date.now()
      }
    })

    return { success: true, data: { _id: result._id } }
  } catch (err) {
    console.error('添加购物车失败:', err)
    return { success: false, errMsg: '添加失败' }
  }
}