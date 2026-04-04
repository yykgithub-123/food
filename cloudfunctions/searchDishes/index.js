// 云函数：搜索菜品
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const dishesCollection = db.collection('dishes')

exports.main = async (event, context) => {
  const { kitchenId, keyword } = event

  if (!kitchenId || !keyword) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const result = await dishesCollection.where({
      kitchenId,
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('搜索菜品失败:', err)
    return { success: false, errMsg: '搜索失败' }
  }
}