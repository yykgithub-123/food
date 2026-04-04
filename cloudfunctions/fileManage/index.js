// 云函数：文件操作
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { action, cloudPath, fileContent } = event

  switch (action) {
    case 'upload':
      return await handleUpload(event)
    case 'getTempUrl':
      return await handleGetTempUrl(event)
    case 'delete':
      return await handleDelete(event)
    default:
      return { success: false, errMsg: '未知操作' }
  }
}

// 上传文件（base64）- 使用云存储公开权限
async function handleUpload(event) {
  const { cloudPath, fileContent } = event

  if (!cloudPath || !fileContent) {
    return { success: false, errMsg: '参数错误' }
  }

  try {
    // 将 base64 转为 buffer
    const buffer = Buffer.from(fileContent, 'base64')

    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    })

    return {
      success: true,
      fileID: result.fileID
    }
  } catch (err) {
    console.error('上传失败:', err)
    return { success: false, errMsg: '上传失败' }
  }
}

// 获取临时访问链接
async function handleGetTempUrl(event) {
  const { fileList } = event

  if (!fileList || !Array.isArray(fileList)) {
    return { success: false, errMsg: '参数错误' }
  }

  // 过滤空值和非云存储链接
  const cloudFileList = fileList.filter(f => f && f.startsWith('cloud://'))

  if (cloudFileList.length === 0) {
    return { success: true, fileList: [] }
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: cloudFileList
    })

    return {
      success: true,
      fileList: result.fileList
    }
  } catch (err) {
    console.error('获取临时链接失败:', err)
    return { success: false, errMsg: '获取失败' }
  }
}

// 删除文件
async function handleDelete(event) {
  const { fileList } = event

  if (!fileList || !Array.isArray(fileList)) {
    return { success: false, errMsg: '参数错误' }
  }

  const cloudFileList = fileList.filter(f => f && f.startsWith('cloud://'))

  if (cloudFileList.length === 0) {
    return { success: true }
  }

  try {
    const result = await cloud.deleteFile({
      fileList: cloudFileList
    })

    return {
      success: true,
      fileList: result.fileList
    }
  } catch (err) {
    console.error('删除文件失败:', err)
    return { success: false, errMsg: '删除失败' }
  }
}