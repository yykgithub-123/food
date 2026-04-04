// app.js
App({
  globalData: {
    userInfo: null,
    kitchenInfo: null,
    theme: 'pink'
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-0gzvzutpda08f516', // 替换为你的云开发环境ID
        traceUser: true
      })
    }

    // 检查登录状态
    this.checkLoginStatus()

    // 加载主题设置
    this.loadTheme()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      // 获取厨房信息
      this.getKitchenInfo(userInfo.kitchenId)
    }
  },

  // 获取厨房信息
  getKitchenInfo: function (kitchenId) {
    if (!kitchenId) return

    wx.cloud.callFunction({
      name: 'kitchen',
      data: {
        action: 'get',
        kitchenId: kitchenId
      }
    }).then(res => {
      if (res.result.success) {
        this.globalData.kitchenInfo = res.result.data
      }
    }).catch(err => {
      console.error('获取厨房信息失败', err)
    })
  },

  // 加载主题设置
  loadTheme: function () {
    const theme = wx.getStorageSync('theme') || 'pink'
    this.globalData.theme = theme
    this.applyTheme(theme)
  },

  // 应用主题
  applyTheme: function (theme) {
    this.globalData.theme = theme
    // 主题样式在各页面中通过 wxss 引入
  },

  // 设置主题
  setTheme: function (theme) {
    wx.setStorageSync('theme', theme)
    this.applyTheme(theme)
  }
})