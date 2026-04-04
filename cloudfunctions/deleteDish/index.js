// 云函数：删除菜品
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const dishesCollection = db.collection('dishes')

exports.main = async (event, context) => {
  const { dishId } = event

  if (!dishId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    await dishesCollection.doc(dishId).remove()
    return { success: true }
  } catch (err) {
    console.error('删除菜品失败:', err)
    return { success: false, errMsg: '删除失败' }
  }
}