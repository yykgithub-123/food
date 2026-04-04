# 点菜小程序设计文档

> 创建日期：2026-04-03

## 一、项目概述

### 1.1 项目背景
为两人家庭（厨师与食客）开发的点菜微信小程序，使用微信云开发作为后端服务。

### 1.2 目标用户
- **厨师**：管理菜品、分类、订单状态，可上传美食照片
- **食客**：浏览菜品、点餐下单、上传美食照片

### 1.3 核心特点
- 一对一模式：一个厨房仅有厨师和食客两人
- 数据共享：两人共享同一厨房的所有数据
- 三种视觉风格可切换

---

## 二、技术架构

### 2.1 技术栈
| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序（原生开发） |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） |
| 数据库 | 云开发数据库（NoSQL） |

### 2.2 项目结构
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
│   ├── theme-pink.wxss # 粉色主题样式
│   ├── theme-white.wxss# 简约白色主题样式
│   ├── theme-green.wxss# 清新绿色主题样式
├── app.js
├── app.json
├── app.wxss
└── sitemap.json

cloudfunctions/
├── login/              # 登录云函数
├── kitchen/            # 厨房相关操作
├── dish/               # 菜品增删改查
├── category/           # 分类增删改查
├── order/              # 订单增删改查
├── cart/               # 购物车操作
```

---

## 三、数据库设计

### 3.1 集合列表

采用简单集合设计，共7个集合：

| 集合名 | 说明 |
|--------|------|
| kitchens | 厨房信息 |
| users | 用户信息 |
| categories | 分类信息 |
| dishes | 菜品信息 |
| orders | 订单信息 |
| cartItems | 购物车项 |
| photos | 美食照片 |

### 3.2 集合结构详解

#### kitchens 集合
```json
{
  "_id": "kitchen_001",
  "name": "我家厨房",
  "avatar": "cloud://xxx/avatar.jpg",
  "banner": "cloud://xxx/banner.jpg",
  "intro": "粒粒今天吃什么",
  "chefId": "user_001",
  "dinerId": "user_002",
  "createdAt": 1706000000,
  "updatedAt": 1706000000
}
```

#### users 集合
```json
{
  "_id": "user_001",
  "nickname": "厨师小王",
  "avatar": "cloud://xxx/user_avatar.jpg",
  "kitchenId": "kitchen_001",
  "role": "chef",
  "theme": "pink",
  "createdAt": 1706000000
}
```

#### categories 集合
```json
{
  "_id": "cat_001",
  "name": "家常菜",
  "sortOrder": 1,
  "kitchenId": "kitchen_001",
  "createdAt": 1706000000
}
```

#### dishes 集合
```json
{
  "_id": "dish_001",
  "name": "红烧肉",
  "image": "cloud://xxx/dish.jpg",
  "categoryId": "cat_001",
  "kitchenId": "kitchen_001",
  "specs": [
    { "name": "小份" },
    { "name": "大份" }
  ],
  "createdAt": 1706000000,
  "updatedAt": 1706000000
}
```

#### orders 集合
```json
{
  "_id": "order_001",
  "kitchenId": "kitchen_001",
  "status": "pending",
  "items": [
    {
      "dishId": "dish_001",
      "dishName": "红烧肉",
      "quantity": 1,
      "spec": "大份"
    }
  ],
  "createdAt": 1706000000,
  "updatedAt": 1706000000
}
```

订单状态枚举：
- `pending`：待完成
- `completed`：已完成
- `cancelled`：已取消

#### cartItems 集合
```json
{
  "_id": "cart_001",
  "userId": "user_002",
  "kitchenId": "kitchen_001",
  "dishId": "dish_001",
  "quantity": 1,
  "spec": "大份",
  "createdAt": 1706000000
}
```

#### photos 集合
```json
{
  "_id": "photo_001",
  "kitchenId": "kitchen_001",
  "date": "2026-04-03",
  "imageUrl": "cloud://xxx/photo.jpg",
  "uploaderId": "user_001",
  "createdAt": 1706000000
}
```

**字段说明**：
- `date`：照片所属日期，格式 YYYY-MM-DD，用于日历页面按日期查询
- `uploaderId`：上传者用户ID，厨师和食客均可上传

---

## 四、页面设计

### 4.1 厨房页面（kitchen）

#### 页面布局
采用上下分层布局：

| 区域 | 占比 | 内容 |
|------|------|------|
| 顶部横幅 | 1/5 | 自定义图片（可上传替换） |
| 头像信息区 | 1/5 | 头像 + 厨房名 + 简介 + 管理/添加/搜索按钮 |
| 内容区 | 3/5 | 左侧分类栏 + 右侧菜品列表 |
| 悬浮按钮 | 固定底部 | 购物车 + 邀请她 + 下单（可收起） |
| Tab栏 | 固定底部 | 厨房/订单/打卡/我的 |

#### 菜品列表项
一行一个菜品，包含：
- 左侧：菜品图片（缩略图）
- 中间：菜品名称
- 右侧：添加按钮（点击弹出规格选择，默认添加1份）

#### 分类栏
- 分类列表，选中项高亮显示
- 底部「分类管理」按钮入口
- 分类管理页支持长按拖拽排序

#### 悬浮购物车栏
- 展开状态：购物车(数量) + 邀请她 + 下单 + 收起箭头
- 收起状态：购物车(数量) + 展开箭头
- 点击购物车进入购物车详情页

### 4.2 订单页面（orders）

#### 状态筛选
顶部筛选栏：全部 / 待完成 / 已完成 / 已取消

#### 订单卡片
每张订单卡片显示：
- 订单编号
- 创建时间
- 状态标签（颜色区分）
- 菜品明细（名称 + 数量 + 规格）
- 操作按钮（仅厨师可见）

#### 操作权限
| 用户身份 | 可执行操作 |
|----------|------------|
| 厨师 | 标记完成、取消订单 |
| 食客 | 仅查看 |

### 4.3 美食打卡页面（calendar）

#### 日历视图
- 月份切换（◀上月 / 下月▶）
- 7x6网格显示当月日期
- 有订单的日期以粉色圆点高亮
- 无订单日期普通显示

#### 点击日期详情
点击有订单日期后显示：
- 当天订单菜品列表
- 美食照片网格（可上传）
- 「+上传照片」按钮

#### 照片上传
- 厨师和食客均可上传
- 支持多张照片
- 照片存储在云存储

### 4.4 我的页面（my）

#### 用户信息区
- 头像（可修改）
- 昵称（可修改）
- 当前身份标签

#### 身份切换
- 厨师 / 食客 两个选项
- 点击切换，即时生效
- 切换后权限相应变化

#### 风格切换
三种风格选项：
| 风格 | 主色调 | 背景色 |
|------|--------|--------|
| 粉色甜美 | #FF6B9D | #FFF0F5 |
| 简约白色 | #333333 | #FFFFFF |
| 清新绿色 | #4CAF50 | #E8F5E9 |

风格设置保存到本地，下次打开自动应用。

#### 设置项列表
- 修改昵称
- 修改头像
- 使用说明

---

## 五、核心功能流程

### 5.1 登录流程

```
用户首次打开小程序
    ↓
显示登录页面
    ↓
输入自定义昵称
    ↓
选择初始身份（厨师/食客）
    ↓
创建用户记录
    ↓
【厨师】创建新厨房，等待食客加入
【食客】通过分享链接加入已有厨房
    ↓
进入厨房主页
```

### 5.2 邀请流程

```
厨师点击「邀请她」
    ↓
生成微信小程序分享卡片
    ↓
发送给食客（微信聊天）
    ↓
食客点击分享卡片
    ↓
打开小程序，自动关联到该厨房
    ↓
两人共享同一厨房数据
```

### 5.3 点餐下单流程

```
食客浏览菜品
    ↓
点击菜品「添加」按钮
    ↓
弹出规格选择（小份/大份等）
    ↓
确认后加入购物车（默认数量1）
    ↓
继续添加其他菜品
    ↓
点击购物车查看详情
    ↓
调整数量/删除菜品
    ↓
点击「下单」
    ↓
创建订单（状态：待完成）
    ↓
清空购物车
    ↓
通知厨师（新订单提示）
```

### 5.4 订单处理流程

```
厨师查看订单列表
    ↓
筛选「待完成」订单
    ↓
开始制作菜品
    ↓
制作完成后点击「标记完成」
    ↓
订单状态变为「已完成」
    ↓
食客可在打卡页上传美食照片
```

---

## 六、云函数设计

### 6.1 云函数列表

| 云函数名 | 功能 |
|----------|------|
| login | 用户登录/注册 |
| kitchen_create | 创建新厨房 |
| kitchen_join | 加入已有厨房 |
| kitchen_update | 更新厨房信息 |
| category_list | 获取分类列表 |
| category_add | 添加分类 |
| category_update | 更新分类 |
| category_delete | 删除分类 |
| category_sort | 更新分类排序 |
| dish_list | 获取菜品列表 |
| dish_add | 添加菜品 |
| dish_update | 更新菜品 |
| dish_delete | 删除菜品 |
| order_list | 获取订单列表 |
| order_create | 创建订单 |
| order_update_status | 更新订单状态 |
| cart_list | 获取购物车 |
| cart_add | 添加到购物车 |
| cart_update | 更新购物车项 |
| cart_remove | 移除购物车项 |
| cart_clear | 清空购物车 |
| photo_upload | 上传美食照片 |
| photo_list | 获取某日期照片列表 |

---

## 七、界面风格样式

### 7.1 粉色甜美风格

```css
/* 主色调 */
--primary: #FF6B9D;
--primary-light: #FFE4E9;
--primary-bg: #FFF0F5;

/* 按钮 */
.btn-primary { background: #FF6B9D; color: white; }
.btn-secondary { background: #FFE4E9; color: #FF6B9D; }

/* 卡片 */
.card { background: white; border: 1px solid #FFE4E9; }

/* 高亮 */
.highlight { background: #FF6B9D; }
```

### 7.2 简约白色风格

```css
/* 主色调 */
--primary: #333333;
--primary-light: #F5F5F5;
--primary-bg: #FFFFFF;

/* 按钮 */
.btn-primary { background: #333; color: white; }
.btn-secondary { background: #F5F5F5; color: #333; border: 1px solid #E0E0E0; }

/* 卡片 */
.card { background: white; border: 1px solid #E0E0E0; }

/* 高亮 */
.highlight { background: #333; }
```

### 7.3 清新绿色风格

```css
/* 主色调 */
--primary: #4CAF50;
--primary-light: #C8E6C9;
--primary-bg: #E8F5E9;

/* 按钮 */
.btn-primary { background: #4CAF50; color: white; }
.btn-secondary { background: #C8E6C9; color: #4CAF50; }

/* 卡片 */
.card { background: white; border: 1px solid #C8E6C9; }

/* 高亮 */
.highlight { background: #4CAF50; }
```

---

## 八、开发优先级

### Phase 1：基础框架
1. 项目初始化与云开发配置
2. 登录页面与用户系统
3. 厨房创建与邀请加入
4. 主题风格切换系统

### Phase 2：核心功能
5. 厨房页面（分类栏 + 菜品列表）
6. 分类管理（增删改 + 拖拽排序）
7. 菜品管理（增删改 + 图片上传）
8. 购物车系统（添加 + 数量调整 + 规格选择）
9. 订单创建与列表展示

### Phase 3：完善功能
10. 订单状态管理（厨师操作）
11. 美食打卡日历页
12. 照片上传功能
13. 「我的」页面完善

### Phase 4：优化迭代
14. 随机点餐功能（可选）
15. 性能优化
16. UI细节打磨

---

## 九、待定功能

以下功能标记为后续迭代：

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 随机点餐 | 点击卡通人物随机选择菜品 | 低 |
| 菜品搜索 | 搜索框搜索菜品名称 | 中 |
| 订单推送 | 新订单提醒厨师 | 中 |
| 数据统计 | 统计最受欢迎菜品等 | 低 |