// 云函数：获取分类列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const categoriesCollection = db.collection('categories')

exports.main = async (event, context) => {
  const { kitchenId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const result = await categoriesCollection
      .where({ kitchenId })
      .orderBy('sortOrder', 'asc')
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取分类列表失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}