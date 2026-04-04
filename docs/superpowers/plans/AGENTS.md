# AGENTS.md - 点菜小程序项目指南

## 项目概述

### 项目名称
家庭点菜小程序（Food App）

### 项目描述
为两人家庭（厨师与食客）开发的微信小程序点菜系统，使用微信云开发作为后端服务。

### 目标用户
- **厨师**：管理菜品、分类、订单状态，可上传美食照片
- **食客**：浏览菜品、点餐下单、上传美食照片

### 核心特点
- 一对一模式：一个厨房仅有厨师和食客两人
- 数据共享：两人共享同一厨房的所有数据
- 三种视觉风格可切换（粉色甜美、简约白色、清新绿色）

### 技术栈
| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序（原生开发） |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） |
| 数据库 | 云开发数据库（NoSQL） |

---

## 项目结构

```
miniprogram/
├── pages/
│   ├── kitchen/        # 厨房页面（点菜）
│   ├── orders/         # 订单页面
│   ├── calendar/       # 美食打卡页面
│   ├── my/             # 我的页面
│   └── login/          # 登录页面
├── components/
│   ├── dish-item/      # 菜品列表项组件
│   ├── category-bar/   # 分类栏组件
│   ├── cart-bar/       # 购物车悬浮栏组件
│   ├── order-card/     # 订单卡片组件
│   └── calendar-grid/  # 日历网格组件
├── utils/
│   ├── theme.js        # 主题风格管理
│   ├── api.js          # 云函数调用封装
│   └── util.js         # 通用工具函数
├── styles/
│   ├── theme-pink.wxss
│   ├── theme-white.wxss
│   ├── theme-green.wxss
├── app.js
├── app.json
├── app.wxss
└── sitemap.json

cloudfunctions/
├── login/
├── kitchen/
├── dish/
├── category/
├── order/
├── cart/
└── photo/
```

---

## 开发规范

### 1. 分支管理
- **main**：主分支，稳定版本
- **develop**：开发分支
- **feature/xxx**：功能分支
- **fix/xxx**：修复分支

### 2. 提交规范
使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

type:
- feat: 新功能
- fix: 修复
- refactor: 重构
- style: 样式调整
- docs: 文档
- test: 测试
- chore: 构建/工具

scope: kitchen/orders/calendar/my/login/common

示例:
feat(kitchen): 添加菜品规格选择弹窗
fix(cart): 修复购物车数量更新问题
```

### 3. 命名规范

#### 文件命名
- 页面：小写字母，如 `kitchen/`, `orders/`
- 组件：小写字母 + 连字符，如 `dish-item/`, `cart-bar/`
- 工具：小写字母，如 `theme.js`, `api.js`

#### 代码命名
- **变量/函数**：驼峰命名 `getUserInfo`, `cartItems`
- **常量**：全大写 + 下划线 `ORDER_STATUS`, `THEME_PINK`
- **数据库集合**：小写字母 + 复数 `kitchens`, `dishes`, `orders`
- **云函数**：小写字母 + 下划线 `category_add`, `order_create`

#### WXML/WXSS
- 类名：小写字母 + 连字符 `.dish-item`, `.cart-bar`, `.btn-primary`
- ID：仅用于唯一元素 `#cart-container`

### 4. 数据库集合

| 集合名 | 说明 |
|--------|------|
| kitchens | 厩房信息 |
| users | 用户信息 |
| categories | 分类信息 |
| dishes | 菜品信息 |
| orders | 订单信息 |
| cartItems | 购物车项 |
| photos | 美食照片 |

### 5. 订单状态枚举
```javascript
const ORDER_STATUS = {
  PENDING: 'pending',    // 待完成
  COMPLETED: 'completed', // 已完成
  CANCELLED: 'cancelled'  // 已取消
}
```

### 6. 主题风格枚举
```javascript
const THEME = {
  PINK: 'pink',    // 粉色甜美
  WHITE: 'white',  // 简约白色
  GREEN: 'green'   // 清新绿色
}
```

---

## 代码风格

### 1. JavaScript
- 使用 ES6+ 语法
- 异步操作使用 `async/await`
- 使用箭头函数
- 使用模板字符串

```javascript
// 推荐
const getUserInfo = async (userId) => {
  const result = await wx.cloud.callFunction({
    name: 'getUser',
    data: { userId }
  })
  return result.result
}

// 不推荐
function getUserInfo(userId) {
  return wx.cloud.callFunction({
    name: 'getUser',
    data: { userId: userId }
  }).then(function(result) {
    return result.result
  })
}
```

### 2. WXML
- 使用语义化标签
- 属性顺序：`wx:if` > `wx:for` > `class` > `style` > `bind`/`catch`
- 保持层级简洁

```xml
<!-- 推荐 -->
<view wx:if="{{showCart}}" class="cart-bar" bindtap="toggleCart">
  <text>{{cartCount}}</text>
</view>

<!-- 不推荐 -->
<view bindtap="toggleCart" style="color:red" class="cart-bar" wx:if="{{showCart}}">
```

### 3. WXSS
- 使用 CSS 变量定义主题色
- 避免内联样式
- 使用 flex 布局

```css
/* 推荐 */
.page {
  background-color: var(--bg-color);
}
.cart-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 不推荐 */
.page {
  background-color: #FFF0F5;
}
.cart-bar {
  position: absolute;
  left: 0;
  right: 0;
}
```

### 4. 云函数
- 统一错误处理
- 返回标准格式

```javascript
// 云函数标准返回格式
exports.main = async (event, context) => {
  try {
    const result = await doSomething(event)
    return {
      success: true,
      data: result,
      errMsg: ''
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      errMsg: err.message
    }
  }
}
```

---

## 测试要求

### 1. 功能测试清单

#### 厨房页面
- [ ] 横幅图片上传显示正常
- [ ] 厨房头像/名称/简介显示正常
- [ ] 分类栏切换高亮正常
- [ ] 分类拖拽排序正常
- [ ] 菜品列表加载显示正常
- [ ] 菜品规格选择弹窗正常
- [ ] 添加到购物车正常

#### 购物车
- [ ] 购物车数量显示正确
- [ ] 购物车展开/收起正常
- [ ] 数量增减功能正常
- [ ] 删除菜品功能正常
- [ ] 下单创建订单正常

#### 订单页面
- [ ] 状态筛选功能正常
- [ ] 订单列表加载显示正常
- [ ] 厨师操作按钮显示正常
- [ ] 标记完成功能正常
- [ ] 取消订单功能正常

#### 美食打卡
- [ ] 日历月份切换正常
- [ ] 有订单日期高亮显示
- [ ] 点击日期显示详情
- [ ] 照片上传功能正常

#### 我的页面
- [ ] 身份切换功能正常
- [ ] 风格切换立即生效
- [ ] 昵称修改功能正常
- [ ] 头像修改功能正常

### 2. 权限测试
- [ ] 厨师可管理菜品/分类
- [ ] 厨师可操作订单状态
- [ ] 食客只能点餐查看
- [ ] 食客无法操作订单

### 3. 邀请流程测试
- [ ] 分享链接生成正常
- [ ] 食客点击链接加入正常
- [ ] 数据共享正常

---

## 注意事项

### 1. 安全相关
- 云函数需验证用户身份（openid）
- 云函数需验证用户属于该厨房
- 数据库操作需带 kitchenId 过滤
- 敏感操作需验证角色权限（厨师/食客）

```javascript
// 云函数权限验证示例
const wxContext = cloud.getWXContext()
const openid = wxContext.OPENID

// 验证用户
const user = await db.collection('users').where({
  openid: openid
}).get()

if (user.data.length === 0) {
  return { success: false, errMsg: '用户未登录' }
}

// 验证厨房权限
const kitchenId = user.data[0].kitchenId
```

### 2. 性能优化
- 使用分页加载（每页20条）
- 图片使用云存储 CDN
- 避免频繁调用云函数
- 使用本地缓存存储主题设置

```javascript
// 分页示例
const dishes = await db.collection('dishes')
  .where({ kitchenId, categoryId })
  .skip(page * 20)
  .limit(20)
  .get()
```

### 3. 错误处理
- 云函数调用需 try-catch
- 网络错误需友好提示
- 加载状态需显示 loading
- 空数据需显示提示文字

```javascript
// 错误处理示例
try {
  wx.showLoading({ title: '加载中' })
  const result = await api.getDishes()
  wx.hideLoading()
  if (result.success) {
    this.setData({ dishes: result.data })
  } else {
    wx.showToast({ title: result.errMsg, icon: 'error' })
  }
} catch (err) {
  wx.hideLoading()
  wx.showToast({ title: '网络错误', icon: 'error' })
}
```

### 4. 主题切换
- 主题存储在本地 Storage
- 页面 onLoad 时读取并应用
- 切换后立即刷新当前页面

```javascript
// 主题切换示例
const switchTheme = (theme) => {
  wx.setStorageSync('theme', theme)
  this.setData({ theme })
  app.applyTheme(theme)
}
```

### 5. 数据同步
- 两人共享数据，需考虑并发写入
- 订单创建时需清空购物车
- 分类排序需更新所有分类的 sortOrder

---

## 开发流程

### 1. 新功能开发
1. 创建 feature 分支
2. 编写云函数
3. 编写页面/组件
4. 本地测试
5. 合并到 develop
6. 真机测试
7. 合并到 main

### 2. 云函数部署
```bash
# 上传并部署云函数
wxcloud functions:deploy
# 或在微信开发者工具中右键云函数目录 -> 上传并部署
```

### 3. 数据库初始化
在云开发控制台创建以下集合：
- kitchens
- users
- categories
- dishes
- orders
- cartItems
- photos

---

## 相关文档

- 设计文档：`docs/superpowers/specs/2026-04-03-food-app-design.md`
- 微信小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html