// pages/manageDishes/manageDishes.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    categories: [],
    dishes: [],
    currentCategoryId: '',
    showEditModal: false,
    editDish: {},
    editDishImageChanged: false
  },

  onLoad: function () {
    this.loadData()
  },

  // 加载所有数据
  loadData: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    util.showLoading()

    Promise.all([
      api.getCategories(userInfo.kitchenId),
      api.getDishes(userInfo.kitchenId)
    ]).then(([categoryRes, dishRes]) => {
      util.hideLoading()
      const dishes = dishRes.success ? dishRes.data : []
      this.setData({
        categories: categoryRes.success ? categoryRes.data : [],
        dishes: dishes
      })
      // 处理图片URL
      this.processDishImages(dishes)
    }).catch(err => {
      util.hideLoading()
      util.showError('加载失败')
    })
  },

  // 处理菜品图片URL
  processDishImages: function (dishes) {
    const cloudImages = []
    dishes.forEach(dish => {
      if (dish.image && dish.image.startsWith('cloud://')) {
        cloudImages.push(dish.image)
      }
    })
    if (cloudImages.length === 0) return

    util.getTempFileUrls(cloudImages).then(urlList => {
      const urlMap = {}
      urlList.forEach(item => {
        urlMap[item.fileID] = item.tempFileURL
      })
      const updatedDishes = this.data.dishes.map(dish => {
        if (dish.image && urlMap[dish.image]) {
          return { ...dish, image: urlMap[dish.image] }
        }
        return dish
      })
      this.setData({ dishes: updatedDishes })
    })
  },

  // 获取分类名称
  getCategoryName: function (categoryId) {
    const category = this.data.categories.find(c => c._id === categoryId)
    return category ? category.name : '未分类'
  },

  // 选择分类筛选
  onSelectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ currentCategoryId: categoryId })

    const userInfo = app.globalData.userInfo
    if (categoryId) {
      api.getDishes(userInfo.kitchenId, categoryId).then(res => {
        if (res.success) {
          this.setData({ dishes: res.data })
          this.processDishImages(res.data)
        }
      })
    } else {
      api.getDishes(userInfo.kitchenId).then(res => {
        if (res.success) {
          this.setData({ dishes: res.data })
          this.processDishImages(res.data)
        }
      })
    }
  },

  // 添加菜品
  onAddDish: function () {
    wx.navigateTo({
      url: '/pages/addDish/addDish'
    })
  },

  // 编辑菜品
  onEditDish: function (e) {
    const dishId = e.currentTarget.dataset.id
    const dish = this.data.dishes.find(d => d._id === dishId)

    if (!dish) return

    this.setData({
      showEditModal: true,
      editDish: {
        _id: dish._id,
        name: dish.name,
        image: dish.image,
        categoryId: dish.categoryId || '',
        specs: dish.specs ? dish.specs.map(s => ({ name: s.name })) : []
      },
      editDishImageChanged: false
    })
  },

  // 关闭编辑弹窗
  onCloseEditModal: function () {
    this.setData({ showEditModal: false })
  },

  // 阻止冒泡
  stopPropagation: function () {},

  // 编辑时选择图片
  onEditChooseImage: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          'editDish.image': tempFilePath,
          editDishImageChanged: true
        })
      }
    })
  },

  // 编辑名称
  onEditNameInput: function (e) {
    this.setData({ 'editDish.name': e.detail.value.trim() })
  },

  // 编辑分类
  onEditSelectCategory: function (e) {
    this.setData({ 'editDish.categoryId': e.currentTarget.dataset.id })
  },

  // 编辑添加规格
  onEditAddSpec: function () {
    const specs = this.data.editDish.specs
    specs.push({ name: '' })
    this.setData({ 'editDish.specs': specs })
  },

  // 编辑输入规格
  onEditSpecInput: function (e) {
    const index = e.currentTarget.dataset.index
    const specs = this.data.editDish.specs
    specs[index].name = e.detail.value.trim()
    this.setData({ 'editDish.specs': specs })
  },

  // 编辑删除规格
  onEditDeleteSpec: function (e) {
    const index = e.currentTarget.dataset.index
    const specs = this.data.editDish.specs
    specs.splice(index, 1)
    this.setData({ 'editDish.specs': specs })
  },

  // 保存编辑
  onSaveEdit: function () {
    const { editDish, editDishImageChanged } = this.data
    if (!editDish.name) {
      util.showInfo('请输入菜品名称')
      return
    }

    util.showLoading('保存中...')

    // 如果图片改变了，先上传
    if (editDishImageChanged && editDish.image) {
      wx.cloud.uploadFile({
        cloudPath: `dishes/${Date.now()}.jpg`,
        filePath: editDish.image
      }).then(uploadRes => {
        return this.updateDish(editDish, uploadRes.fileID)
      }).then(() => {
        util.hideLoading()
        util.showSuccess('保存成功')
        this.onCloseEditModal()
        this.loadData()
      }).catch(err => {
        util.hideLoading()
        util.showError('保存失败')
      })
    } else {
      this.updateDish(editDish, editDish.image).then(() => {
        util.hideLoading()
        util.showSuccess('保存成功')
        this.onCloseEditModal()
        this.loadData()
      }).catch(err => {
        util.hideLoading()
        util.showError('保存失败')
      })
    }
  },

  // 更新菜品
  updateDish: function (dish, image) {
    const validSpecs = dish.specs.filter(s => s.name.length > 0)
    return api.updateDish(dish._id, {
      name: dish.name,
      image: image,
      categoryId: dish.categoryId,
      specs: validSpecs
    })
  },

  // 删除菜品
  onDeleteDish: function (e) {
    const dishId = e.currentTarget.dataset.id
    const dishName = e.currentTarget.dataset.name

    wx.showModal({
      title: '确认删除',
      content: `确定删除菜品「${dishName}」？`,
      success: (res) => {
        if (res.confirm) {
          util.showLoading('删除中...')
          api.deleteDish(dishId).then(() => {
            util.hideLoading()
            util.showSuccess('已删除')
            this.loadData()
          }).catch(err => {
            util.hideLoading()
            util.showError('删除失败')
          })
        }
      }
    })
  }
})