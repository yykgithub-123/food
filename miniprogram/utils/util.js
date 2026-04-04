// utils/util.js - 通用工具函数

/**
 * 格式化日期
 * 强制使用北京时间 (UTC+8)
 * @param {Date|number|string} date 日期对象、时间戳或日期字符串
 * @param {string} format 格式化模式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''

  const timestamp = typeof date === 'number' ? date : new Date(date).getTime()
  if (isNaN(timestamp)) return ''

  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(timestamp + 8 * 60 * 60 * 1000)

  const year = beijingTime.getUTCFullYear()
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingTime.getUTCDate()).padStart(2, '0')
  const hour = String(beijingTime.getUTCHours()).padStart(2, '0')
  const minute = String(beijingTime.getUTCMinutes()).padStart(2, '0')
  const second = String(beijingTime.getUTCSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 格式化日期为简单格式（月-日 时:分）
 * 强制使用北京时间 (UTC+8)
 * @param {Date|number|string} date
 * @returns {string}
 */
const formatDateSimple = (date) => {
  const timestamp = typeof date === 'number' ? date : new Date(date).getTime()
  if (isNaN(timestamp)) return ''

  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(timestamp + 8 * 60 * 60 * 1000)

  const month = beijingTime.getUTCMonth() + 1
  const day = beijingTime.getUTCDate()
  const hour = String(beijingTime.getUTCHours()).padStart(2, '0')
  const minute = String(beijingTime.getUTCMinutes()).padStart(2, '0')

  return `${month}月${day}日 ${hour}:${minute}`
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD）
 * 强制使用北京时间 (UTC+8)
 * @returns {string}
 */
const getTodayStr = () => {
  // 获取当前时间戳并转换为北京时间
  const beijingTime = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const year = beijingTime.getUTCFullYear()
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingTime.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取某月的天数
 * @param {number} year 年份
 * @param {number} month 月份（1-12）
 * @returns {number}
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate()
}

/**
 * 获取某月第一天是星期几
 * @param {number} year 年份
 * @param {number} month 月份（1-12）
 * @returns {number} 0-6（周日-周六）
 */
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * 显示加载中
 * @param {string} title 加载提示文字
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载中
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示成功提示
 * @param {string} title 提示文字
 */
const showSuccess = (title) => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 * @param {string} title 提示文字
 */
const showError = (title) => {
  wx.showToast({
    title: title,
    icon: 'error',
    duration: 2000
  })
}

/**
 * 显示普通提示
 * @param {string} title 提示文字
 */
const showInfo = (title) => {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 获取图片缩略图URL
 * @param {string} fileId 云存储文件ID
 * @param {number} width 缩略图宽度
 * @returns {string} 缩略图URL
 */
const getThumbnailUrl = (fileId, width = 200) => {
  if (!fileId || !fileId.startsWith('cloud://')) {
    return fileId
  }
  // 微信云存储图片处理：在URL后添加 ?imageMogr2/thumbnail/宽度x
  // 注意：需要先获取临时URL才能使用图片处理
  return fileId
}

/**
 * 压缩并上传图片（通过云函数中转，解决权限问题）
 * @param {string} filePath 本地图片路径
 * @param {string} cloudPath 云存储路径
 * @param {number} quality 压缩质量 (0-100)
 * @returns {Promise} 返回 fileID
 */
const compressAndUpload = (filePath, cloudPath, quality = 70) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: quality,
      success: (res) => {
        // 读取压缩后的文件为 base64
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: 'base64',
          success: (readRes) => {
            // 通过云函数上传
            wx.cloud.callFunction({
              name: 'fileManage',
              data: {
                action: 'upload',
                cloudPath: cloudPath,
                fileContent: readRes.data
              }
            }).then(uploadRes => {
              if (uploadRes.result && uploadRes.result.success) {
                resolve(uploadRes.result.fileID)
              } else {
                reject(uploadRes.result?.errMsg || '上传失败')
              }
            }).catch(err => {
              reject(err)
            })
          },
          fail: (err) => {
            reject(err)
          }
        })
      },
      fail: (err) => {
        // 压缩失败，直接读取原图
        wx.getFileSystemManager().readFile({
          filePath: filePath,
          encoding: 'base64',
          success: (readRes) => {
            wx.cloud.callFunction({
              name: 'fileManage',
              data: {
                action: 'upload',
                cloudPath: cloudPath,
                fileContent: readRes.data
              }
            }).then(uploadRes => {
              if (uploadRes.result && uploadRes.result.success) {
                resolve(uploadRes.result.fileID)
              } else {
                reject(uploadRes.result?.errMsg || '上传失败')
              }
            }).catch(err => {
              reject(err)
            })
          },
          fail: (err) => {
            reject(err)
          }
        })
      }
    })
  })
}

/**
 * 直接上传图片（通过云函数中转）
 * @param {string} filePath 本地图片路径
 * @param {string} cloudPath 云存储路径
 * @returns {Promise} 返回 fileID
 */
const uploadFileViaCloud = (filePath, cloudPath) => {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (readRes) => {
        wx.cloud.callFunction({
          name: 'fileManage',
          data: {
            action: 'upload',
            cloudPath: cloudPath,
            fileContent: readRes.data
          }
        }).then(uploadRes => {
          if (uploadRes.result && uploadRes.result.success) {
            resolve(uploadRes.result.fileID)
          } else {
            reject(uploadRes.result?.errMsg || '上传失败')
          }
        }).catch(err => {
          reject(err)
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 获取文件临时访问链接
 * @param {Array} fileList 文件ID列表
 * @returns {Promise} 返回临时链接列表
 */
const getTempFileUrl = (fileList) => {
  return new Promise((resolve, reject) => {
    // 过滤非云存储链接
    const cloudFileList = fileList.filter(f => f && f.startsWith('cloud://'))

    if (cloudFileList.length === 0) {
      resolve([])
      return
    }

    wx.cloud.callFunction({
      name: 'fileManage',
      data: {
        action: 'getTempUrl',
        fileList: cloudFileList
      }
    }).then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.fileList)
      } else {
        reject(res.result?.errMsg || '获取失败')
      }
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 批量获取图片临时链接并替换
 * @param {Array} items 数据列表
 * @param {string} imageField 图片字段名
 * @returns {Promise} 返回处理后的列表
 */
const processImageUrls = async (items, imageField = 'image') => {
  if (!items || items.length === 0) return items

  // 收集所有云存储图片ID
  const cloudImages = []
  items.forEach(item => {
    if (item[imageField] && item[imageField].startsWith('cloud://')) {
      cloudImages.push(item[imageField])
    }
  })

  if (cloudImages.length === 0) return items

  try {
    const urlList = await getTempFileUrls(cloudImages)
    const urlMap = {}
    urlList.forEach(item => {
      urlMap[item.fileID] = item.tempFileURL
    })

    // 替换图片URL
    return items.map(item => {
      if (item[imageField] && urlMap[item[imageField]]) {
        return { ...item, [imageField]: urlMap[item[imageField]] }
      }
      return item
    })
  } catch (err) {
    console.error('获取图片链接失败:', err)
    return items
  }
}

/**
 * 批量获取临时链接（带缓存）
 */
const tempUrlCache = {}
const tempUrlCacheTime = {}
const CACHE_DURATION = 1000 * 60 * 50 // 50分钟缓存

const getTempFileUrls = (fileList) => {
  return new Promise((resolve, reject) => {
    const cloudFileList = fileList.filter(f => f && f.startsWith('cloud://'))
    if (cloudFileList.length === 0) {
      resolve([])
      return
    }

    // 检查缓存
    const now = Date.now()
    const cached = []
    const needFetch = []

    cloudFileList.forEach(fileID => {
      if (tempUrlCache[fileID] && (now - tempUrlCacheTime[fileID] < CACHE_DURATION)) {
        cached.push({ fileID, tempFileURL: tempUrlCache[fileID] })
      } else {
        needFetch.push(fileID)
      }
    })

    if (needFetch.length === 0) {
      resolve(cached)
      return
    }

    wx.cloud.callFunction({
      name: 'fileManage',
      data: {
        action: 'getTempUrl',
        fileList: needFetch
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const result = res.result.fileList || []
        // 更新缓存
        result.forEach(item => {
          if (item.tempFileURL) {
            tempUrlCache[item.fileID] = item.tempFileURL
            tempUrlCacheTime[item.fileID] = now
          }
        })
        resolve([...cached, ...result])
      } else {
        // 获取失败时返回缓存
        resolve(cached)
      }
    }).catch(err => {
      // 失败时返回缓存
      resolve(cached)
    })
  })
}

module.exports = {
  formatDate,
  formatDateSimple,
  getTodayStr,
  getDaysInMonth,
  getFirstDayOfMonth,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showInfo,
  getThumbnailUrl,
  compressAndUpload,
  uploadFileViaCloud,
  getTempFileUrl,
  getTempFileUrls,
  processImageUrls
}