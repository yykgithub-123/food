// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const dishesCollection = db.collection('dishes')

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.action) {
    case 'list':
      return await handleList(event)
    case 'getById':
      return await handleGetById(event)
    case 'search':
      return await handleSearch(event)
    case 'add':
      return await handleAdd(event)
    case 'update':
      return await handleUpdate(event)
    case 'delete':
      return await handleDelete(event)
    default:
      return { success: false, errMsg: '未知的操作类型' }
  }
}

// 获取菜品列表
async function handleList(event) {
  const { kitchenId, categoryId } = event

  if (!kitchenId) {
    return { success: false, errMsg: '缺少厨房ID' }
  }

  try {
    let query = dishesCollection.where({ kitchenId })

    if (categoryId) {
      query = dishesCollection.where({ kitchenId, categoryId })
    }

    const result = await query.orderBy('createdAt', 'desc').get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取菜品失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 获取单个菜品
async function handleGetById(event) {
  const { dishId } = event

  if (!dishId) {
    return { success: false, errMsg: '缺少菜品ID' }
  }

  try {
    const result = await dishesCollection.doc(dishId).get()

    if (result.data) {
      return { success: true, data: result.data }
    } else {
      return { success: false, errMsg: '菜品不存在' }
    }
  } catch (err) {
    console.error('获取菜品失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 搜索菜品
async function handleSearch(event) {
  const { kitchenId, keyword } = event

  if (!kitchenId || !keyword) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 使用正则表达式搜索
    const db = cloud.database()
    const _ = db.command

    const result = await dishesCollection
      .where({
        kitchenId,
        name: _.regexp({
          regexp: keyword,
          options: 'i'
        })
      })
      .orderBy('createdAt', 'desc')
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('搜索菜品失败:', err)
    return { success: false, errMsg: '搜索失败' }
  }
}

// 添加菜品
async function handleAdd(event) {
  const { data } = event

  if (!data || !data.kitchenId || !data.name) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const addResult = await dishesCollection.add({
      data: {
        name: data.name,
        image: data.image || '',
        categoryId: data.categoryId || '',
        kitchenId: data.kitchenId,
        specs: data.specs || [{ name: '标准份' }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        _id: addResult._id,
        name: data.name,
        image: data.image || '',
        categoryId: data.categoryId || '',
        kitchenId: data.kitchenId,
        specs: data.specs || [{ name: '标准份' }]
      }
    }
  } catch (err) {
    console.error('添加菜品失败:', err)
    return { success: false, errMsg: '添加失败' }
  }
}

// 更新菜品
async function handleUpdate(event) {
  const { dishId, data } = event

  if (!dishId || !data) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const updateData = { updatedAt: Date.now() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.image !== undefined) updateData.image = data.image
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.specs !== undefined) updateData.specs = data.specs

    await dishesCollection.doc(dishId).update({ data: updateData })

    return { success: true, data: updateData }
  } catch (err) {
    console.error('更新菜品失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}

// 删除菜品
async function handleDelete(event) {
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