# Cognito 集成快速参考

## 🚀 快速启动

```bash
# 1. 启动后端
cd awsomeshop-backend
uvicorn app.main:app --reload

# 2. 启动前端
cd AWSomeShopEmployeeRewardsSite
npm run dev

# 3. 访问
open http://localhost:5173
```

## 🔑 创建测试用户

```bash
cd awsomeshop-backend
python scripts/create_test_user.py
```

## 📁 关键文件

| 文件 | 用途 |
|------|------|
| `src/app/lib/api.ts` | API 客户端和接口 |
| `src/app/context/AuthContext.tsx` | 认证状态管理 |
| `.env` | 环境变量配置 |

## 🔧 环境变量

```env
VITE_API_URL=http://localhost:8000
```

## 📡 API 使用示例

```typescript
import { authAPI, productsAPI } from '@/app/lib/api';

// 登录
const response = await authAPI.login('username', 'password');
const { access_token, user } = response.data.data;

// 获取产品
const products = await productsAPI.getAll(1, 20);
```

## 🗄️ localStorage 结构

```javascript
// 令牌
localStorage.getItem('awsomeshop_tokens')
// { access_token, id_token, refresh_token, username }

// 用户信息
localStorage.getItem('awsomeshop_user')
// { id, username, email, role, points, ... }
```

## 🔍 调试命令

```javascript
// 浏览器控制台
localStorage.getItem('awsomeshop_tokens')
localStorage.getItem('awsomeshop_user')
localStorage.clear() // 清除所有数据
```

## ⚠️ 常见问题

### CORS 错误 ✅ 已修复
**症状**: `Access to XMLHttpRequest has been blocked by CORS policy`

**解决方案**: 
1. CORS 配置已更新为具体的源地址
2. 重启后端服务以应用更改：
```bash
cd awsomeshop-backend
# 按 Ctrl+C 停止服务，然后重新启动
uvicorn app.main:app --reload
```

3. 验证 CORS 配置：
```bash
python3 scripts/test_cors.py
```

详细信息请查看 [CORS 故障排除指南](../awsomeshop-backend/CORS_TROUBLESHOOTING.md)

### 其他常见问题

### CORS 错误
检查后端 `app/config.py`:
```python
CORS_ORIGINS = ["http://localhost:5173"]
```

### 401 错误
- 令牌可能过期，重新登录
- 检查后端 Cognito 配置

### 网络错误
- 确保后端服务运行在 http://localhost:8000
- 检查 `.env` 中的 `VITE_API_URL`

## 📚 完整文档

- [集成指南](./COGNITO_INTEGRATION_GUIDE.md) - 详细技术文档
- [快速开始](./README_COGNITO.md) - 测试和调试指南
- [实施总结](./IMPLEMENTATION_SUMMARY.md) - 功能和 API 说明
- [检查清单](./INTEGRATION_CHECKLIST.md) - 实施步骤
- [变更日志](./CHANGELOG_COGNITO.md) - 所有变更记录

## ✅ 验证清单

- [ ] 后端服务运行正常
- [ ] 前端服务启动成功
- [ ] 可以使用 Cognito 用户登录
- [ ] localStorage 存储了令牌
- [ ] 刷新页面保持登录状态
- [ ] 登出功能正常

## 🎯 下一步

1. 测试认证流程
2. 更新 Dashboard 组件使用真实 API
3. 配置生产环境
4. 部署应用

---

**需要帮助？** 查看完整文档或检查浏览器控制台错误信息。
