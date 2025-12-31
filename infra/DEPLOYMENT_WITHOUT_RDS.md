# AWSomeShop 部署指南（使用外部数据库）

本文档说明如何部署 AWSomeShop 到 AWS ECS，使用您自己的数据库（而不是 CDK 创建的 RDS）。

## 架构概述

**简化后的架构：**
- ✅ **VPC**：可选（使用现有或创建新的）
- ✅ **ECS Fargate**：运行前后端容器
- ✅ **Application Load Balancer**：HTTP 路由
- ✅ **ECR**：Docker 镜像仓库
- ✅ **S3**：静态资源存储
- ❌ **RDS/Redis**：不再由 CDK 创建（使用外部数据库）

## 前置要求

### 1. 数据库准备

您需要提前准备好 PostgreSQL 数据库。可以是：

- 自己创建的 RDS 实例
- 外部托管的数据库（AWS RDS, Azure Database, GCP Cloud SQL, 等）
- 自建数据库服务器
- 开发环境的本地数据库

数据库连接信息示例：
```
postgresql+asyncpg://username:password@your-db-host:5432/awsome_shop
```

### 2. AWS 凭证配置

```bash
aws configure
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
```

## 部署步骤

### 方式 1: 使用环境变量（推荐）

通过修改 CDK Stack 中的环境变量传递数据库配置。

#### 步骤 1: 准备环境变量文件

创建 `backend/.env.production` 文件：

```bash
cd backend
cp .env.production.example .env.production
# 编辑 .env.production，填入真实的数据库连接信息
```

#### 步骤 2: 修改 ECS 任务定义

编辑 `infra/aws/lib/awsome-shop-stack.ts`，在后端容器的环境变量中添加数据库配置：

```typescript
environment: {
  DEBUG: environment !== 'prod' ? 'true' : 'false',
  AWS_REGION: this.region,
  S3_BUCKET_NAME: assetsBucket.bucketName,
  // 添加数据库配置
  DATABASE_URL: 'postgresql+asyncpg://user:pass@your-db:5432/awsome_shop',
  SECRET_KEY: 'your-secret-key-here',
},
```

**⚠️ 安全警告**: 不要将敏感信息直接写入代码！使用 AWS Secrets Manager（见方式 2）。

#### 步骤 3: 部署

```bash
cd infra/scripts
./deploy.sh prod
```

### 方式 2: 使用 AWS Secrets Manager（生产推荐）

将敏感配置存储在 AWS Secrets Manager 中。

#### 步骤 1: 创建 Secret

```bash
# 创建数据库连接字符串 secret
aws secretsmanager create-secret \
  --name awsome-shop-db-url-prod \
  --description "AWSomeShop Database Connection String" \
  --secret-string "postgresql+asyncpg://user:pass@your-db:5432/awsome_shop"

# 创建应用密钥 secret
aws secretsmanager create-secret \
  --name awsome-shop-secret-key-prod \
  --description "AWSomeShop Application Secret Key" \
  --secret-string "your-random-secret-key-min-32-chars"
```

#### 步骤 2: 修改 CDK Stack

编辑 `infra/aws/lib/awsome-shop-stack.ts`，添加 Secrets Manager 导入：

```typescript
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

// 在 backendContainer 定义之前添加
const dbUrlSecret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'DBUrlSecret',
  'awsome-shop-db-url-prod'
);

const secretKeySecret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'SecretKeySecret',
  'awsome-shop-secret-key-prod'
);

// 授权 ECS 任务读取 secrets
dbUrlSecret.grantRead(backendTaskRole);
secretKeySecret.grantRead(backendTaskRole);

// 在容器定义中使用 secrets
const backendContainer = backendTaskDefinition.addContainer('backend', {
  // ... 其他配置
  secrets: {
    DATABASE_URL: ecs.Secret.fromSecretsManager(dbUrlSecret),
    SECRET_KEY: ecs.Secret.fromSecretsManager(secretKeySecret),
  },
});
```

#### 步骤 3: 部署

```bash
cd infra/scripts
./deploy.sh prod
```

### 方式 3: 使用配置文件挂载

将 `.env` 文件存储在 S3，部署时下载到容器中。

#### 步骤 1: 上传配置文件到 S3

```bash
# 上传 .env 文件到 S3
aws s3 cp backend/.env.production s3://your-config-bucket/awsome-shop/.env.prod

# 设置加密
aws s3api put-object-acl \
  --bucket your-config-bucket \
  --key awsome-shop/.env.prod \
  --acl private
```

#### 步骤 2: 修改容器启动脚本

创建 `backend/entrypoint.sh`:

```bash
#!/bin/bash
set -e

# 从 S3 下载配置文件
aws s3 cp s3://your-config-bucket/awsome-shop/.env.prod /app/.env

# 启动应用
exec python main.py
```

#### 步骤 3: 修改 Dockerfile

```dockerfile
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
```

#### 步骤 4: 授权 ECS 任务访问 S3

在 CDK Stack 中：

```typescript
const configBucket = s3.Bucket.fromBucketName(
  this,
  'ConfigBucket',
  'your-config-bucket'
);
configBucket.grantRead(backendTaskRole);
```

## 数据库迁移

部署后需要运行数据库迁移。

### 方法 1: 使用 ECS Exec

```bash
# 启用 ECS Exec
aws ecs update-service \
  --cluster awsome-shop-cluster-prod \
  --service awsome-shop-backend-prod \
  --enable-execute-command

# 获取任务 ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster awsome-shop-cluster-prod \
  --service-name awsome-shop-backend-prod \
  --query 'taskArns[0]' \
  --output text)

# 连接到容器
aws ecs execute-command \
  --cluster awsome-shop-cluster-prod \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/bash"

# 在容器内运行迁移
alembic upgrade head
```

### 方法 2: 本地运行迁移

如果数据库可以从本地访问：

```bash
cd backend

# 设置数据库连接
export DATABASE_URL="postgresql+asyncpg://user:pass@your-db:5432/awsome_shop"

# 运行迁移
alembic upgrade head
```

## 环境变量清单

后端应用需要的环境变量：

| 变量名 | 必需 | 说明 | 示例值 |
|-------|------|------|--------|
| `DATABASE_URL` | ✅ | 数据库连接字符串 | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | ✅ | JWT 密钥 | `your-random-32+-char-secret` |
| `DEBUG` | ❌ | 调试模式 | `false` (生产) |
| `AWS_REGION` | ❌ | AWS 区域 | `us-east-1` |
| `S3_BUCKET_NAME` | ❌ | S3 桶名称 | CDK 自动提供 |
| `ALLOWED_ORIGINS` | ❌ | CORS 允许的源 | `["https://yourdomain.com"]` |

## 验证部署

### 1. 检查 ECS 服务状态

```bash
aws ecs describe-services \
  --cluster awsome-shop-cluster-prod \
  --services awsome-shop-backend-prod \
  --query 'services[0].[serviceName,status,runningCount,desiredCount]'
```

### 2. 查看日志

```bash
# 后端日志
aws logs tail /ecs/awsome-shop-backend-prod --follow

# 前端日志
aws logs tail /ecs/awsome-shop-frontend-prod --follow
```

### 3. 测试 API

```bash
# 获取 ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name awsome-shop-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# 测试健康检查
curl http://$ALB_DNS/health

# 测试 API
curl http://$ALB_DNS/api/health
```

## 故障排查

### 容器无法启动

```bash
# 查看任务详情
aws ecs describe-tasks \
  --cluster awsome-shop-cluster-prod \
  --tasks <task-arn> \
  --query 'tasks[0].[lastStatus,stoppedReason,containers[0].reason]'

# 查看日志
aws logs tail /ecs/awsome-shop-backend-prod --since 10m
```

### 数据库连接失败

检查：
1. 数据库连接字符串是否正确
2. 数据库是否允许 ECS 任务的 IP 访问
3. 安全组规则是否正确
4. DATABASE_URL 环境变量是否正确传递

```bash
# 测试数据库连接
aws ecs execute-command \
  --cluster awsome-shop-cluster-prod \
  --task <task-arn> \
  --container backend \
  --interactive \
  --command "/bin/bash"

# 在容器内测试
python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
```

## 成本优化

简化架构后的成本结构：

**开发环境（约 $50-80/月）**：
- ECS Fargate (2 tasks): ~$30
- ALB: ~$20
- NAT Gateway: ~$35
- S3, Logs: ~$10

**生产环境（约 $150-250/月）**：
- ECS Fargate (4+ tasks): ~$120
- ALB: ~$30
- NAT Gateway (2): ~$70
- S3, Logs, 数据传输: ~$30

**节省的成本**（不再使用 CDK 创建的数据库）：
- RDS: $20-80/月
- ElastiCache Redis: $15-40/月

## 安全最佳实践

1. ✅ **不要在代码中硬编码密钥**
   - 使用 AWS Secrets Manager
   - 使用环境变量
   - 使用 Parameter Store

2. ✅ **限制数据库访问**
   - 只允许 ECS 任务的安全组访问
   - 使用 VPN 或堡垒机访问数据库
   - 定期轮换数据库密码

3. ✅ **加密传输**
   - 数据库连接使用 SSL/TLS
   - ALB 启用 HTTPS（配置 ACM 证书）
   - S3 数据加密

4. ✅ **最小权限原则**
   - ECS 任务角色只授予必要的权限
   - 不要使用 root 用户凭证
   - 定期审计 IAM 权限

## 总结

简化后的部署流程：

1. ✅ 准备外部数据库（RDS, Azure DB, 等）
2. ✅ 配置环境变量或 Secrets Manager
3. ✅ 运行 `./deploy.sh prod`
4. ✅ 执行数据库迁移
5. ✅ 验证部署状态

优势：
- 💰 降低成本（不创建新数据库）
- 🔧 灵活性（使用任何数据库提供商）
- 🔐 安全性（分离应用和数据层）
- 📊 可维护性（独立管理数据库）

如有问题，请参考日志进行故障排查！
