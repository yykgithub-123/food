// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const categoriesCollection = db.collection('categories')

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.action) {
    case 'list':
      return await handleList(event)
    case 'add':
      return await handleAdd(event)
    case 'update':
      return await handleUpdate(event)
    case 'delete':
      return await handleDelete(event)
    case 'sort':
      return await handleSort(event)
    default:
      return { success: false, errMsg: '未知的操作类型' }
  }
}

// 获取分类列表
async function handleList(event) {
  const { kitchenId } = event

  try {
    const result = await categoriesCollection
      .where({ kitchenId })
      .orderBy('sortOrder', 'asc')
      .get()

    return { success: true, data: result.data }
  } catch (err) {
    console.error('获取分类失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 添加分类
async function handleAdd(event) {
  const { data } = event

  if (!data || !data.kitchenId || !data.name) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 获取当前最大排序值
    const result = await categoriesCollection
      .where({ kitchenId: data.kitchenId })
      .orderBy('sortOrder', 'desc')
      .limit(1)
      .get()

    const maxOrder = result.data.length > 0 ? result.data[0].sortOrder : 0

    const addResult = await categoriesCollection.add({
      data: {
        name: data.name,
        kitchenId: data.kitchenId,
        sortOrder: maxOrder + 1,
        createdAt: Date.now()
      }
    })

    return {
      success: true,
      data: {
        _id: addResult._id,
        name: data.name,
        kitchenId: data.kitchenId,
        sortOrder: maxOrder + 1
      }
    }
  } catch (err) {
    console.error('添加分类失败:', err)
    return { success: false, errMsg: '添加失败' }
  }
}

// 更新分类
async function handleUpdate(event) {
  const { categoryId, data } = event

  if (!categoryId || !data) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const updateData = { updatedAt: Date.now() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder

    await categoriesCollection.doc(categoryId).update({ data: updateData })

    return { success: true, data: updateData }
  } catch (err) {
    console.error('更新分类失败:', err)
    return { success: false, errMsg: '更新失败' }
  }
}

// 删除分类
async function handleDelete(event) {
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

// 排序分类
async function handleSort(event) {
  const { categories } = event

  if (!categories || !Array.isArray(categories)) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    const tasks = categories.map((cat, index) =>
      categoriesCollection.doc(cat._id).update({
        data: { sortOrder: index }
      })
    )
    await Promise.all(tasks)

    return { success: true }
  } catch (err) {
    console.error('排序分类失败:', err)
    return { success: false, errMsg: '排序失败' }
  }
}