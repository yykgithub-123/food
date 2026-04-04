// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const cartItemsCollection = db.collection('cartItems')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (event.action) {
    case 'list':
      return await handleList(event)
    case 'add':
      return await handleAdd(event, openid)
    case 'update':
      return await handleUpdate(event)
    case 'remove':
      return await handleRemove(event)
    case 'clear':
      return await handleClear(event, openid)
    default:
      return { success: false, errMsg: '未知的操作类型' }
  }
}

// 获取购物车列表
async function handleList(event) {
  const { kitchenId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '缺少厨房ID' }
  }

  try {
    const result = await cartItemsCollection
      .where({ kitchenId })
      .orderBy('createdAt', 'desc')
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取购物车失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 添加到购物车
async function handleAdd(event, openid) {
  const { data } = event

  if (!data || !data.kitchenId || !data.dishId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 检查是否已存在相同菜品和规格
    const existResult = await cartItemsCollection
      .where({
        kitchenId: data.kitchenId,
        dishId: data.dishId,
        spec: data.spec || ''
      })
      .get()

    if (existResult.data.length > 0) {
      // 已存在，更新数量
      const existItem = existResult.data[0]
      const newQuantity = (existItem.quantity || 1) + (data.quantity || 1)

      await cartItemsCollection.doc(existItem._id).update({
        data: { quantity: newQuantity }
      })

      return {
        success: true,
        data: { _id: existItem._id, quantity: newQuantity }
      }
    } else {
      // 不存在，新增
      const addResult = await cartItemsCollection.add({
        data: {
          kitchenId: data.kitchenId,
          dishId: data.dishId,
          dishName: data.dishName || '',
          dishImage: data.dishImage || '',
          quantity: data.quantity || 1,
          spec: data.spec || '',
          openid: openid,
          createdAt: Date.now()
        }
      })

      return {
        success: true,
        data: {
          _id: addResult._id,
          dishId: data.dishId,
          dishName: data.dishName,
          quantity: data.quantity || 1,
          spec: data.spec || ''
        }
      }
    }
  } catch (err) {
    console.error('添加到购物车失败:', err)
    return { success: false, errMsg: '添加失败' }
  }
}

// 更新购物车项
async function handleUpdate(event) {
  const { cartId, data } = event

  if (!cartId || !data) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const updateData = {}
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.spec !== undefined) updateData.spec = data.spec

    await cartItemsCollection.doc(cartId).update({ data: updateData })

    return { success: true, data: updateData }
  } catch (err) {
    console.error('更新购物车失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}

// 移除购物车项
async function handleRemove(event) {
  const { cartId } = event

  if (!cartId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    await cartItemsCollection.doc(cartId).remove()
    return { success: true }
  } catch (err) {
    console.error('移除购物车项失败:', err)
    return { success: false, errMsg: '移除失败' }
  }
}

// 清空购物车
async function handleClear(event, openid) {
  const { kitchenId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '缺少厨房ID' }
  }

  try {
    // 获取所有购物车项
    const result = await cartItemsCollection
      .where({ kitchenId })
      .get()

    // 批量删除
    const tasks = result.data.map(item =>
      cartItemsCollection.doc(item._id).remove()
    )
    await Promise.all(tasks)

    return { success: true }
  } catch (err) {
    console.error('清空购物车失败:', err)
    return { success: false, errMsg: '清空失败' }
  }
}