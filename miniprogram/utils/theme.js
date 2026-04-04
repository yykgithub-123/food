// utils/theme.js - 主题风格管理

// 主题配置
const themes = {
  pink: {
    name: '粉色甜美',
    primary: '#FF6B9D',
    primaryLight: '#FFE4E9',
    primaryBg: '#FFF0F5',
    tabBarColor: '#FF6B9D'
  },
  white: {
    name: '简约白色',
    primary: '#333333',
    primaryLight: '#F5F5F5',
    primaryBg: '#FFFFFF',
    tabBarColor: '#333333'
  },
  green: {
    name: '清新绿色',
    primary: '#4CAF50',
    primaryLight: '#C8E6C9',
    primaryBg: '#E8F5E9',
    tabBarColor: '#4CAF50'
  }
}

/**
 * 获取当前主题
 * @returns {string} 主题名称
 */
const getCurrentTheme = () => {
  return wx.getStorageSync('theme') || 'pink'
}

/**
 * 设置主题
 * @param {string} themeName 主题名称
 */
const setTheme = (themeName) => {
  if (!themes[themeName]) {
    console.error('未知的主题:', themeName)
    return
  }
  wx.setStorageSync('theme', themeName)
}

/**
 * 获取主题配置
 * @param {string} themeName 主题名称（可选，默认当前主题）
 * @returns {object} 主题配置
 */
const getThemeConfig = (themeName = null) => {
  const name = themeName || getCurrentTheme()
  return themes[name] || themes.pink
}

/**
 * 获取所有主题列表
 * @returns {array} 主题列表
 */
const getThemeList = () => {
  return Object.keys(themes).map(key => ({
    key: key,
    name: themes[key].name,
    ...themes[key]
  }))
}

/**
 * 更新页面样式变量
 * @param {object} page 页面实例
 * @param {string} themeName 主题名称（可选）
 */
const applyThemeToPage = (page, themeName = null) => {
  const config = getThemeConfig(themeName)
  page.setData({
    theme: getCurrentTheme(),
    themeConfig: config
  })
}

/**
 * 更新 TabBar 样式
 */
const updateTabBarStyle = () => {
  const config = getThemeConfig()
  if (wx.setTabBarStyle) {
    wx.setTabBarStyle({
      selectedColor: config.tabBarColor,
      backgroundColor: '#ffffff',
      borderStyle: 'black'
    })
  }
}

/**
 * 更新导航栏颜色
 */
const updateNavigationBarColor = () => {
  const config = getThemeConfig()
  if (wx.setNavigationBarColor) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: config.primary,
      animation: {
        duration: 300,
        timingFunc: 'easeIn'
      }
    })
  }
}

module.exports = {
  themes,
  getCurrentTheme,
  setTheme,
  getThemeConfig,
  getThemeList,
  applyThemeToPage,
  updateTabBarStyle,
  updateNavigationBarColor
}