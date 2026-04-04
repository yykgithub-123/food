// 云函数：获取菜品列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const dishesCollection = db.collection('dishes')

exports.main = async (event, context) => {
  const { kitchenId, categoryId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    let query = { kitchenId }
    if (categoryId) {
      query.categoryId = categoryId
    }

    const result = await dishesCollection.where(query).orderBy('createdAt', 'desc').get()
    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取菜品列表失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}