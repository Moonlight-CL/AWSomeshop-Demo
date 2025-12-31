# AWSomeShop 部署指南

本文档提供 AWSomeShop 系统的完整部署指南，包括本地开发环境和 AWS 云端部署。

## 目录

- [本地开发环境](#本地开发环境)
- [AWS 云端部署](#aws-云端部署)
- [环境配置](#环境配置)
- [常见问题](#常见问题)

## 本地开发环境

### 前置要求

- Docker 和 Docker Compose
- Node.js 18+
- Python 3.11+
- uv (Python 包管理器)

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd AWSomeshop-Demo
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，根据需要修改配置
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 前端: http://localhost:3000
   - 后端 API: http://localhost:8000
   - API 文档: http://localhost:8000/docs
   - 数据库管理: http://localhost:8080

### 单独运行服务

#### 后端

```bash
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e .
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

## AWS 云端部署

### 架构概述

```
Internet → ALB → ECS Fargate (Frontend + Backend) → RDS PostgreSQL + Redis
                                                   ↓
                                                  S3
```

### 部署步骤

#### 1. 准备工作

**安装必要工具：**

```bash
# AWS CLI
brew install awscli  # macOS
# 或从 https://aws.amazon.com/cli/ 下载

# Node.js 和 npm
brew install node  # macOS
# 或从 https://nodejs.org/ 下载

# AWS CDK
npm install -g aws-cdk

# Docker
# 从 https://www.docker.com/products/docker-desktop 下载安装
```

**配置 AWS 凭证：**

```bash
aws configure
# 输入:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (例如: us-east-1)
# - Default output format (json)
```

**设置环境变量：**

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1  # 或您选择的区域
```

#### 2. 一键部署（推荐）

```bash
cd infra/scripts
chmod +x deploy.sh
./deploy.sh dev  # 开发环境
```

部署过程需要 20-30 分钟，包括：
- ✓ Bootstrap CDK
- ✓ 创建 VPC、子网、安全组
- ✓ 创建 RDS 数据库
- ✓ 创建 Redis 集群
- ✓ 创建 ECS 集群和服务
- ✓ 创建 ALB 和目标组
- ✓ 构建并推送 Docker 镜像
- ✓ 部署应用

#### 3. 手动部署（高级）

如果需要更多控制，可以手动执行各个步骤：

**Step 1: Bootstrap CDK**

```bash
cd infra/aws
npm install
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
```

**Step 2: 部署基础设施**

```bash
# 查看将要创建的资源
cdk synth --context environment=dev

# 部署
cdk deploy --context environment=dev --require-approval never
```

**Step 3: 构建并推送镜像**

```bash
cd ../scripts

# 构建所有镜像
./build-and-push.sh dev all

# 或分别构建
./build-and-push.sh dev backend
./build-and-push.sh dev frontend
```

**Step 4: 更新 ECS 服务**

```bash
# 后端
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --force-new-deployment

# 前端
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-frontend-dev \
  --force-new-deployment
```

**Step 5: 等待服务稳定**

```bash
aws ecs wait services-stable \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev awsome-shop-frontend-dev
```

#### 4. 获取应用 URL

```bash
aws cloudformation describe-stacks \
  --stack-name awsome-shop-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text
```

#### 5. 初始化数据库

数据库迁移会在后端容器启动时自动运行。如需手动运行：

```bash
# 获取任务 ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev \
  --query 'taskArns[0]' \
  --output text)

# 执行迁移
aws ecs execute-command \
  --cluster awsome-shop-cluster-dev \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/bash -c 'cd /app && alembic upgrade head'"
```

## 环境配置

### 环境类型

#### 开发环境 (dev)

- **用途**: 开发和测试
- **实例大小**: 小型（成本优化）
- **高可用**: 否（单可用区）
- **备份保留**: 1 天
- **删除保护**: 否

```bash
./deploy.sh dev
```

#### 生产环境 (prod)

- **用途**: 正式生产环境
- **实例大小**: 标准（性能优化）
- **高可用**: 是（多可用区）
- **备份保留**: 7 天
- **删除保护**: 是

```bash
./deploy.sh prod
```

### 环境变量

主要环境变量在 CDK Stack 中配置，敏感信息存储在 AWS Secrets Manager：

- `DATABASE_URL`: 数据库连接字符串（来自 Secrets Manager）
- `SECRET_KEY`: JWT 密钥（来自 Secrets Manager）
- `AWS_REGION`: AWS 区域
- `S3_BUCKET_NAME`: S3 存储桶名称

## 部署后操作

### 1. 验证部署

```bash
# 获取应用 URL
URL=$(aws cloudformation describe-stacks \
  --stack-name awsome-shop-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text)

# 测试后端 API
curl $URL/health

# 测试前端
curl $URL
```

### 2. 查看日志

```bash
# 实时查看后端日志
aws logs tail /ecs/awsome-shop-backend-dev --follow

# 实时查看前端日志
aws logs tail /ecs/awsome-shop-frontend-dev --follow
```

### 3. 监控服务状态

```bash
# 查看 ECS 服务
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev awsome-shop-frontend-dev

# 查看运行中的任务
aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev
```

### 4. 配置域名（可选）

如果您有自己的域名：

1. 在 Route 53 创建 Hosted Zone
2. 在 ACM 请求 SSL 证书
3. 更新 CDK Stack 以添加 HTTPS 监听器
4. 将域名 CNAME 指向 ALB DNS

### 5. 设置告警（推荐）

```bash
# CPU 告警
aws cloudwatch put-metric-alarm \
  --alarm-name awsome-shop-backend-cpu-high \
  --alarm-description "Backend CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=awsome-shop-cluster-dev Name=ServiceName,Value=awsome-shop-backend-dev

# 配置 SNS 主题接收告警
aws sns create-topic --name awsome-shop-alerts
aws sns subscribe \
  --topic-arn <topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## 更新部署

### 更新应用代码

```bash
# 1. 提交代码更改
git add .
git commit -m "Update application"

# 2. 重新构建并推送镜像
cd infra/scripts
./build-and-push.sh dev all

# 3. ECS 会自动部署新镜像
```

### 更新基础设施

```bash
cd infra/aws

# 1. 修改 Stack 代码
# 2. 查看变更
cdk diff --context environment=dev

# 3. 部署变更
cdk deploy --context environment=dev
```

## 扩容和缩容

### 手动扩容

```bash
# 扩容后端到 3 个任务
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 3
```

### 自动扩容

生产环境已配置自动扩容（基于 CPU 和内存）：
- 最小任务数: 2
- 最大任务数: 10
- CPU 目标: 70%
- 内存目标: 80%

## 成本估算

### 开发环境 (dev)

月度成本约 **$100-150**：

- ECS Fargate: ~$50
- RDS t3.micro: ~$20
- ElastiCache t3.micro: ~$15
- ALB: ~$20
- 数据传输: ~$10
- 其他（S3, CloudWatch, Secrets Manager）: ~$10

### 生产环境 (prod)

月度成本约 **$300-500**：

- ECS Fargate (多任务): ~$150
- RDS t3.small (Multi-AZ): ~$80
- ElastiCache t3.small: ~$40
- ALB: ~$30
- 数据传输: ~$30
- 其他: ~$20

💡 **成本优化提示**：
- 开发环境非工作时间可以缩容到 0
- 使用 Reserved Instances 或 Savings Plans
- 定期清理未使用的资源

## 故障排查

### 部署失败

**问题**: CDK deploy 失败

```bash
# 查看详细错误
aws cloudformation describe-stack-events \
  --stack-name awsome-shop-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# 常见原因:
# - 权限不足
# - 资源限制（如 VPC 数量、EIP 数量）
# - 区域不支持某些服务
```

### ECS 任务无法启动

**问题**: 任务一直处于 PENDING 状态

```bash
# 查看服务事件
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev \
  --query 'services[0].events[0:5]'

# 常见原因:
# - 镜像拉取失败（检查 ECR 权限）
# - 资源不足（CPU/内存配额）
# - 安全组配置错误
```

### 健康检查失败

**问题**: ALB 健康检查一直失败

```bash
# 查看目标健康状态
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# 常见原因:
# - 应用启动时间过长（增加 healthCheckGracePeriod）
# - 健康检查路径错误
# - 安全组未允许 ALB 到 ECS 的流量
```

### 无法访问应用

**问题**: 通过 ALB DNS 无法访问

```bash
# 1. 检查 ALB 状态
aws elbv2 describe-load-balancers \
  --names awsome-shop-alb-dev

# 2. 检查目标组
aws elbv2 describe-target-groups \
  --names awsome-shop-backend-dev

# 3. 检查安全组
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=awsome-shop-alb-sg-dev"

# 常见原因:
# - 安全组未开放 80/443 端口
# - 目标组没有健康的目标
# - DNS 解析问题
```

## 清理资源

⚠️ **警告**: 以下操作将删除所有资源和数据！

```bash
# 删除 CloudFormation Stack
cd infra/aws
cdk destroy --context environment=dev

# 确认删除
# 输入 'y' 确认

# 手动删除 ECR 镜像（如果需要）
aws ecr delete-repository \
  --repository-name awsome-shop-backend-dev \
  --force

aws ecr delete-repository \
  --repository-name awsome-shop-frontend-dev \
  --force
```

## 安全检查清单

部署前请确保：

- [ ] 已更改所有默认密码
- [ ] 敏感信息存储在 Secrets Manager
- [ ] RDS 在私有子网中
- [ ] 安全组遵循最小权限原则
- [ ] 启用了 CloudWatch 日志
- [ ] 启用了 VPC Flow Logs
- [ ] 配置了备份策略
- [ ] 生产环境启用了删除保护
- [ ] 配置了监控告警

## 支持

如有问题，请：
1. 查看日志: `aws logs tail /ecs/awsome-shop-backend-dev --follow`
2. 检查 GitHub Issues
3. 联系开发团队

## 相关文档

- [AWS CDK 文档](infra/aws/README.md)
- [后端 API 文档](backend/README.md)
- [前端开发文档](frontend/README.md)
- [项目需求文档](.kiro/specs/awsome-shop/requirements.md)
- [架构设计文档](.kiro/specs/awsome-shop/design.md)
