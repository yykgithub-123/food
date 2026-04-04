// pages/manageCategories/manageCategories.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    categories: [],
    newCategoryName: '',
    showEditModal: false,
    editCategoryId: '',
    editCategoryName: '',
    // 拖拽相关
    dragStartY: 0,
    dragIndex: -1
  },

  onLoad: function () {
    this.loadCategories()
  },

  // 加载分类
  loadCategories: function () {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.kitchenId) return

    util.showLoading()

    api.getCategories(userInfo.kitchenId).then(res => {
      util.hideLoading()
      if (res.success) {
        // 计算每个分类的菜品数量
        const categories = res.data
        this.setData({ categories })
        this.loadCategoryDishCount(userInfo.kitchenId)
      }
    }).catch(err => {
      util.hideLoading()
      util.showError('加载失败')
    })
  },

  // 加载分类菜品数量
  loadCategoryDishCount: function (kitchenId) {
    api.getDishes(kitchenId).then(res => {
      if (res.success) {
        const dishes = res.data
        const categories = this.data.categories.map(cat => {
          const count = dishes.filter(d => d.categoryId === cat._id).length
          return { ...cat, dishCount: count }
        })
        this.setData({ categories })
      }
    })
  },

  // 输入新分类名称
  onNewCategoryInput: function (e) {
    this.setData({ newCategoryName: e.detail.value.trim() })
  },

  // 添加分类
  onAddCategory: function () {
    const { newCategoryName } = this.data
    if (!newCategoryName) return

    const userInfo = app.globalData.userInfo

    util.showLoading('添加中...')

    api.addCategory({
      kitchenId: userInfo.kitchenId,
      name: newCategoryName,
      sortOrder: this.data.categories.length
    }).then(() => {
      util.hideLoading()
      util.showSuccess('添加成功')
      this.setData({ newCategoryName: '' })
      this.loadCategories()
    }).catch(err => {
      util.hideLoading()
      util.showError('添加失败')
    })
  },

  // 编辑分类
  onEditCategory: function (e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({
      showEditModal: true,
      editCategoryId: id,
      editCategoryName: name
    })
  },

  // 关闭编辑弹窗
  onCloseEditModal: function () {
    this.setData({ showEditModal: false })
  },

  // 阻止冒泡
  stopPropagation: function () {},

  // 编辑分类名称输入
  onEditCategoryInput: function (e) {
    this.setData({ editCategoryName: e.detail.value.trim() })
  },

  // 保存编辑
  onSaveEdit: function () {
    const { editCategoryId, editCategoryName } = this.data
    if (!editCategoryName) {
      util.showInfo('请输入分类名称')
      return
    }

    util.showLoading('保存中...')

    api.updateCategory(editCategoryId, { name: editCategoryName }).then(() => {
      util.hideLoading()
      util.showSuccess('保存成功')
      this.onCloseEditModal()
      this.loadCategories()
    }).catch(err => {
      util.hideLoading()
      util.showError('保存失败')
    })
  },

  // 删除分类
  onDeleteCategory: function (e) {
    const { id, name } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: `确定删除分类「${name}」？该分类下的菜品将变为未分类。`,
      success: (res) => {
        if (res.confirm) {
          util.showLoading('删除中...')
          api.deleteCategory(id).then(() => {
            util.hideLoading()
            util.showSuccess('已删除')
            this.loadCategories()
          }).catch(err => {
            util.hideLoading()
            util.showError('删除失败')
          })
        }
      }
    })
  },

  // 拖拽开始
  onTouchStart: function (e) {
    this.setData({
      dragStartY: e.touches[0].clientY,
      dragIndex: e.currentTarget.dataset.index
    })
  },

  // 拖拽移动
  onTouchMove: function (e) {
    // 简化版拖拽排序，实际需要更复杂实现
  },

  // 拖拽结束
  onTouchEnd: function (e) {
    // 简化版，不实现完整拖拽
    this.setData({ dragIndex: -1 })
  },

  // 上移分类
  onMoveUp: function (e) {
    const index = e.currentTarget.dataset.index
    if (index === 0) return

    const categories = [...this.data.categories]
    const temp = categories[index]
    categories[index] = categories[index - 1]
    categories[index - 1] = temp

    this.setData({ categories })
    this.updateSortOrder()
  },

  // 下移分类
  onMoveDown: function (e) {
    const index = e.currentTarget.dataset.index
    if (index === this.data.categories.length - 1) return

    const categories = [...this.data.categories]
    const temp = categories[index]
    categories[index] = categories[index + 1]
    categories[index + 1] = temp

    this.setData({ categories })
    this.updateSortOrder()
  },

  // 更新排序
  updateSortOrder: function () {
    const categories = this.data.categories.map((cat, index) => ({
      _id: cat._id,
      sortOrder: index
    }))

    api.sortCategories(categories).then(() => {
      util.showSuccess('排序已更新')
    }).catch(err => {
      util.showError('排序更新失败')
    })
  }
})