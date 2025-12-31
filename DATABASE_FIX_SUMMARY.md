# 数据库连接问题修复说明

## 🐛 问题描述

**错误信息:**
```
Can't connect to MySQL server on 'localhost'
```

**根本原因:**
ECS 容器中的后端应用尝试连接 `localhost:3306`，而不是 Aurora MySQL 集群端点。

## 🔍 问题分析

### CDK 配置（正常）
在 `awsomeshop_fullstack.py` 中，ECS 任务定义已正确配置：

```python
environment={
    "DB_HOST": self.aurora_cluster.cluster_endpoint.hostname,
    "DB_PORT": "3306",
    "DB_NAME": "awsomeshop",
},
secrets={
    "DB_USERNAME": ecs.Secret.from_secrets_manager(self.db_secret, "username"),
    "DB_PASSWORD": ecs.Secret.from_secrets_manager(self.db_secret, "password"),
}
```

### 后端配置问题（已修复）
在 `app/config.py` 中，`DATABASE_URL` 构建逻辑缺少调试日志，导致难以排查：

```python
# 修复前：无日志，无法知道 DATABASE_URL 是否正确构建
if not self.DATABASE_URL and self.DB_HOST and self.DB_USERNAME and self.DB_PASSWORD:
    self.DATABASE_URL = f"mysql+aiomysql://..."

# 修复后：添加详细日志
if not self.DATABASE_URL and self.DB_HOST and self.DB_USERNAME and self.DB_PASSWORD:
    self.DATABASE_URL = f"mysql+aiomysql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    print(f"✅ Built DATABASE_URL from components: {self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}")
elif self.DATABASE_URL:
    print(f"✅ Using provided DATABASE_URL: ...")
else:
    print(f"⚠️  DATABASE_URL not configured. DB_HOST={self.DB_HOST}, ...")
```

## ✅ 修复内容

### 1. 更新本地配置文件
**文件:** `awsomeshop-backend/.env`

```bash
# 修改前（连接本地 MySQL）
DATABASE_URL=mysql+aiomysql://awsomeshop:YourPassword@localhost:3306/awsomeshop

# 修改后（连接 Aurora MySQL）
DATABASE_URL=mysql+aiomysql://awsomeshop:F_eC1swR3cWBArBI@dev-awsomeshop-fullstack-auroracluster23d869c0-6pbwbnqqo4y5.cluster-curvxbodmcnf.us-east-1.rds.amazonaws.com:3306/awsomeshop
```

### 2. 增强后端配置日志
**文件:** `awsomeshop-backend/app/config.py`

添加了详细的启动日志，方便调试：
- ✅ 成功构建 DATABASE_URL 时显示端点信息
- ⚠️  配置缺失时显示警告信息

### 3. 准备数据库初始化脚本
**目录:** `pre-infra/database-init/`

创建了 CloudShell 数据库初始化脚本套件：
- `init_aurora.sh` - 自动初始化脚本
- `schema.sql` - 数据库表结构
- `seed_data.sql` - 测试数据
- `README.md` - 详细使用文档

### 4. 重新部署后端容器
**命令:**
```bash
cd pre-infra
cdk deploy dev-awsomeshop-fullstack --require-approval never
```

**部署内容:**
- 重新构建包含修复的 Docker 镜像
- 更新 ECS 任务定义
- 滚动更新 ECS 服务（零停机）

## 📋 后续步骤

### 步骤 1: 等待 CDK 部署完成
当前部署正在进行中，大约需要 5-10 分钟。

**检查部署状态:**
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --service dev-awsomeshop-backend-service \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

**查看后端日志:**
```bash
aws logs tail /ecs/dev-awsomeshop-backend --follow
```

### 步骤 2: 初始化数据库（在 CloudShell 中）
⚠️ **重要：** 数据库还没有初始化 schema 和数据！

1. 打开 AWS CloudShell
2. 上传 `pre-infra/database-init/` 中的文件
3. 配置安全组允许 CloudShell 访问 Aurora
4. 运行初始化脚本：
   ```bash
   chmod +x init_aurora.sh
   ./init_aurora.sh dev us-east-1
   ```

**详细说明:** 请参阅 [pre-infra/database-init/README.md](pre-infra/database-init/README.md)

### 步骤 3: 测试登录功能
数据库初始化完成后，使用以下凭据测试登录：

**测试员工用户:**
- Employee ID: `EMP001` - `EMP005`
- 需要在 Cognito 中创建对应用户

**测试管理员:**
- Email: `admin@awsomeshop.com`

**API 端点:**
```
POST http://dev-awsomeshop-alb-1257862113.us-east-1.elb.amazonaws.com/api/v1/auth/login
```

## 🔧 验证修复

### 1. 检查后端配置日志
部署完成后，查看 CloudWatch 日志：

```bash
aws logs tail /ecs/dev-awsomeshop-backend --follow
```

**期望看到:**
```
✅ Built DATABASE_URL from components: dev-awsomeshop-fullstack-auroracluster...
```

### 2. 测试数据库连接
在数据库初始化后，尝试登录应该不再出现 `localhost` 错误。

### 3. 验证 ECS 环境变量
```bash
aws ecs describe-task-definition \
    --task-definition dev-awsomeshop-backend \
    --query 'taskDefinition.containerDefinitions[0].environment'
```

**期望看到:**
```json
[
    {"name": "DB_HOST", "value": "dev-awsomeshop-fullstack-auroracluster..."},
    {"name": "DB_PORT", "value": "3306"},
    {"name": "DB_NAME", "value": "awsomeshop"},
    ...
]
```

## 📊 架构图

```
Frontend (React)                    Backend (FastAPI)
     |                                     |
     |                                     |
     v                                     v
  ALB (/)  ────────────────────────────> ALB (/api/*)
                                           |
                                           |
                                           v
                                    Aurora MySQL
                                  (已部署, 等待初始化)
```

## 🎯 当前状态

- ✅ Aurora MySQL 集群已部署并运行
- ✅ ECS 服务配置正确（环境变量 + Secrets）
- ✅ 后端代码已修复并重新部署中
- ⏳ 数据库 schema 等待初始化
- ⏳ 测试数据等待加载

## 💡 关键学习点

### 1. ECS Secrets 工作原理
- ECS 从 Secrets Manager 读取 secrets
- 在容器启动时作为环境变量注入
- 应用程序通过标准的环境变量访问

### 2. Pydantic Settings 加载顺序
```python
1. 从 .env 文件加载（本地开发）
2. 从环境变量加载（容器化部署）
3. 使用默认值（如果未配置）
4. 在 __init__ 中进行后处理（构建 DATABASE_URL）
```

### 3. CDK Docker 镜像资产
- CDK 自动管理 Docker 镜像
- 构建后上传到 ECR（CDK 管理的仓库）
- 无需手动 push 镜像
- 每次 `cdk deploy` 都会重新构建

## 📞 故障排查

### 如果仍然出现 localhost 错误：

1. **检查容器日志:**
   ```bash
   aws logs tail /ecs/dev-awsomeshop-backend --follow
   ```
   看是否有 "✅ Built DATABASE_URL" 日志

2. **检查 ECS 任务定义:**
   ```bash
   aws ecs describe-task-definition --task-definition dev-awsomeshop-backend
   ```
   验证环境变量是否正确

3. **手动重启服务:**
   ```bash
   aws ecs update-service \
       --cluster dev-awsomeshop-cluster \
       --service dev-awsomeshop-backend-service \
       --force-new-deployment
   ```

### 如果数据库初始化失败：

参见 [pre-infra/database-init/README.md](pre-infra/database-init/README.md) 的故障排查部分。

---

**修复时间:** 2025-12-31
**部署环境:** dev
**AWS Region:** us-east-1
**状态:** 部署中 ⏳
