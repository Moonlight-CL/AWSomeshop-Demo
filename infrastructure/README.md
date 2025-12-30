# AWSomeShop Frontend - ECS Deployment Guide

## 📋 概述

本目录包含将 AWSomeShop 前端应用部署到 AWS ECS (Elastic Container Service) 的所有必要配置文件和脚本。

## 🏗️ 架构

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate Tasks (2+ instances)
    ↓
Docker Container (Nginx + React App)
```

### 组件说明

- **VPC**: 独立的虚拟私有云
- **Public Subnets**: 2个可用区的公共子网
- **Application Load Balancer**: 负载均衡和健康检查
- **ECS Fargate**: 无服务器容器运行环境
- **ECR**: Docker镜像仓库
- **CloudWatch Logs**: 日志收集和监控

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `ecs-deployment.yaml` | CloudFormation模板，定义所有AWS资源 |
| `deploy.sh` | 自动化部署脚本 |
| `README.md` | 本文档 |

## 🚀 快速开始

### 前置要求

1. **AWS CLI** 已安装并配置
   ```bash
   aws --version
   aws configure
   ```

2. **Docker** 已安装
   ```bash
   docker --version
   ```

3. **AWS 权限**
   - ECR: 创建仓库、推送镜像
   - ECS: 创建集群、服务、任务
   - CloudFormation: 创建和管理堆栈
   - IAM: 创建角色和策略
   - EC2: 创建VPC、子网、安全组
   - ELB: 创建负载均衡器

### 部署步骤

#### 方法1: 使用自动化脚本（推荐）

```bash
# 进入 infrastructure 目录
cd infrastructure

# 赋予执行权限
chmod +x deploy.sh

# 部署到开发环境
./deploy.sh dev

# 部署到生产环境
./deploy.sh prod
```

脚本会自动完成：
1. ✅ 创建 ECR 仓库
2. ✅ 构建 Docker 镜像
3. ✅ 推送镜像到 ECR
4. ✅ 部署 CloudFormation 堆栈
5. ✅ 输出应用访问地址

#### 方法2: 手动部署

**步骤1: 创建 ECR 仓库**
```bash
aws ecr create-repository \
    --repository-name awsomeshop-frontend \
    --region us-east-1
```

**步骤2: 构建并推送 Docker 镜像**
```bash
# 获取 AWS 账号 ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# 登录 ECR
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# 构建镜像
cd ../AWSomeShopEmployeeRewardsSite
docker build -t awsomeshop-frontend:latest .

# 标记镜像
docker tag awsomeshop-frontend:latest \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend:latest

# 推送镜像
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend:latest
```

**步骤3: 部署 CloudFormation 堆栈**
```bash
cd ../infrastructure

aws cloudformation create-stack \
    --stack-name dev-awsomeshop-frontend \
    --template-body file://ecs-deployment.yaml \
    --parameters \
        ParameterKey=EnvironmentName,ParameterValue=dev \
        ParameterKey=ContainerImage,ParameterValue=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend:latest \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1

# 等待堆栈创建完成
aws cloudformation wait stack-create-complete \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1
```

**步骤4: 获取应用 URL**
```bash
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text
```

## 🔧 配置参数

在 `ecs-deployment.yaml` 中可以自定义以下参数：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `EnvironmentName` | dev | 环境名称 (dev/staging/prod) |
| `VpcCIDR` | 10.0.0.0/16 | VPC CIDR 块 |
| `ContainerImage` | - | Docker 镜像 URI (必需) |
| `ContainerPort` | 80 | 容器端口 |
| `DesiredCount` | 2 | 期望的任务数量 |
| `TaskCpu` | 256 | 任务 CPU 单位 |
| `TaskMemory` | 512 | 任务内存 (MB) |

## 📊 监控和日志

### 查看服务状态
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --region us-east-1
```

### 查看实时日志
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow --region us-east-1
```

### 查看任务列表
```bash
aws ecs list-tasks \
    --cluster dev-awsomeshop-cluster \
    --service-name dev-awsomeshop-frontend-service \
    --region us-east-1
```

## 🔄 更新部署

### 更新应用代码
```bash
# 重新运行部署脚本
./deploy.sh dev
```

脚本会自动：
1. 构建新的 Docker 镜像
2. 推送到 ECR
3. 更新 ECS 服务
4. 执行滚动更新（零停机）

### 更新基础设施
```bash
# 修改 ecs-deployment.yaml 后
aws cloudformation update-stack \
    --stack-name dev-awsomeshop-frontend \
    --template-body file://ecs-deployment.yaml \
    --parameters ... \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1
```

## 🧹 清理资源

### 删除整个堆栈
```bash
aws cloudformation delete-stack \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1

# 等待删除完成
aws cloudformation wait stack-delete-complete \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1
```

### 删除 ECR 镜像
```bash
aws ecr delete-repository \
    --repository-name awsomeshop-frontend \
    --force \
    --region us-east-1
```

## 💰 成本估算

基于默认配置（us-east-1 区域）：

| 服务 | 配置 | 月成本估算 |
|------|------|-----------|
| ECS Fargate | 2 tasks × 0.25 vCPU × 0.5 GB | ~$15 |
| Application Load Balancer | 1 ALB | ~$16 |
| Data Transfer | 10 GB/月 | ~$1 |
| CloudWatch Logs | 5 GB/月 | ~$3 |
| **总计** | | **~$35/月** |

## 🔒 安全最佳实践

1. ✅ 使用 HTTPS（需要配置 ACM 证书）
2. ✅ 启用 Container Insights 监控
3. ✅ 启用 ECR 镜像扫描
4. ✅ 使用最小权限 IAM 角色
5. ✅ 定期更新基础镜像
6. ✅ 配置 WAF（可选）

## 🐛 故障排查

### 服务无法启动
```bash
# 查看服务事件
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --region us-east-1 \
    --query 'services[0].events[0:5]'
```

### 健康检查失败
```bash
# 查看目标组健康状态
aws elbv2 describe-target-health \
    --target-group-arn <TARGET_GROUP_ARN>
```

### 容器日志
```bash
# 获取任务 ID
TASK_ID=$(aws ecs list-tasks \
    --cluster dev-awsomeshop-cluster \
    --service-name dev-awsomeshop-frontend-service \
    --region us-east-1 \
    --query 'taskArns[0]' \
    --output text | cut -d'/' -f3)

# 查看日志
aws logs get-log-events \
    --log-group-name /ecs/dev-awsomeshop-frontend \
    --log-stream-name ecs/awsomeshop-frontend/${TASK_ID} \
    --region us-east-1
```

## 📚 相关文档

- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate 定价](https://aws.amazon.com/fargate/pricing/)
- [CloudFormation 模板参考](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)

## 🆘 支持

如有问题，请联系：
- 技术支持: tech-support@awsomeshop.com
- 文档问题: 提交 GitHub Issue
