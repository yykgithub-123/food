// pages/my/my.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const themeUtil = require('../../utils/theme')
const app = getApp()

Page({
  data: {
    theme: 'pink',
    userInfo: {},
    currentTheme: 'pink'
  },

  onLoad: function () {
    this.loadUserInfo()
    this.loadTheme()
  },

  onShow: function () {
    this.loadTheme()
    this.loadUserInfo()
  },

  // 加载主题
  loadTheme: function () {
    const theme = wx.getStorageSync('theme') || 'pink'
    this.setData({ theme, currentTheme: theme })
    // 更新导航栏颜色
    themeUtil.updateNavigationBarColor()
  },

  // 加载用户信息
  loadUserInfo: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  // 切换身份
  onSwitchRole: function (e) {
    const role = e.currentTarget.dataset.role
    const { userInfo } = this.data

    if (role === userInfo.role) return

    wx.showModal({
      title: '确认切换',
      content: `确定切换为${role === 'chef' ? '厨师' : '食客'}身份？`,
      success: (res) => {
        if (res.confirm) {
          api.updateUserInfo({ role }).then(() => {
            userInfo.role = role
            this.setData({ userInfo })
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            util.showSuccess('已切换')
          }).catch(err => {
            util.showError(err || '切换失败')
          })
        }
      }
    })
  },

  // 切换主题
  onSwitchTheme: function (e) {
    const theme = e.currentTarget.dataset.theme

    themeUtil.setTheme(theme)
    app.setTheme(theme)
    this.setData({ currentTheme: theme, theme: theme })

    // 更新 TabBar 颜色
    themeUtil.updateTabBarStyle()
    // 更新导航栏颜色
    themeUtil.updateNavigationBarColor()

    util.showSuccess('主题已切换')
  },

  // 修改昵称
  onChangeNickname: function () {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const nickname = res.content.trim()
          if (nickname) {
            api.updateUserInfo({ nickname }).then(() => {
              const { userInfo } = this.data
              userInfo.nickname = nickname
              this.setData({ userInfo })
              app.globalData.userInfo = userInfo
              wx.setStorageSync('userInfo', userInfo)
              util.showSuccess('修改成功')
            }).catch(err => {
              util.showError(err || '修改失败')
            })
          }
        }
      }
    })
  },

  // 修改头像
  onChangeAvatar: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath

        util.showLoading('上传中...')

        wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}.jpg`,
          filePath: tempFilePath
        }).then(uploadRes => {
          return api.updateUserInfo({ avatar: uploadRes.fileID })
        }).then(() => {
          util.hideLoading()
          const { userInfo } = this.data
          // 更新本地显示
          this.setData({ 'userInfo.avatar': tempFilePath })
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
          util.showSuccess('修改成功')
        }).catch(err => {
          util.hideLoading()
          util.showError('上传失败')
        })
      }
    })
  },

  // 使用说明
  onShowHelp: function () {
    wx.showModal({
      title: '使用说明',
      content: '1. 厨师可以管理菜品和订单\n2. 食客可以点餐下单\n3. 双方都可以上传美食照片\n4. 点击分享可以邀请对方加入厨房',
      showCancel: false
    })
  },

  // 离开厨房（仅食客可用）
  onLeaveKitchen: function () {
    const userInfo = this.data.userInfo

    wx.showModal({
      title: '离开厨房',
      content: '确定要离开当前厨房吗？离开后需要重新加入其他厨房。',
      success: (res) => {
        if (res.confirm) {
          util.showLoading('处理中...')

          api.leaveKitchen(userInfo.kitchenId).then(() => {
            util.hideLoading()

            // 清除本地存储
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('theme')

            // 清除全局数据
            app.globalData.userInfo = null
            app.globalData.kitchenInfo = null

            util.showSuccess('已离开厨房')

            // 跳转到登录页
            wx.reLaunch({
              url: '/pages/login/login'
            })
          }).catch(err => {
            util.hideLoading()
            util.showError(err || '操作失败')
          })
        }
      }
    })
  },

  // 退出登录
  onLogout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('theme')

          // 清除全局数据
          app.globalData.userInfo = null
          app.globalData.kitchenInfo = null

          util.showSuccess('已退出')

          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})