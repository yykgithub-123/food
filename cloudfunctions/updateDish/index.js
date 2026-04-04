// 云函数：更新菜品
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const dishesCollection = db.collection('dishes')

exports.main = async (event, context) => {
  const { dishId, name, image, categoryId, specs } = event

  if (!dishId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const updateData = { updatedAt: Date.now() }
    if (name !== undefined) updateData.name = name
    if (image !== undefined) updateData.image = image
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (specs !== undefined) updateData.specs = specs

    await dishesCollection.doc(dishId).update({ data: updateData })
    return { success: true }
  } catch (err) {
    console.error('更新菜品失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}