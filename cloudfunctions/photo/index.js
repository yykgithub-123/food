// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const photosCollection = db.collection('photos')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (event.action) {
    case 'upload':
      return await handleUpload(event, openid)
    case 'listByDate':
      return await handleListByDate(event)
    case 'delete':
      return await handleDelete(event, openid)
    default:
      return { success: false, errMsg: '未知的操作类型' }
  }
}

// 上传照片记录
async function handleUpload(event, openid) {
  const { data } = event

  if (!data || !data.kitchenId || !data.imageUrl || !data.date) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 获取用户ID
    const usersCollection = db.collection('users')
    const userResult = await usersCollection.where({ openid }).get()

    if (userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    const addResult = await photosCollection.add({
      data: {
        kitchenId: data.kitchenId,
        date: data.date,
        imageUrl: data.imageUrl,
        uploaderId: userId,
        createdAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        _id: addResult._id,
        kitchenId: data.kitchenId,
        date: data.date,
        imageUrl: data.imageUrl,
        uploaderId: userId
      }
    }
  } catch (err) {
    console.error('上传照片记录失败:', err)
    return { success: false, errMsg: '上传失败' }
  }
}

// 按日期获取照片列表
async function handleListByDate(event) {
  const { kitchenId, date } = event

  if (!kitchenId || !date) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const result = await photosCollection
      .where({
        kitchenId,
        date
      })
      .orderBy('createdAt', 'desc')
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取照片列表失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 删除照片
async function handleDelete(event, openid) {
  const { photoId } = event

  if (!photoId) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 获取照片信息
    const photoResult = await photosCollection.doc(photoId).get()

    if (!photoResult.data) {
      return { success: false, errMsg: '照片不存在' }
    }

    // 删除云存储中的图片
    if (photoResult.data.imageUrl) {
      try {
        await cloud.deleteFile({
          fileList: [photoResult.data.imageUrl]
        })
      } catch (e) {
        console.error('删除云存储文件失败:', e)
      }
    }

    // 删除数据库记录
    await photosCollection.doc(photoId).remove()

    return { success: true }
  } catch (err) {
    console.error('删除照片失败:', err)
    return { success: false, errMsg: '删除失败' }
  }
}