// pages/kitchen/kitchen.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

// 轮询间隔（毫秒）
const POLL_INTERVAL = 3000

Page({
  data: {
    theme: 'pink',
    kitchenInfo: {},
    categories: [],
    dishes: [],
    currentCategoryId: null,
    cartCount: 0,
    cartItems: [],
    cartExpanded: true,
    showSpecModal: false,
    selectedDish: {},
    selectedSpec: '',
    selectedQuantity: 1,
    // 搜索相关
    showSearch: false,
    searchKeyword: '',
    // 购物车弹窗
    showCartModal: false,
    // 下单状态
    isSubmitting: false,
    // 轮询相关
    lastOrderId: null,  // 记录上次检查的最后一个订单ID
    isChef: false       // 是否是厨师
  },

  onLoad: function () {
    this.checkLogin()
  },

  onShow: function () {
    this.loadTheme()
    this.loadData()
    // 厨师启动订单轮询
    this.startOrderPolling()
  },

  onHide: function () {
    // 停止轮询
    this.stopOrderPolling()
  },

  onUnload: function () {
    // 停止轮询
    this.stopOrderPolling()
  },

  // 加载主题
  loadTheme: function () {
    const theme = wx.getStorageSync('theme') || 'pink'
    this.setData({ theme })
    // 更新导航栏颜色
    const themeUtil = require('../../utils/theme')
    themeUtil.updateNavigationBarColor()
  },

  // 检查登录状态
  checkLogin: function () {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId || !userInfo._id) {
      // 清除不完整的用户信息
      wx.removeStorageSync('userInfo')
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    app.globalData.userInfo = userInfo
    // 记录是否是厨师
    this.setData({ isChef: userInfo.role === 'chef' })
  },

  // 加载数据
  loadData: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId || !userInfo._id) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 确保记录厨师角色
    this.setData({ isChef: userInfo.role === 'chef' })

    util.showLoading()

    // 并行加载厨房信息、分类、菜品、购物车
    Promise.all([
      api.getKitchen(userInfo.kitchenId),
      api.getCategories(userInfo.kitchenId),
      api.getDishes(userInfo.kitchenId),
      api.getCart(userInfo.kitchenId)
    ]).then(([kitchenRes, categoryRes, dishRes, cartRes]) => {
      util.hideLoading()

      // 处理厨房信息
      if (kitchenRes.success) {
        const kitchenInfo = kitchenRes.data
        // 处理厨房头像和横幅图片
        const kitchenImages = []
        if (kitchenInfo.avatar && kitchenInfo.avatar.startsWith('cloud://')) {
          kitchenImages.push(kitchenInfo.avatar)
        }
        if (kitchenInfo.banner && kitchenInfo.banner.startsWith('cloud://')) {
          kitchenImages.push(kitchenInfo.banner)
        }

        if (kitchenImages.length > 0) {
          util.getTempFileUrls(kitchenImages).then(urlList => {
            const urlMap = {}
            urlList.forEach(item => {
              urlMap[item.fileID] = item.tempFileURL
            })
            if (urlMap[kitchenInfo.avatar]) {
              kitchenInfo.avatar = urlMap[kitchenInfo.avatar]
            }
            if (urlMap[kitchenInfo.banner]) {
              kitchenInfo.banner = urlMap[kitchenInfo.banner]
            }
            this.setData({ kitchenInfo })
            app.globalData.kitchenInfo = kitchenInfo
          })
        }
        this.setData({ kitchenInfo })
        app.globalData.kitchenInfo = kitchenInfo
      }

      // 处理分类
      if (categoryRes.success && categoryRes.data.length > 0) {
        const firstCategoryId = categoryRes.data[0]._id
        this.setData({
          categories: categoryRes.data,
          currentCategoryId: firstCategoryId
        })
      }

      // 处理菜品 - 根据当前分类筛选
      if (dishRes.success) {
        const currentCategoryId = this.data.currentCategoryId
        let filteredDishes = dishRes.data
        if (currentCategoryId) {
          filteredDishes = dishRes.data.filter(d => d.categoryId === currentCategoryId)
        }
        // 处理图片URL（获取临时链接）
        this.processDishImages(filteredDishes)
      }

      // 处理购物车数量
      if (cartRes.success) {
        const count = cartRes.data.reduce((sum, item) => sum + item.quantity, 0)
        this.setData({ cartCount: count, cartItems: cartRes.data })
      }
    }).catch(err => {
      util.hideLoading()
      // 如果加载失败，可能是数据不存在，清除登录信息并跳转到登录页
      wx.removeStorageSync('userInfo')
      util.showError('加载失败，请重新登录')
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }, 1000)
    })
  },

  // 处理菜品图片URL（获取临时链接）
  processDishImages: function (dishes) {
    // 先设置数据，图片稍后更新
    this.setData({ dishes })

    // 收集云存储图片
    const cloudImages = []
    dishes.forEach(dish => {
      if (dish.image && dish.image.startsWith('cloud://')) {
        cloudImages.push(dish.image)
      }
    })

    if (cloudImages.length === 0) return

    // 获取临时链接
    util.getTempFileUrls(cloudImages).then(urlList => {
      const urlMap = {}
      urlList.forEach(item => {
        urlMap[item.fileID] = item.tempFileURL
      })

      // 更新菜品图片
      const updatedDishes = this.data.dishes.map(dish => {
        if (dish.image && urlMap[dish.image]) {
          return { ...dish, image: urlMap[dish.image] }
        }
        return dish
      })
      this.setData({ dishes: updatedDishes })
    })
  },

  // 选择分类
  onSelectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ currentCategoryId: categoryId })

    // 筛选菜品
    const userInfo = app.globalData.userInfo
    if (categoryId) {
      api.getDishes(userInfo.kitchenId, categoryId).then(res => {
        if (res.success) {
          this.processDishImages(res.data)
        }
      })
    }
  },

  // 添加到购物车
  onAddToCart: function (e) {
    const dish = e.currentTarget.dataset.dish

    if (dish.specs && dish.specs.length > 0) {
      // 有规格，显示弹窗
      this.setData({
        showSpecModal: true,
        selectedDish: dish,
        selectedSpec: dish.specs[0].name,
        selectedQuantity: 1
      })
    } else {
      // 无规格，直接添加
      this.addToCart(dish, '', 1)
    }
  },

  // 选择规格
  onSelectSpec: function (e) {
    this.setData({ selectedSpec: e.currentTarget.dataset.spec })
  },

  // 减少数量
  onDecreaseQuantity: function () {
    if (this.data.selectedQuantity > 1) {
      this.setData({ selectedQuantity: this.data.selectedQuantity - 1 })
    }
  },

  // 增加数量
  onIncreaseQuantity: function () {
    this.setData({ selectedQuantity: this.data.selectedQuantity + 1 })
  },

  // 确认添加
  onConfirmAdd: function () {
    const { selectedDish, selectedSpec, selectedQuantity } = this.data
    this.addToCart(selectedDish, selectedSpec, selectedQuantity)
    this.onCloseSpecModal()
  },

  // 添加到购物车
  addToCart: function (dish, spec, quantity) {
    const userInfo = app.globalData.userInfo

    api.addToCart({
      kitchenId: userInfo.kitchenId,
      dishId: dish._id,
      dishName: dish.name,
      dishImage: dish.image,
      spec: spec,
      quantity: quantity
    }).then(() => {
      util.showSuccess('已添加')
      this.setData({
        cartCount: this.data.cartCount + quantity
      })
      // 刷新购物车列表
      this.loadCartItems()
    }).catch(err => {
      util.showError(err || '添加失败')
    })
  },

  // 加载购物车内容
  loadCartItems: function () {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.kitchenId) return

    api.getCart(userInfo.kitchenId).then(res => {
      if (res.success) {
        const count = res.data.reduce((sum, item) => sum + item.quantity, 0)
        this.setData({ cartItems: res.data, cartCount: count })
        // 处理购物车图片
        this.processCartImages(res.data)
      }
    })
  },

  // 处理购物车图片URL
  processCartImages: function (cartItems) {
    const cloudImages = []
    cartItems.forEach(item => {
      if (item.dishImage && item.dishImage.startsWith('cloud://')) {
        cloudImages.push(item.dishImage)
      }
    })
    if (cloudImages.length === 0) return

    util.getTempFileUrls(cloudImages).then(urlList => {
      const urlMap = {}
      urlList.forEach(item => {
        urlMap[item.fileID] = item.tempFileURL
      })
      const updatedCart = this.data.cartItems.map(item => {
        if (item.dishImage && urlMap[item.dishImage]) {
          return { ...item, dishImage: urlMap[item.dishImage] }
        }
        return item
      })
      this.setData({ cartItems: updatedCart })
    })
  },

  // 关闭规格弹窗
  onCloseSpecModal: function () {
    this.setData({ showSpecModal: false })
  },

  // 阻止冒泡
  stopPropagation: function () {},

  // 切换购物车展开状态
  onToggleCart: function () {
    this.setData({ cartExpanded: !this.data.cartExpanded })
  },

  // 点击购物车
  onCartTap: function () {
    this.setData({ showCartModal: true })
    this.loadCartItems()
  },

  // 关闭购物车弹窗
  onCloseCartModal: function () {
    this.setData({ showCartModal: false })
  },

  // 减少购物车项数量
  onDecreaseCartItem: function (e) {
    const cartId = e.currentTarget.dataset.id
    const item = this.data.cartItems.find(i => i._id === cartId)
    if (!item) return

    if (item.quantity <= 1) {
      // 删除该项
      this.removeCartItem(cartId)
    } else {
      // 减少数量
      api.updateCart(cartId, { quantity: item.quantity - 1 }).then(() => {
        this.loadCartItems()
      }).catch(err => {
        util.showError('操作失败')
      })
    }
  },

  // 增加购物车项数量
  onIncreaseCartItem: function (e) {
    const cartId = e.currentTarget.dataset.id
    const item = this.data.cartItems.find(i => i._id === cartId)
    if (!item) return

    api.updateCart(cartId, { quantity: item.quantity + 1 }).then(() => {
      this.loadCartItems()
    }).catch(err => {
      util.showError('操作失败')
    })
  },

  // 删除购物车项
  removeCartItem: function (cartId) {
    api.removeFromCart(cartId).then(() => {
      this.loadCartItems()
    }).catch(err => {
      util.showError('删除失败')
    })
  },

  // 清空购物车
  onClearCart: function () {
    wx.showModal({
      title: '确认清空',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          const userInfo = app.globalData.userInfo
          api.clearCart(userInfo.kitchenId).then(() => {
            this.setData({ cartItems: [], cartCount: 0 })
            util.showSuccess('已清空')
          }).catch(err => {
            util.showError('清空失败')
          })
        }
      }
    })
  },

  // 邀请
  onInvite: function () {
    const kitchenInfo = this.data.kitchenInfo
    const kitchenId = kitchenInfo._id

    if (!kitchenId) {
      util.showInfo('厨房信息加载中，请稍后')
      return
    }

    // 计算当前食客数量（兼容新旧数据结构）
    let dinerCount = 0
    if (kitchenInfo.dinerIds && kitchenInfo.dinerIds.length > 0) {
      // 新数据结构：dinerIds 数组
      dinerCount = kitchenInfo.dinerIds.length
    } else if (kitchenInfo.dinerId) {
      // 旧数据结构：dinerId 单个
      dinerCount = 1
    }
    const remainingSlots = 3 - dinerCount

    wx.showModal({
      title: '邀请TA加入厨房',
      content: `厨房ID：${kitchenId}\n\n当前食客：${dinerCount}/3 人\n剩余名额：${remainingSlots} 人\n\n请让TA在登录页面点击"我有邀请码"输入此ID即可加入`,
      confirmText: '复制ID',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: kitchenId,
            success: () => {
              util.showSuccess('已复制厨房ID')
            }
          })
        }
      }
    })
  },

  // 下单
  onSubmitOrder: function () {
    if (this.data.isSubmitting) return

    const userInfo = app.globalData.userInfo

    // 获取购物车内容
    api.getCart(userInfo.kitchenId).then(res => {
      if (!res.success || res.data.length === 0) {
        util.showInfo('购物车是空的')
        return
      }

      // 构建订单项
      const items = res.data.map(item => ({
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
        spec: item.spec
      }))

      // 设置提交状态
      this.setData({ isSubmitting: true })

      // 创建订单
      api.createOrder({
        kitchenId: userInfo.kitchenId,
        items: items
      }).then(orderRes => {
        // 更新 lastOrderId，避免轮询误报
        if (orderRes.data && orderRes.data._id) {
          this.setData({ lastOrderId: orderRes.data._id })
        }
        // 清空购物车
        return api.clearCart(userInfo.kitchenId)
      }).then(() => {
        this.setData({
          isSubmitting: false,
          cartCount: 0,
          cartItems: [],
          showCartModal: false
        })
        util.showSuccess('下单成功')
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/orders/orders'
          })
        }, 500)
      }).catch(err => {
        this.setData({ isSubmitting: false })
        util.showError(err || '下单失败')
      })
    }).catch(err => {
      this.setData({ isSubmitting: false })
      util.showError('获取购物车失败')
    })
  },

  // 管理菜品
  onManageDishes: function () {
    wx.navigateTo({
      url: '/pages/manageDishes/manageDishes'
    })
  },

  // 添加菜品
  onAddDish: function () {
    wx.navigateTo({
      url: '/pages/addDish/addDish'
    })
  },

  // 搜索
  onToggleSearch: function () {
    this.setData({ showSearch: !this.data.showSearch, searchKeyword: '' })
    if (!this.data.showSearch) {
      // 关闭搜索时，重新加载当前分类的菜品
      this.loadData()
    }
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value.trim() })
  },

  // 搜索确认
  onSearchConfirm: function () {
    const keyword = this.data.searchKeyword
    if (!keyword) return

    const userInfo = app.globalData.userInfo
    util.showLoading()

    api.searchDishes(userInfo.kitchenId, keyword).then(res => {
      util.hideLoading()
      if (res.success) {
        this.setData({
          dishes: res.data,
          currentCategoryId: null // 搜索时取消分类选中
        })
      }
    }).catch(err => {
      util.hideLoading()
      util.showError('搜索失败')
    })
  },

  // 取消搜索
  onCancelSearch: function () {
    this.setData({ showSearch: false, searchKeyword: '' })
    this.loadData()
  },

  // 管理分类
  onManageCategories: function () {
    wx.navigateTo({
      url: '/pages/manageCategories/manageCategories'
    })
  },

  // 横幅点击
  onBannerTap: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        util.showLoading('上传中...')

        util.compressAndUpload(tempFilePath, `kitchen/banner/${Date.now()}.jpg`, 60)
          .then(fileID => {
            return api.updateKitchen({
              kitchenId: app.globalData.userInfo.kitchenId,
              banner: fileID
            })
          }).then(() => {
            util.hideLoading()
            util.showSuccess('已更新')
            this.setData({ 'kitchenInfo.banner': tempFilePath })
          }).catch(err => {
            util.hideLoading()
            util.showError('上传失败')
          })
      }
    })
  },

  // 头像点击
  onAvatarTap: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        util.showLoading('上传中...')

        util.compressAndUpload(tempFilePath, `kitchen/avatar/${Date.now()}.jpg`, 60)
          .then(fileID => {
            return api.updateKitchen({
              kitchenId: app.globalData.userInfo.kitchenId,
              avatar: fileID
            })
          }).then(() => {
            util.hideLoading()
            util.showSuccess('已更新')
            this.setData({ 'kitchenInfo.avatar': tempFilePath })
          }).catch(err => {
            util.hideLoading()
            util.showError('上传失败')
          })
      }
    })
  },

  // 分享
  onShareAppMessage: function () {
    const kitchenInfo = this.data.kitchenInfo
    return {
      title: `邀请你加入「${kitchenInfo.name || '我家厨房'}」`,
      path: `/pages/login/login?kitchenId=${kitchenInfo._id}`
    }
  },

  // ===== 订单轮询功能 =====

  // 启动订单轮询（仅厨师）
  startOrderPolling: function () {
    if (!this.data.isChef) return

    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    // 先获取当前最新订单ID作为基准
    this.getLastOrderId()

    // 设置定时器
    this.pollTimer = setInterval(() => {
      this.checkNewOrders()
    }, POLL_INTERVAL)
  },

  // 停止订单轮询
  stopOrderPolling: function () {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  // 获取当前最新订单ID
  getLastOrderId: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    api.getOrders(userInfo.kitchenId, 'pending').then(res => {
      if (res.success && res.data.length > 0) {
        // 按时间排序后取最新的
        const latestOrder = res.data[0]
        this.setData({ lastOrderId: latestOrder._id })
      }
    })
  },

  // 检查是否有新订单
  checkNewOrders: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    api.getOrders(userInfo.kitchenId, 'pending').then(res => {
      if (res.success && res.data.length > 0) {
        const latestOrder = res.data[0]
        const { lastOrderId } = this.data

        // 如果有新订单（ID不同）且不是自己下的单
        if (latestOrder._id !== lastOrderId) {
          // 检查是否是自己下的单（通过openid判断，这里用简化逻辑：如果刚下单后不会触发）
          // 更新lastOrderId
          this.setData({ lastOrderId: latestOrder._id })

          // 弹出提示并跳转
          wx.showModal({
            title: '新订单来了！',
            content: '有新的订单需要处理，点击查看',
            showCancel: false,
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.switchTab({
                  url: '/pages/orders/orders'
                })
              }
            }
          })
        }
      }
    })
  }
})