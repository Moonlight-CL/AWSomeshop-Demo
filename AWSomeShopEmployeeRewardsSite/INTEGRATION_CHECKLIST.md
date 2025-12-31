# Cognito 集成检查清单

## 快速实施步骤

### ✅ 第一步：安装依赖
```bash
cd AWSomeShopEmployeeRewardsSite
npm install axios
```

### ✅ 第二步：创建新文件

1. **`src/app/lib/api.ts`** - API 客户端和接口定义
2. **`.env`** - 环境变量配置

### ✅ 第三步：修改现有文件

1. **`src/app/types/index.ts`** - 添加认证相关类型
2. **`src/app/context/AuthContext.tsx`** - 完全重写
3. **`src/app/components/LoginPage.tsx`** - 更新错误处理
4. **`src/app/App.tsx`** - 添加加载状态

### ✅ 第四步：配置环境变量

创建 `.env` 文件：
```env
VITE_API_URL=http://localhost:8000
```

### ✅ 第五步：测试

1. 启动后端：
   ```bash
   cd awsomeshop-backend
   uvicorn app.main:app --reload
   ```

2. 启动前端：
   ```bash
   cd AWSomeShopEmployeeRewardsSite
   npm run dev
   ```

3. 使用 Cognito 用户登录

## 核心改动说明

### 认证流程变化

**之前（Mock）：**
```
用户输入 → 检查 mockUsers → 存储用户对象 → 完成
```

**之后（Cognito）：**
```
用户输入 → POST /api/v1/auth/login → 
后端验证 Cognito → 返回 JWT 令牌 → 
存储令牌和用户信息 → 完成
```

### 令牌管理

**存储结构：**
```typescript
// localStorage: awsomeshop_tokens
{
  access_token: "eyJraWQ...",
  id_token: "eyJraWQ...",
  refresh_token: "eyJjdHk...",
  username: "zhangsan"
}

// localStorage: awsomeshop_user
{
  id: "uuid",
  username: "zhangsan",
  email: "zhangsan@company.com",
  role: "employee",
  points: 1500,
  ...
}
```

**自动刷新：**
- 当 API 返回 401 时，自动使用 refresh_token 获取新令牌
- 刷新失败则清除认证信息并跳转登录页

### API 调用示例

**登录：**
```typescript
const response = await authAPI.login('zhangsan', 'password');
// response.data.data = { access_token, id_token, refresh_token, user }
```

**获取产品列表：**
```typescript
const response = await productsAPI.getAll(1, 20);
// 自动携带 Authorization: Bearer <access_token>
// response.data.data = { items: [...], total, page, limit, pages }
```

**创建订单：**
```typescript
const response = await ordersAPI.create('product-id');
// response.data.data = { order details }
```

## 待办事项

### 必须完成
- [ ] 安装 axios
- [ ] 创建 `src/app/lib/api.ts`
- [ ] 更新 `src/app/context/AuthContext.tsx`
- [ ] 更新 `src/app/types/index.ts`
- [ ] 创建 `.env` 文件
- [ ] 测试登录流程

### 可选优化
- [ ] 更新 EmployeeDashboard 使用真实 API
- [ ] 更新 AdminDashboard 使用真实 API
- [ ] 添加全局错误处理
- [ ] 添加请求加载状态
- [ ] 实现离线检测
- [ ] 添加请求重试机制

## 常见问题

### Q: CORS 错误怎么办？
A: 确保后端 `app/config.py` 中的 `CORS_ORIGINS` 包含前端地址：
```python
CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
```

### Q: 令牌存储在哪里？
A: 存储在 `localStorage` 中，键名为 `awsomeshop_tokens` 和 `awsomeshop_user`

### Q: 如何处理令牌过期？
A: axios 拦截器会自动捕获 401 错误并尝试刷新令牌

### Q: 如何测试？
A: 使用后端脚本创建的 Cognito 用户：
```bash
cd awsomeshop-backend
python scripts/create_test_user.py
```

### Q: 生产环境需要改什么？
A: 
1. 创建 `.env.production` 文件
2. 设置正确的 `VITE_API_URL`
3. 确保使用 HTTPS
4. 更新后端 CORS 配置

## 验证清单

登录后检查：
- [ ] localStorage 中有 `awsomeshop_tokens`
- [ ] localStorage 中有 `awsomeshop_user`
- [ ] 用户信息显示正确
- [ ] 可以访问受保护的页面
- [ ] 登出后清除所有存储
- [ ] 刷新页面后仍保持登录状态
- [ ] 令牌过期后自动刷新
- [ ] 刷新失败后自动跳转登录页

## 参考文档

- 详细集成指南：`COGNITO_INTEGRATION_GUIDE.md`
- 后端 API 文档：`../API_DESIGN.md`
- 后端 Cognito 配置：`../awsomeshop-backend/AWS_COGNITO_SETUP.md`
