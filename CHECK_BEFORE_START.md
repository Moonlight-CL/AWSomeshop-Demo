# 启动前检查清单

## ⚠️ 重要：本地开发环境配置

### 问题
后端服务无法启动，因为 `.env` 配置的是 AWS RDS 和 ElastiCache（占位符地址）。

### 解决方案
使用本地 SQLite 数据库进行开发。

## 🚀 快速启动（推荐）

### 使用本地开发脚本

**终端 1: 启动后端**
```bash
cd awsomeshop-backend
python3 start_local.py
```

这个脚本会：
- ✅ 自动安装 aiosqlite
- ✅ 使用 SQLite 数据库
- ✅ 配置正确的 CORS
- ✅ 启动开发服务器

**终端 2: 启动前端**
```bash
cd AWSomeShopEmployeeRewardsSite
npm run dev
```

## 📋 详细步骤

### 1. 验证 CORS 配置
```bash
cd awsomeshop-backend
python3 scripts/test_cors.py
```

**预期输出：**
```
✓ CORS configuration is valid!
```

### 2. 启动后端（重要：需要重启以应用 CORS 更改）
```bash
cd awsomeshop-backend
uvicorn app.main:app --reload
```

**检查启动日志：**
```
INFO:     Started server process
INFO:     Waiting for application startup.
Starting AWSomeShop v1.0.0
Environment: development
Debug mode: True
```

### 3. 启动前端
```bash
cd AWSomeShopEmployeeRewardsSite
npm run dev
```

**访问：** http://localhost:5173

### 4. 测试连接

**在浏览器控制台执行：**
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => console.log('✓ 连接成功:', data))
  .catch(err => console.error('✗ 连接失败:', err));
```

**预期输出：**
```javascript
✓ 连接成功: {
  status: "healthy",
  app: "AWSomeShop",
  version: "1.0.0",
  environment: "development"
}
```

## ✅ 成功标志

- [ ] CORS 测试通过
- [ ] 后端服务启动成功
- [ ] 前端服务启动成功
- [ ] 浏览器可以访问后端 API
- [ ] 没有 CORS 错误

## 🐛 如果仍有问题

### 检查清单
1. **后端是否运行在 8000 端口？**
   ```bash
   curl http://localhost:8000/health
   ```

2. **前端是否运行在 5173 端口？**
   ```bash
   curl http://localhost:5173
   ```

3. **CORS 配置是否正确？**
   ```bash
   cd awsomeshop-backend
   grep CORS_ORIGINS .env
   ```
   应该看到：
   ```
   CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000", ...]
   ```

4. **是否重启了后端服务？**
   - 配置更改后必须重启服务

### 查看详细文档
- [CORS 故障排除](./awsomeshop-backend/CORS_TROUBLESHOOTING.md)
- [快速参考](./AWSomeShopEmployeeRewardsSite/QUICK_REFERENCE.md)
- [前端集成完成报告](./FRONTEND_COGNITO_INTEGRATION_COMPLETE.md)

## 📝 配置摘要

### 后端 CORS 配置
**文件**: `awsomeshop-backend/.env`
```env
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"]
CORS_ALLOW_CREDENTIALS=True
```

### 前端 API 配置
**文件**: `AWSomeShopEmployeeRewardsSite/.env`
```env
VITE_API_URL=http://localhost:8000
```

## 🎯 下一步

CORS 问题已解决，现在可以：

1. ✅ 测试登录功能
2. ✅ 验证令牌管理
3. ✅ 测试 API 调用
4. ✅ 开发新功能

---

**状态**: 🟢 就绪  
**最后更新**: 2025-12-30
