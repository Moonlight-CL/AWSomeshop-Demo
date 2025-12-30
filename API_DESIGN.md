# AWSomeShop API 设计文档

## 📋 概述

本文档定义了 AWSomeShop 后端 API 的设计规范，用于替换当前的 Mock 数据实现。

**Base URL**: `https://api.awsomeshop.com/v1`

**认证方式**: JWT (JSON Web Token)

**数据格式**: JSON

## 🔐 认证 API

### 登录
```http
POST /auth/login
```

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "password123"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "2",
      "username": "zhangsan",
      "email": "zhangsan@company.com",
      "role": "employee",
      "points": 1500,
      "monthlyAllocation": 1000,
      "active": true,
      "createdAt": "2025-01-15T00:00:00Z"
    }
  }
}
```

**错误响应** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误"
  }
}
```

### 登出
```http
POST /auth/logout
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 刷新 Token
```http
POST /auth/refresh
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 👤 用户 API

### 获取当前用户信息
```http
GET /users/me
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "2",
    "username": "zhangsan",
    "email": "zhangsan@company.com",
    "role": "employee",
    "points": 1500,
    "monthlyAllocation": 1000,
    "active": true,
    "createdAt": "2025-01-15T00:00:00Z"
  }
}
```

### 获取所有用户（管理员）
```http
GET /users
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码，默认 1
- `limit` (number, optional): 每页数量，默认 20
- `role` (string, optional): 角色筛选 (employee/admin)
- `active` (boolean, optional): 状态筛选

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "2",
        "username": "zhangsan",
        "email": "zhangsan@company.com",
        "role": "employee",
        "points": 1500,
        "monthlyAllocation": 1000,
        "active": true,
        "createdAt": "2025-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 调整用户积分（管理员）
```http
POST /users/{userId}/points/adjust
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "amount": 500,
  "reason": "年度优秀员工奖励"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "2",
      "points": 2000
    },
    "transaction": {
      "id": "t123",
      "userId": "2",
      "amount": 500,
      "type": "adjustment",
      "description": "年度优秀员工奖励",
      "adminId": "1",
      "createdAt": "2025-12-30T10:00:00Z"
    }
  }
}
```

## 🛍️ 商品 API

### 获取商品列表
```http
GET /products
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `category` (string, optional): 分类筛选
- `active` (boolean, optional): 状态筛选
- `search` (string, optional): 搜索关键词

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "p1",
        "name": "星巴克电子礼品卡 ¥100",
        "description": "可在全国任意星巴克门店使用的100元电子礼品卡",
        "category": "餐饮美食",
        "pointsCost": 500,
        "stock": 50,
        "imageUrl": "https://cdn.awsomeshop.com/products/p1.jpg",
        "active": true,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

### 获取商品详情
```http
GET /products/{productId}
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "name": "星巴克电子礼品卡 ¥100",
    "description": "可在全国任意星巴克门店使用的100元电子礼品卡",
    "category": "餐饮美食",
    "pointsCost": 500,
    "stock": 50,
    "imageUrl": "https://cdn.awsomeshop.com/products/p1.jpg",
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### 创建商品（管理员）
```http
POST /products
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**:
```
name: 星巴克电子礼品卡 ¥100
description: 可在全国任意星巴克门店使用的100元电子礼品卡
category: 餐饮美食
pointsCost: 500
stock: 50
image: [File]
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "p9",
    "name": "星巴克电子礼品卡 ¥100",
    "description": "可在全国任意星巴克门店使用的100元电子礼品卡",
    "category": "餐饮美食",
    "pointsCost": 500,
    "stock": 50,
    "imageUrl": "https://cdn.awsomeshop.com/products/p9.jpg",
    "active": true,
    "createdAt": "2025-12-30T10:00:00Z"
  }
}
```

### 更新商品（管理员）
```http
PUT /products/{productId}
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "星巴克电子礼品卡 ¥100",
  "description": "可在全国任意星巴克门店使用的100元电子礼品卡",
  "category": "餐饮美食",
  "pointsCost": 500,
  "stock": 45,
  "active": true
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "name": "星巴克电子礼品卡 ¥100",
    "stock": 45
  }
}
```

### 删除商品（管理员）
```http
DELETE /products/{productId}
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "商品已删除"
}
```

## 🎁 订单 API

### 创建订单（兑换商品）
```http
POST /orders
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "productId": "p1"
}
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "o123",
      "userId": "2",
      "productId": "p1",
      "productName": "星巴克电子礼品卡 ¥100",
      "pointsCost": 500,
      "status": "processing",
      "createdAt": "2025-12-30T10:00:00Z"
    },
    "user": {
      "id": "2",
      "points": 1000
    }
  }
}
```

**错误响应** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "积分不足，无法兑换此商品"
  }
}
```

### 获取用户订单列表
```http
GET /orders/me
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `status` (string, optional): 状态筛选

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "o1",
        "userId": "2",
        "productId": "p1",
        "productName": "星巴克电子礼品卡 ¥100",
        "pointsCost": 500,
        "status": "completed",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### 获取所有订单（管理员）
```http
GET /orders
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `userId` (string, optional): 用户筛选
- `status` (string, optional): 状态筛选

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {...}
  }
}
```

## 💰 积分交易 API

### 获取用户积分明细
```http
GET /transactions/me
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `type` (string, optional): 类型筛选

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "t1",
        "userId": "2",
        "amount": 1000,
        "type": "allocation",
        "description": "2025年1月月度积分分配",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 获取所有积分交易（管理员）
```http
GET /transactions
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `userId` (string, optional): 用户筛选
- `type` (string, optional): 类型筛选

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {...}
  }
}
```

## 📊 统计 API

### 获取统计数据（管理员）
```http
GET /statistics
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "activeUsers": 45,
    "totalProducts": 8,
    "activeProducts": 8,
    "totalPointsDistributed": 50000,
    "totalRedemptions": 120,
    "popularProducts": [
      {
        "productId": "p1",
        "productName": "星巴克电子礼品卡 ¥100",
        "count": 25
      }
    ]
  }
}
```

## 🔔 通知 API

### 获取用户通知
```http
GET /notifications/me
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "n1",
        "userId": "2",
        "type": "redemption_success",
        "title": "兑换成功",
        "message": "您已成功兑换星巴克电子礼品卡 ¥100",
        "read": false,
        "createdAt": "2025-12-30T10:00:00Z"
      }
    ]
  }
}
```

### 标记通知为已读
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "通知已标记为已读"
}
```

## 📤 文件上传 API

### 上传商品图片
```http
POST /upload/product-image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**:
```
file: [File]
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.awsomeshop.com/products/abc123.jpg",
    "filename": "abc123.jpg",
    "size": 102400
  }
}
```

## ❌ 错误代码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| INVALID_CREDENTIALS | 401 | 用户名或密码错误 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| INSUFFICIENT_POINTS | 400 | 积分不足 |
| OUT_OF_STOCK | 400 | 库存不足 |
| INVALID_INPUT | 400 | 输入参数无效 |
| SERVER_ERROR | 500 | 服务器内部错误 |

## 🔒 安全考虑

### JWT Token
- Token 有效期：24小时
- Refresh Token 有效期：7天
- Token 存储在 HTTP-only Cookie 中

### 密码安全
- 使用 bcrypt 加密存储
- 最小长度：8位
- 必须包含字母和数字

### API 限流
- 登录接口：5次/分钟
- 其他接口：100次/分钟

### CORS 配置
```
Access-Control-Allow-Origin: https://awsomeshop.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 📝 实现建议

### 后端技术栈
- **Node.js + Express** 或 **Python + FastAPI**
- **PostgreSQL** 或 **MySQL** 数据库
- **Redis** 缓存和会话管理
- **AWS S3** 文件存储
- **AWS SES** 邮件服务

### 数据库设计
```sql
-- 用户表
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee', 'admin') NOT NULL,
  points INT DEFAULT 0,
  monthly_allocation INT DEFAULT 1000,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  points_cost INT NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  points_cost INT NOT NULL,
  status ENUM('processing', 'completed', 'cancelled') DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 积分交易表
CREATE TABLE point_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount INT NOT NULL,
  type ENUM('allocation', 'redemption', 'adjustment', 'expiration') NOT NULL,
  description TEXT,
  admin_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

## 🧪 测试建议

### 单元测试
- 使用 Jest 或 Pytest
- 覆盖率目标：80%+

### 集成测试
- 测试所有 API 端点
- 测试认证和授权
- 测试错误处理

### 性能测试
- 使用 Apache JMeter 或 k6
- 目标：1000 并发用户
- 响应时间 < 200ms

## 🔄 前后端数据映射

### 前端类型定义对应关系

| 前端类型 | 后端API端点 | 说明 |
|---------|------------|------|
| `User` | `/users/me`, `/users` | 用户信息 |
| `Product` | `/products` | 商品信息 |
| `Order` | `/orders`, `/orders/me` | 订单信息 |
| `PointTransaction` | `/transactions`, `/transactions/me` | 积分交易记录 |
| `Statistics` | `/statistics` | 统计数据（管理员） |

### 前端功能与API映射

#### 登录页面 (LoginPage.tsx)
- `login()` → `POST /auth/login`

#### 员工仪表板 (EmployeeDashboard.tsx)
- 获取用户信息 → `GET /users/me`
- 获取商品列表 → `GET /products`
- 兑换商品 → `POST /orders`
- 查看兑换记录 → `GET /orders/me`
- 查看积分明细 → `GET /transactions/me`
- 登出 → `POST /auth/logout`

#### 管理员仪表板 (AdminDashboard.tsx)
- 获取统计数据 → `GET /statistics`
- 获取用户列表 → `GET /users`
- 调整用户积分 → `POST /users/{userId}/points/adjust`
- 获取商品列表 → `GET /products`
- 添加商品 → `POST /products`
- 编辑商品 → `PUT /products/{productId}`
- 获取所有订单 → `GET /orders`
- 获取所有积分记录 → `GET /transactions`

## 📦 部署建议

### AWS 架构推荐
```
┌─────────────────┐
│   CloudFront    │  CDN + 静态资源
└────────┬────────┘
         │
┌────────▼────────┐
│   API Gateway   │  API 入口 + 限流
└────────┬────────┘
         │
┌────────▼────────┐
│     Lambda      │  无服务器计算
│   或 ECS/EKS    │  容器化部署
└────────┬────────┘
         │
┌────────▼────────┐
│   RDS/Aurora    │  关系型数据库
└─────────────────┘
         │
┌────────▼────────┐
│  ElastiCache    │  Redis 缓存
└─────────────────┘
         │
┌────────▼────────┐
│       S3        │  文件存储
└─────────────────┘
```

### 环境变量配置
```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=awsomeshop
DB_USER=admin
DB_PASSWORD=***

# JWT
JWT_SECRET=***
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=awsomeshop-assets
AWS_SES_FROM_EMAIL=noreply@awsomeshop.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 应用
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://awsomeshop.com
```

## 🔧 开发工具推荐

### API 文档生成
- **Swagger/OpenAPI**: 自动生成交互式 API 文档
- **Postman Collection**: 导出 API 测试集合

### 监控和日志
- **CloudWatch**: AWS 原生监控
- **Datadog/New Relic**: 应用性能监控
- **ELK Stack**: 日志聚合和分析

### CI/CD
- **GitHub Actions**: 自动化测试和部署
- **AWS CodePipeline**: AWS 原生 CI/CD

---

**文档版本**: 1.0.0  
**最后更新**: 2025-12-30  
**维护者**: AWSomeShop 开发团队
