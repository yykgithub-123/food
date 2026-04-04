// 云函数：删除分类
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
    await categoriesCollection.doc(categoryId).remove()
    return { success: true }
  } catch (err) {
    console.error('删除分类失败:', err)
    return { success: false, errMsg: '删除失败' }
  }
}