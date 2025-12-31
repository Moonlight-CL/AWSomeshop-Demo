# AWSomeShop AWS CDK 基础设施

本目录包含 AWSomeShop 系统的 AWS CDK 基础设施代码，用于一键部署整个应用到 AWS 云平台。

## 架构概览

### 组件

- **VPC**: 多可用区 VPC，包含公有和私有子网（可选：创建新 VPC 或使用现有 VPC）
- **ECS Fargate**: 无服务器容器编排，运行前后端应用
- **Application Load Balancer**: HTTP/HTTPS 负载均衡器
- **ECR**: Docker 镜像仓库
- **S3**: 静态资源存储
- **CloudWatch**: 日志和监控

**注意**: 数据库配置通过环境变量提供，不由 CDK 创建。详见 [使用外部数据库部署指南](../DEPLOYMENT_WITHOUT_RDS.md)

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                          Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Application Load    │
              │     Balancer (ALB)   │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Frontend   │  │   Backend   │  │   Backend   │
│   ECS Task  │  │  ECS Task 1 │  │  ECS Task 2 │
│  (Fargate)  │  │  (Fargate)  │  │  (Fargate)  │
└─────────────┘  └─────────────┘  └─────────────┘
                         │
                         │ (通过环境变量连接)
                         │
                ┌────────▼─────────┐
                │  外部数据库      │
                │  (PostgreSQL)    │
                │  自行管理或托管   │
                └──────────────────┘
```

## 前置要求

### 必需工具

1. **AWS CLI** (v2.x)
   ```bash
   # 安装
   brew install awscli  # macOS

   # 配置
   aws configure
   ```

2. **Node.js** (v18.x 或更高)
   ```bash
   node --version
   npm --version
   ```

3. **Docker** (v20.x 或更高)
   ```bash
   docker --version
   ```

4. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS 账号配置

1. 配置 AWS 凭证：
   ```bash
   aws configure
   ```

2. 设置必要的环境变量：
   ```bash
   export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   export AWS_REGION=us-east-1  # 或您选择的区域
   ```

3. 确保您的 AWS 账号有足够的权限创建以下资源：
   - VPC, EC2, ECS
   - ECR, S3
   - IAM Roles and Policies
   - CloudWatch Logs
   - Application Load Balancer

4. **准备外部数据库**：
   - PostgreSQL 数据库（可以是 RDS、Azure Database、自建等）
   - 数据库连接信息（主机、端口、用户名、密码、数据库名）
   - 详见 [使用外部数据库部署指南](../DEPLOYMENT_WITHOUT_RDS.md)

## 快速开始

### 方法一：使用一键部署脚本（推荐）

#### 选项 1: 创建新 VPC

```bash
# 进入脚本目录
cd infra/scripts

# 部署到开发环境
./deploy.sh dev

# 部署到生产环境
./deploy.sh prod
```

#### 选项 2: 使用现有 VPC

如果您已经有一个 VPC 并希望在其中部署应用：

```bash
# 部署到开发环境，使用现有 VPC
./deploy.sh dev vpc-xxxxxxxxx

# 部署到生产环境，使用现有 VPC
./deploy.sh prod vpc-xxxxxxxxx
```

**注意事项**：
- 使用现有 VPC 时，确保 VPC 中有：
  - 公有子网（用于 ALB）
  - 私有子网（用于 ECS Tasks）
- CDK 会自动查找和选择合适的子网
- 详见 [VPC 部署指南](VPC_DEPLOYMENT_GUIDE.md)

部署脚本会自动执行以下步骤：
1. Bootstrap CDK（如果需要）
2. 部署基础设施
3. 构建并推送 Docker 镜像
4. 更新 ECS 服务
5. 等待服务稳定

### 方法二：手动部署

#### 1. Bootstrap CDK

首次使用 CDK 时需要 bootstrap：

```bash
cd infra/aws
npm install
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
```

#### 2. 部署基础设施

**创建新 VPC：**

```bash
# 开发环境
cdk deploy --context environment=dev

# 生产环境
cdk deploy --context environment=prod
```

**使用现有 VPC：**

```bash
# 开发环境，使用现有 VPC
cdk deploy --context environment=dev --context vpcId=vpc-xxxxxxxxx

# 生产环境，使用现有 VPC
cdk deploy --context environment=prod --context vpcId=vpc-xxxxxxxxx

# 或者使用 npm 脚本
VPC_ID=vpc-xxxxxxxxx npm run deploy:dev:vpc
VPC_ID=vpc-xxxxxxxxx npm run deploy:prod:vpc
```

#### 3. 构建并推送镜像

```bash
cd ../scripts

# 构建并推送所有镜像
./build-and-push.sh dev all

# 只构建后端
./build-and-push.sh dev backend

# 只构建前端
./build-and-push.sh dev frontend
```

#### 4. 更新 ECS 服务

```bash
# 更新后端服务
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --force-new-deployment

# 更新前端服务
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-frontend-dev \
  --force-new-deployment
```

## 环境配置

### 开发环境 (dev)

- **ECS Backend Tasks**: 最小 1 个，最大 4 个，CPU 512, Memory 1024MB
- **ECS Frontend Tasks**: 最小 1 个，最大 4 个，CPU 256, Memory 512MB
- **VPC NAT Gateway**: 1 个
- **删除保护**: 否
- **日志保留**: 7 天

### 生产环境 (prod)

- **ECS Backend Tasks**: 最小 2 个，最大 10 个，CPU 1024, Memory 2048MB
- **ECS Frontend Tasks**: 最小 2 个，最大 10 个，CPU 512, Memory 1024MB
- **VPC NAT Gateway**: 1 个（建议 2 个以实现高可用）
- **Auto Scaling**: 基于 CPU (70%) 和内存 (80%)
- **删除保护**: 是
- **日志保留**: 7 天

### 数据库配置

数据库不由 CDK 创建，需要通过环境变量配置：
- `DATABASE_URL`: PostgreSQL 连接字符串
- `SECRET_KEY`: 应用密钥（JWT 签名等）

详见 [使用外部数据库部署指南](../DEPLOYMENT_WITHOUT_RDS.md)

## 常用命令

### CDK 命令

```bash
# 查看将要创建的资源
cdk synth --context environment=dev

# 比较本地和已部署的差异
cdk diff --context environment=dev

# 部署
cdk deploy --context environment=dev

# 删除所有资源
cdk destroy --context environment=dev
```

### 查看部署输出

```bash
# 获取 ALB DNS
aws cloudformation describe-stacks \
  --stack-name awsome-shop-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text

# 获取所有输出
aws cloudformation describe-stacks \
  --stack-name awsome-shop-dev \
  --query 'Stacks[0].Outputs'
```

### ECS 服务管理

```bash
# 查看服务状态
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev awsome-shop-frontend-dev

# 查看任务列表
aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev

# 查看任务详情
aws ecs describe-tasks \
  --cluster awsome-shop-cluster-dev \
  --tasks <task-arn>

# 扩容服务
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 3
```

### 日志查看

```bash
# 实时查看后端日志
aws logs tail /ecs/awsome-shop-backend-dev --follow

# 实时查看前端日志
aws logs tail /ecs/awsome-shop-frontend-dev --follow

# 查看特定时间范围的日志
aws logs tail /ecs/awsome-shop-backend-dev \
  --since 1h \
  --format short
```

### 数据库操作

数据库由您自己管理，不在 CDK Stack 中。请参考 [使用外部数据库部署指南](../DEPLOYMENT_WITHOUT_RDS.md) 了解如何：
- 配置数据库连接
- 运行数据库迁移
- 使用 AWS Secrets Manager 存储密钥

## 数据库迁移

详见 [使用外部数据库部署指南](../DEPLOYMENT_WITHOUT_RDS.md#数据库迁移)

简要步骤：

### 方法一：使用 ECS Exec 进入容器

```bash
# 1. 获取任务 ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev \
  --query 'taskArns[0]' \
  --output text)

# 2. 连接到容器
aws ecs execute-command \
  --cluster awsome-shop-cluster-dev \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/bash"

# 3. 在容器内运行迁移
alembic upgrade head
```

### 方法二：本地运行迁移

如果数据库可以从本地访问：

```bash
cd backend
export DATABASE_URL="postgresql+asyncpg://user:pass@your-db:5432/awsome_shop"
alembic upgrade head
```

## 监控和告警

### CloudWatch 指标

主要监控指标：
- ECS CPU 利用率
- ECS 内存利用率
- ALB 请求数和延迟
- ALB 目标健康状态
- 应用日志和错误率

### 查看指标

```bash
# 查看 ECS CPU 利用率
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=awsome-shop-cluster-dev Name=ServiceName,Value=awsome-shop-backend-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

### 设置告警（推荐）

```bash
# CPU 使用率告警
aws cloudwatch put-metric-alarm \
  --alarm-name awsome-shop-backend-cpu-high \
  --alarm-description "Backend CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## 成本优化建议

### 当前架构成本估算

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

**注意**: 数据库成本不包含在内，因为数据库由您自己管理。

### 优化建议

#### 开发环境

1. **减少任务数量**：开发环境 1 个任务足够
2. **定时关闭**：非工作时间可以缩容到 0
3. **使用单个 NAT Gateway**（已配置）

```bash
# 缩容到 0（节省 Fargate 成本）
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 0
```

#### 生产环境

1. **使用 Fargate Savings Plans**
2. **启用 Auto Scaling**（已配置）
3. **优化镜像大小**（减少传输和存储成本）
4. **使用 ECR 生命周期策略**（已配置，保留最新 10 个镜像）
5. **定期审查未使用的资源**

## 安全最佳实践

### 已实施

- ✅ ECS 任务在私有子网中（无直接互联网访问）
- ✅ 安全组遵循最小权限原则（只允许 ALB 访问 ECS）
- ✅ ECR 镜像扫描已启用
- ✅ CloudWatch 日志已启用
- ✅ VPC Flow Logs 已启用（仅新创建的 VPC）
- ✅ S3 桶默认加密和阻止公共访问

### 推荐配置

1. **数据库安全**：
   - 使用 AWS Secrets Manager 存储数据库凭证（见 [部署指南](../DEPLOYMENT_WITHOUT_RDS.md)）
   - 数据库启用 SSL/TLS 连接
   - 限制数据库访问来源（只允许 ECS 安全组）

2. **应用安全**：
   - 启用 WAF 保护 ALB
   - 配置 HTTPS（使用 ACM 证书）
   - 不要在代码中硬编码密钥

3. **基础设施安全**：
   - 启用 GuardDuty 威胁检测
   - 启用 Config 合规性监控
   - 配置 CloudTrail 审计日志
   - 定期审查 IAM 权限

4. **生产环境额外措施**：
   - 启用 Multi-AZ 部署
   - 配置自动备份策略
   - 启用 MFA Delete（S3 桶保护）

## 故障排查

### 部署失败

```bash
# 查看 CloudFormation 事件
aws cloudformation describe-stack-events \
  --stack-name awsome-shop-dev \
  --max-items 20

# 查看失败原因
aws cloudformation describe-stack-events \
  --stack-name awsome-shop-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### ECS 任务无法启动

```bash
# 查看服务事件
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev \
  --query 'services[0].events[0:5]'

# 查看任务详情
aws ecs describe-tasks \
  --cluster awsome-shop-cluster-dev \
  --tasks <task-arn> \
  --query 'tasks[0].containers[0].reason'
```

### 健康检查失败

```bash
# 查看 ALB 目标健康状态
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# 检查容器日志
aws logs tail /ecs/awsome-shop-backend-dev --follow
```

## 清理资源

⚠️ **警告**：以下操作将删除所有资源，包括数据库！

```bash
# 删除所有 CDK 资源
cd infra/aws
cdk destroy --context environment=dev

# 手动删除 ECR 镜像（如果需要）
aws ecr delete-repository \
  --repository-name awsome-shop-backend-dev \
  --force

aws ecr delete-repository \
  --repository-name awsome-shop-frontend-dev \
  --force
```

## 支持和反馈

如有问题或建议，请联系开发团队或提交 Issue。

## 许可证

MIT License
