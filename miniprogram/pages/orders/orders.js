// pages/orders/orders.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    theme: 'pink',
    orders: [],
    currentStatus: 'all',
    isChef: false
  },

  onLoad: function () {
    this.checkRole()
  },

  onShow: function () {
    this.loadTheme()
    this.loadOrders()
  },

  // 加载主题
  loadTheme: function () {
    const theme = wx.getStorageSync('theme') || 'pink'
    this.setData({ theme })
    // 更新导航栏颜色
    const themeUtil = require('../../utils/theme')
    themeUtil.updateNavigationBarColor()
  },

  // 检查角色
  checkRole: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    this.setData({ isChef: userInfo && userInfo.role === 'chef' })
  },

  // 加载订单
  loadOrders: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    util.showLoading()

    api.getOrders(userInfo.kitchenId, this.data.currentStatus).then(res => {
      util.hideLoading()

      if (res.success) {
        // 格式化时间
        const orders = res.data.map(order => ({
          ...order,
          createdAtStr: util.formatDateSimple(order.createdAt)
        }))
        this.setData({ orders })
      }
    }).catch(err => {
      util.hideLoading()
      util.showError('加载失败')
    })
  },

  // 选择状态
  onSelectStatus: function (e) {
    const status = e.currentTarget.dataset.status
    this.setData({ currentStatus: status })
    this.loadOrders()
  },

  // 标记完成
  onCompleteOrder: function (e) {
    const orderId = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认',
      content: '确定标记此订单为已完成？',
      success: (res) => {
        if (res.confirm) {
          api.updateOrderStatus(orderId, 'completed').then(() => {
            util.showSuccess('已完成')
            this.loadOrders()
          }).catch(err => {
            util.showError(err || '操作失败')
          })
        }
      }
    })
  },

  // 取消订单
  onCancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认',
      content: '确定取消此订单？',
      success: (res) => {
        if (res.confirm) {
          api.updateOrderStatus(orderId, 'cancelled').then(() => {
            util.showSuccess('已取消')
            this.loadOrders()
          }).catch(err => {
            util.showError(err || '操作失败')
          })
        }
      }
    })
  }
})