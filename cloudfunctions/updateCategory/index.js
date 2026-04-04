// 云函数：更新分类
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const categoriesCollection = db.collection('categories')

exports.main = async (event, context) => {
  const { categoryId, name, sortOrder } = event

  if (!categoryId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const updateData = { updatedAt: Date.now() }
    if (name !== undefined) updateData.name = name
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    await categoriesCollection.doc(categoryId).update({ data: updateData })
    return { success: true }
  } catch (err) {
    console.error('更新分类失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}