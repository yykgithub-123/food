// pages/login/login.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    theme: 'pink',
    nickname: '',
    role: 'chef',
    canSubmit: false,
    isCreatingKitchen: false,
    hasInviteKitchenId: false,
    inviteKitchenId: null,
    showInviteInput: false,
    inputKitchenId: ''
  },

  onLoad: function (options) {
    // 加载主题
    const theme = wx.getStorageSync('theme') || 'pink'
    this.setData({ theme })
    // 更新导航栏颜色
    const themeUtil = require('../../utils/theme')
    themeUtil.updateNavigationBarColor()

    // 检查是否有邀请链接参数
    if (options.kitchenId) {
      this.setData({
        hasInviteKitchenId: true,
        inviteKitchenId: options.kitchenId,
        role: 'diner' // 被邀请者默认为食客
      })
    }

    // 检查是否已登录
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo')
    // 只有当用户信息完整时才跳转
    if (userInfo && userInfo._id && userInfo.kitchenId) {
      // 已登录，跳转到厨房页面
      wx.switchTab({
        url: '/pages/kitchen/kitchen'
      })
    } else {
      // 清除不完整的用户信息
      if (userInfo) {
        wx.removeStorageSync('userInfo')
      }
    }
  },

  // 输入昵称
  onNicknameInput: function (e) {
    const nickname = e.detail.value.trim()
    this.setData({
      nickname: nickname,
      canSubmit: nickname.length > 0
    })
  },

  // 选择角色
  onSelectRole: function (e) {
    const role = e.currentTarget.dataset.role
    this.setData({ role })
  },

  // 登录
  onLogin: function () {
    const { nickname, role, isCreatingKitchen } = this.data

    if (!nickname || isCreatingKitchen) {
      return
    }

    this.setData({ isCreatingKitchen: true })

    // 调用登录接口
    api.login(nickname, role).then(res => {
      // 保存用户信息
      wx.setStorageSync('userInfo', res.data)
      app.globalData.userInfo = res.data

      // 判断是否需要创建/加入厨房
      if (role === 'chef' && !res.data.kitchenId) {
        // 厨师且没有厨房，创建厨房
        this.createKitchen()
      } else if (this.data.hasInviteKitchenId) {
        // 有邀请，加入厨房
        this.joinKitchen(this.data.inviteKitchenId)
      } else if (res.data.kitchenId) {
        // 已有厨房，直接进入
        this.goToKitchen()
      } else {
        // 没有厨房，等待加入
        util.showInfo('请联系厨师邀请你加入厨房')
        this.setData({ isCreatingKitchen: false })
      }
    }).catch(err => {
      util.showError(err || '登录失败')
      this.setData({ isCreatingKitchen: false })
    })
  },

  // 创建厨房
  createKitchen: function () {
    api.createKitchen({
      name: '我家厨房',
      intro: '粒粒今天吃什么'
    }).then(res => {
      // 更新用户信息
      const userInfo = app.globalData.userInfo
      userInfo.kitchenId = res.data._id
      userInfo.role = 'chef'
      wx.setStorageSync('userInfo', userInfo)

      // 更新全局厨房信息
      app.globalData.kitchenInfo = res.data

      util.showSuccess('厨房创建成功')
      this.goToKitchen()
    }).catch(err => {
      util.showError(err || '创建厨房失败')
      this.setData({ isCreatingKitchen: false })
    })
  },

  // 加入厨房
  joinKitchen: function (kitchenId) {
    api.joinKitchen(kitchenId).then(res => {
      // 更新用户信息
      const userInfo = app.globalData.userInfo
      userInfo.kitchenId = kitchenId
      userInfo.role = 'diner'
      wx.setStorageSync('userInfo', userInfo)

      // 更新全局厨房信息
      app.globalData.kitchenInfo = res.data

      util.showSuccess('加入厨房成功')
      this.goToKitchen()
    }).catch(err => {
      util.showError(err || '加入厨房失败')
      this.setData({ isCreatingKitchen: false })
    })
  },

  // 点击加入厨房链接
  onJoinKitchen: function () {
    if (this.data.inviteKitchenId) {
      this.joinKitchen(this.data.inviteKitchenId)
    }
  },

  // 跳转到厨房页面
  goToKitchen: function () {
    this.setData({ isCreatingKitchen: false })
    wx.switchTab({
      url: '/pages/kitchen/kitchen'
    })
  },

  // 切换邀请码输入框
  onToggleInviteInput: function () {
    this.setData({ showInviteInput: !this.data.showInviteInput })
  },

  // 输入厨房ID
  onInputKitchenId: function (e) {
    this.setData({ inputKitchenId: e.detail.value.trim() })
  },

  // 通过邀请码加入厨房
  onJoinByCode: function () {
    const kitchenId = this.data.inputKitchenId

    if (!kitchenId) {
      util.showInfo('请输入厨房ID')
      return
    }

    this.setData({ isCreatingKitchen: true })

    // 先检查用户是否已登录
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')

    if (userInfo && userInfo._id) {
      // 已登录，直接加入
      this.joinKitchen(kitchenId)
    } else {
      // 未登录，需要先登录
      util.showInfo('请先输入昵称并点击"开始使用"')
      this.setData({ isCreatingKitchen: false, hasInviteKitchenId: true, inviteKitchenId: kitchenId })
    }
  }
})