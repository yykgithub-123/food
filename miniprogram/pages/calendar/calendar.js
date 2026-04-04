// pages/calendar/calendar.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    theme: 'pink',
    year: 2026,
    month: 4,
    days: [],
    selectedDate: null,
    selectedDateStr: '',
    dayOrders: [],
    dayOrderDishes: [], // 当天订单的菜品名称列表
    dayPhotos: [],
    orderDates: [] // 有订单的日期列表
  },

  onLoad: function () {
    const now = new Date()
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    })
  },

  onShow: function () {
    this.loadTheme()
    this.loadOrderDates()
    this.generateCalendar()
  },

  // 加载主题
  loadTheme: function () {
    const theme = wx.getStorageSync('theme') || 'pink'
    this.setData({ theme })
    // 更新导航栏颜色
    const themeUtil = require('../../utils/theme')
    themeUtil.updateNavigationBarColor()
  },

  // 加载有订单的日期
  loadOrderDates: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    // 获取当月所有订单
    api.getOrders(userInfo.kitchenId).then(res => {
      if (res.success) {
        const orderDates = res.data.map(order => {
          // 使用北京时间 (UTC+8) 解析时间戳
          const timestamp = order.createdAt
          const beijingTime = new Date(timestamp + 8 * 60 * 60 * 1000)
          return `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')}`
        })
        this.setData({ orderDates })
        this.generateCalendar()
      }
    })
  },

  // 生成日历
  generateCalendar: function () {
    const { year, month, orderDates } = this.data
    const days = []

    const firstDay = util.getFirstDayOfMonth(year, month)
    const daysInMonth = util.getDaysInMonth(year, month)

    const today = util.getTodayStr()

    // 填充空白天数
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', date: '', hasOrder: false, isToday: false })
    }

    // 填充实际天数
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({
        day: i,
        date: date,
        hasOrder: orderDates.includes(date),
        isToday: date === today
      })
    }

    this.setData({ days })
  },

  // 上个月
  onPrevMonth: function () {
    let { year, month } = this.data
    month--
    if (month < 1) {
      month = 12
      year--
    }
    this.setData({ year, month, selectedDate: null })
    this.loadOrderDates()
  },

  // 下个月
  onNextMonth: function () {
    let { year, month } = this.data
    month++
    if (month > 12) {
      month = 1
      year++
    }
    this.setData({ year, month, selectedDate: null })
    this.loadOrderDates()
  },

  // 选择日期
  onSelectDate: function (e) {
    const { date, hasOrder } = e.currentTarget.dataset
    if (!date) return

    this.setData({
      selectedDate: date,
      selectedDateStr: date
    })

    // 加载当天数据
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.kitchenId) return

    // 获取当天订单
    api.getOrdersByDate(userInfo.kitchenId, date).then(res => {
      const orders = res.success ? res.data : []
      // 计算菜品名称列表
      const dayOrderDishes = []
      orders.forEach(order => {
        order.items.forEach(item => {
          dayOrderDishes.push(item.dishName)
        })
      })
      this.setData({ dayOrders: orders, dayOrderDishes })
    })

    // 获取当天照片
    api.getPhotosByDate(userInfo.kitchenId, date).then(res => {
      if (res.success) {
        // 处理图片URL
        this.processPhotoImages(res.data)
      }
    })
  },

  // 处理照片图片URL
  processPhotoImages: function (photos) {
    // 先设置数据
    this.setData({ dayPhotos: photos })

    // 收集云存储图片
    const cloudImages = []
    photos.forEach(photo => {
      if (photo.imageUrl && photo.imageUrl.startsWith('cloud://')) {
        cloudImages.push(photo.imageUrl)
      }
    })

    if (cloudImages.length === 0) return

    // 获取临时链接
    util.getTempFileUrls(cloudImages).then(urlList => {
      const urlMap = {}
      urlList.forEach(item => {
        urlMap[item.fileID] = item.tempFileURL
      })

      // 更新照片图片
      const updatedPhotos = this.data.dayPhotos.map(photo => {
        if (photo.imageUrl && urlMap[photo.imageUrl]) {
          return { ...photo, imageUrl: urlMap[photo.imageUrl] }
        }
        return photo
      })
      this.setData({ dayPhotos: updatedPhotos })
    })
  },

  // 上传照片
  onUploadPhoto: function () {
    const { selectedDate } = this.data
    const userInfo = app.globalData.userInfo

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath

        util.showLoading('上传中...')

        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: `photos/${Date.now()}.jpg`,
          filePath: tempFilePath
        }).then(uploadRes => {
          // 保存照片记录
          return api.uploadPhoto({
            kitchenId: userInfo.kitchenId,
            date: selectedDate,
            imageUrl: uploadRes.fileID
          })
        }).then(() => {
          util.hideLoading()
          util.showSuccess('上传成功')
          // 刷新照片列表
          api.getPhotosByDate(userInfo.kitchenId, selectedDate).then(res => {
            this.setData({ dayPhotos: res.success ? res.data : [] })
          })
        }).catch(err => {
          util.hideLoading()
          util.showError('上传失败')
        })
      }
    })
  },

  // 预览照片
  onPreviewPhoto: function (e) {
    const url = e.currentTarget.dataset.url
    const urls = this.data.dayPhotos.map(p => p.imageUrl)

    wx.previewImage({
      current: url,
      urls: urls
    })
  }
})