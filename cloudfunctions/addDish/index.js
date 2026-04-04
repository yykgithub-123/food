// 云函数：添加菜品
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const dishesCollection = db.collection('dishes')

exports.main = async (event, context) => {
  const { name, image, categoryId, kitchenId, specs } = event

  if (!name || !kitchenId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const result = await dishesCollection.add({
      data: {
        name,
        image: image || '',
        categoryId: categoryId || '',
        kitchenId,
        specs: specs || [{ name: '标准份' }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    return { success: true, data: { _id: result._id } }
  } catch (err) {
    console.error('添加菜品失败:', err)
    return { success: false, errMsg: '添加失败' }
  }
}