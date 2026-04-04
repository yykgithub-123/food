// pages/addDish/addDish.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    dishName: '',
    dishImage: '',
    dishImageFileId: '',
    categories: [],
    selectedCategoryId: '',
    specs: [],
    canSubmit: false,
    isSubmitting: false
  },

  onLoad: function () {
    this.loadCategories()
  },

  // 加载分类列表
  loadCategories: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    api.getCategories(userInfo.kitchenId).then(res => {
      if (res.success && res.data.length > 0) {
        this.setData({
          categories: res.data,
          selectedCategoryId: res.data[0]._id
        })
      }
    })
  },

  // 输入菜品名称
  onNameInput: function (e) {
    const name = e.detail.value.trim()
    this.setData({ dishName: name })
    this.checkCanSubmit()
  },

  // 选择图片
  onChooseImage: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ dishImage: tempFilePath })
        this.checkCanSubmit()
      }
    })
  },

  // 选择分类
  onSelectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ selectedCategoryId: categoryId })
  },

  // 添加规格
  onAddSpec: function () {
    const specs = this.data.specs
    specs.push({ name: '' })
    this.setData({ specs })
  },

  // 输入规格
  onSpecInput: function (e) {
    const index = e.currentTarget.dataset.index
    const name = e.detail.value.trim()
    const specs = this.data.specs
    specs[index].name = name
    this.setData({ specs })
  },

  // 删除规格
  onDeleteSpec: function (e) {
    const index = e.currentTarget.dataset.index
    const specs = this.data.specs
    specs.splice(index, 1)
    this.setData({ specs })
  },

  // 检查是否可以提交
  checkCanSubmit: function () {
    const { dishName, dishImage } = this.data
    const canSubmit = dishName.length > 0 && dishImage.length > 0
    this.setData({ canSubmit })
  },

  // 提交保存
  onSubmit: function () {
    const { dishName, dishImage, dishImageFileId, selectedCategoryId, specs, canSubmit, isSubmitting } = this.data

    if (!canSubmit || isSubmitting) return

    this.setData({ isSubmitting: true })
    util.showLoading('保存中...')

    // 压缩图片后上传
    wx.compressImage({
      src: dishImage,
      quality: 70,
      success: (compressRes) => {
        const compressedPath = compressRes.tempFilePath

        // 上传压缩后的图片
        wx.cloud.uploadFile({
          cloudPath: `dishes/${Date.now()}.jpg`,
          filePath: compressedPath
        }).then(uploadRes => {
          // 过滤空规格
          const validSpecs = specs.filter(s => s.name.length > 0).map(s => ({ name: s.name }))

          // 添加菜品
          return api.addDish({
            kitchenId: app.globalData.userInfo.kitchenId,
            name: dishName,
            image: uploadRes.fileID,
            categoryId: selectedCategoryId,
            specs: validSpecs
          })
        }).then(() => {
          util.hideLoading()
          util.showSuccess('添加成功')
          // 返回上一页
          wx.navigateBack()
        }).catch(err => {
          util.hideLoading()
          util.showError('保存失败')
          this.setData({ isSubmitting: false })
        })
      },
      fail: () => {
        // 压缩失败，直接上传原图
        wx.cloud.uploadFile({
          cloudPath: `dishes/${Date.now()}.jpg`,
          filePath: dishImage
        }).then(uploadRes => {
          const validSpecs = specs.filter(s => s.name.length > 0).map(s => ({ name: s.name }))
          return api.addDish({
            kitchenId: app.globalData.userInfo.kitchenId,
            name: dishName,
            image: uploadRes.fileID,
            categoryId: selectedCategoryId,
            specs: validSpecs
          })
        }).then(() => {
          util.hideLoading()
          util.showSuccess('添加成功')
          wx.navigateBack()
        }).catch(err => {
          util.hideLoading()
          util.showError('保存失败')
          this.setData({ isSubmitting: false })
        })
      }
    })
  }
})