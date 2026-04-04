// 云函数：获取单个分类
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const categoriesCollection = db.collection('categories')

exports.main = async (event, context) => {
  const { categoryId } = event

  if (!categoryId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const result = await categoriesCollection.doc(categoryId).get()
    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取分类失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}