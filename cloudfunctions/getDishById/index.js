// 云函数：获取单个菜品
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
    const result = await dishesCollection.doc(dishId).get()
    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取菜品失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}