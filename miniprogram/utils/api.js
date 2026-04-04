// utils/api.js - 云函数调用封装

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 传递的数据
 * @returns {Promise} 返回结果
 */
const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data
    }).then(res => {
      if (res.result && res.result.success) {
        resolve(res.result)
      } else {
        reject(res.result?.errMsg || '请求失败')
      }
    }).catch(err => {
      console.error(`云函数 ${name} 调用失败:`, err)
      reject('网络错误，请重试')
    })
  })
}

// ==================== 用户相关 ====================

/**
 * 用户登录/注册
 * @param {string} nickname 昵称
 * @param {string} role 角色（chef/diner）
 * @param {string} avatar 头像URL
 */
const login = (nickname, role, avatar) => {
  return callFunction('login', {
    action: 'login',
    nickname,
    role,
    avatar
  })
}

/**
 * 获取用户信息
 */
const getUserInfo = () => {
  return callFunction('login', {
    action: 'getUserInfo'
  })
}

/**
 * 更新用户信息
 * @param {object} data 要更新的数据
 */
const updateUserInfo = (data) => {
  return callFunction('login', {
    action: 'updateUser',
    data
  })
}

// ==================== 厨房相关 ====================

/**
 * 创建厨房
 * @param {object} data 厨房信息
 */
const createKitchen = (data) => {
  return callFunction('kitchen', {
    action: 'create',
    data
  })
}

/**
 * 获取厨房信息
 * @param {string} kitchenId 厨房ID
 */
const getKitchen = (kitchenId) => {
  return callFunction('kitchen', {
    action: 'get',
    kitchenId
  })
}

/**
 * 加入厨房
 * @param {string} kitchenId 厨房ID
 */
const joinKitchen = (kitchenId) => {
  return callFunction('kitchen', {
    action: 'join',
    kitchenId
  })
}

/**
 * 离开厨房
 * @param {string} kitchenId 厨房ID
 */
const leaveKitchen = (kitchenId) => {
  return callFunction('kitchen', {
    action: 'leave',
    kitchenId
  })
}

/**
 * 更新厨房信息
 * @param {object} data 要更新的数据
 */
const updateKitchen = (data) => {
  return callFunction('kitchen', {
    action: 'update',
    data
  })
}

// ==================== 分类相关 ====================

/**
 * 获取分类列表
 * @param {string} kitchenId 厨房ID
 */
const getCategories = (kitchenId) => {
  return callFunction('category', {
    action: 'list',
    kitchenId
  })
}

/**
 * 获取单个分类
 * @param {string} categoryId 分类ID
 */
const getCategory = (categoryId) => {
  return callFunction('category', {
    action: 'get',
    categoryId
  })
}

/**
 * 添加分类
 * @param {object} data 分类信息
 */
const addCategory = (data) => {
  return callFunction('category', {
    action: 'add',
    data
  })
}

/**
 * 更新分类
 * @param {string} categoryId 分类ID
 * @param {object} data 要更新的数据
 */
const updateCategory = (categoryId, data) => {
  return callFunction('category', {
    action: 'update',
    categoryId,
    data
  })
}

/**
 * 删除分类
 * @param {string} categoryId 分类ID
 */
const deleteCategory = (categoryId) => {
  return callFunction('category', {
    action: 'delete',
    categoryId
  })
}

/**
 * 更新分类排序
 * @param {array} categories 排序后的分类数组
 */
const sortCategories = (categories) => {
  return callFunction('category', {
    action: 'sort',
    categories
  })
}

// ==================== 菜品相关 ====================

/**
 * 获取菜品列表
 * @param {string} kitchenId 厨房ID
 * @param {string} categoryId 分类ID（可选）
 */
const getDishes = (kitchenId, categoryId = null) => {
  return callFunction('dish', {
    action: 'list',
    kitchenId,
    categoryId
  })
}

/**
 * 获取单个菜品
 * @param {string} dishId 菜品ID
 */
const getDishById = (dishId) => {
  return callFunction('dish', {
    action: 'getById',
    dishId
  })
}

/**
 * 搜索菜品
 * @param {string} kitchenId 厨房ID
 * @param {string} keyword 搜索关键词
 */
const searchDishes = (kitchenId, keyword) => {
  return callFunction('dish', {
    action: 'search',
    kitchenId,
    keyword
  })
}

/**
 * 添加菜品
 * @param {object} data 菜品信息
 */
const addDish = (data) => {
  return callFunction('dish', {
    action: 'add',
    data
  })
}

/**
 * 更新菜品
 * @param {string} dishId 菜品ID
 * @param {object} data 要更新的数据
 */
const updateDish = (dishId, data) => {
  return callFunction('dish', {
    action: 'update',
    dishId,
    data
  })
}

/**
 * 删除菜品
 * @param {string} dishId 菜品ID
 */
const deleteDish = (dishId) => {
  return callFunction('dish', {
    action: 'delete',
    dishId
  })
}

// ==================== 购物车相关 ====================

/**
 * 获取购物车列表
 * @param {string} kitchenId 厨房ID
 */
const getCart = (kitchenId) => {
  return callFunction('cart', {
    action: 'list',
    kitchenId
  })
}

/**
 * 添加到购物车
 * @param {object} data 购物车项信息
 */
const addToCart = (data) => {
  return callFunction('cart', {
    action: 'add',
    data
  })
}

/**
   * 更新购物车项
   * @param {string} cartId 购物车项ID
   * @param {object} data 要更新的数据
   */
  const updateCart = (cartId, data) => {
    return callFunction('cart', {
      action: 'update',
      cartId,
      data
    })
  }

/**
 * 移除购物车项
 * @param {string} cartId 购物车项ID
 */
const removeFromCart = (cartId) => {
  return callFunction('cart', {
    action: 'remove',
    cartId
  })
}

/**
 * 清空购物车
 * @param {string} kitchenId 厨房ID
 */
const clearCart = (kitchenId) => {
  return callFunction('cart', {
    action: 'clear',
    kitchenId
  })
}

// ==================== 订单相关 ====================

/**
 * 获取订单列表
 * @param {string} kitchenId 厨房ID
 * @param {string} status 状态筛选（可选）
 */
const getOrders = (kitchenId, status = null) => {
  return callFunction('order', {
    action: 'list',
    kitchenId,
    status
  })
}

/**
 * 创建订单
 * @param {object} data 订单信息
 */
const createOrder = (data) => {
  return callFunction('order', {
    action: 'create',
    data
  })
}

/**
 * 更新订单状态
 * @param {string} orderId 订单ID
 * @param {string} status 新状态
 */
const updateOrderStatus = (orderId, status) => {
  return callFunction('order', {
    action: 'updateStatus',
    orderId,
    status
  })
}

/**
 * 获取某日期的订单列表
 * @param {string} kitchenId 厨房ID
 * @param {string} date 日期（YYYY-MM-DD）
 */
const getOrdersByDate = (kitchenId, date) => {
  return callFunction('order', {
    action: 'getByDate',
    kitchenId,
    date
  })
}

// ==================== 照片相关 ====================

/**
 * 上传美食照片
 * @param {object} data 照片信息
 */
const uploadPhoto = (data) => {
  return callFunction('photo', {
    action: 'upload',
    data
  })
}

/**
 * 获取某日期的照片列表
 * @param {string} kitchenId 厨房ID
 * @param {string} date 日期（YYYY-MM-DD）
 */
const getPhotosByDate = (kitchenId, date) => {
  return callFunction('photo', {
    action: 'listByDate',
    kitchenId,
    date
  })
}

module.exports = {
  // 用户
  login,
  getUserInfo,
  updateUserInfo,
  // 厨房
  createKitchen,
  getKitchen,
  joinKitchen,
  leaveKitchen,
  updateKitchen,
  // 分类
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  sortCategories,
  // 菜品
  getDishes,
  getDishById,
  searchDishes,
  addDish,
  updateDish,
  deleteDish,
  // 购物车
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  // 订单
  getOrders,
  createOrder,
  updateOrderStatus,
  getOrdersByDate,
  // 照片
  uploadPhoto,
  getPhotosByDate
}