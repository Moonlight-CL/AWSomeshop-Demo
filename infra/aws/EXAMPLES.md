# CDK 部署示例

本文档提供了各种部署场景的实际示例。

## 场景 1: 全新部署（创建新 VPC）

最简单的部署方式，CDK 会自动创建所有网络资源。

### 使用部署脚本

```bash
cd infra/scripts

# 部署到开发环境
./deploy.sh dev

# 输出示例：
# ========================================
# AWSomeShop 一键部署 - 环境: dev - 创建新 VPC
# ========================================
# [INFO] 检查必要的工具...
# [INFO] 所有必要工具已安装 ✓
# [INFO] AWS Account: 123456789012
# [INFO] AWS Region: us-east-1
# ...
```

### 使用 CDK 命令

```bash
cd infra/aws
npm install

# 首次部署需要 bootstrap
cdk bootstrap

# 部署
cdk deploy --context environment=dev --require-approval never
```

### 预期结果

部署完成后，您会看到：
```
✅  awsome-shop-dev

Outputs:
awsome-shop-dev.LoadBalancerDNS = awsome-shop-alb-dev-xxxxxxxxxx.us-east-1.elb.amazonaws.com
awsome-shop-dev.ApplicationURL = http://awsome-shop-alb-dev-xxxxxxxxxx.us-east-1.elb.amazonaws.com
awsome-shop-dev.BackendECRRepository = 123456789012.dkr.ecr.us-east-1.amazonaws.com/awsome-shop-backend-dev
awsome-shop-dev.FrontendECRRepository = 123456789012.dkr.ecr.us-east-1.amazonaws.com/awsome-shop-frontend-dev
awsome-shop-dev.DatabaseEndpoint = awsome-shop-db-dev.xxxxxxxxxx.us-east-1.rds.amazonaws.com
awsome-shop-dev.RedisEndpoint = awsome-shop-redis-dev.xxxxxx.cache.amazonaws.com
awsome-shop-dev.S3BucketName = awsome-shop-assets-dev-123456789012

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/awsome-shop-dev/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 场景 2: 使用现有 VPC 部署

如果您已经有一个配置好的 VPC，可以直接在其中部署。

### 步骤 1: 查找 VPC ID

```bash
# 列出所有 VPC
aws ec2 describe-vpcs \
  --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0],CidrBlock]' \
  --output table

# 输出示例：
# ---------------------------------------------------------------
# |                        DescribeVpcs                         |
# +------------------+------------------------+------------------+
# |  vpc-0abc123def  |  my-production-vpc     |  10.0.0.0/16     |
# |  vpc-0def456ghi  |  my-development-vpc    |  10.1.0.0/16     |
# +------------------+------------------------+------------------+
```

### 步骤 2: 验证子网配置

```bash
VPC_ID=vpc-0abc123def

# 检查子网
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# 输出示例：
# ----------------------------------------------------------------------------------
# |                              DescribeSubnets                                   |
# +-------------------------+---------------+----------------+-------+--------------+
# |  subnet-0abc123        |  us-east-1a   |  10.0.1.0/24   |  True |  Public-1a   |
# |  subnet-0def456        |  us-east-1b   |  10.0.2.0/24   |  True |  Public-1b   |
# |  subnet-0ghi789        |  us-east-1a   |  10.0.11.0/24  | False |  Private-1a  |
# |  subnet-0jkl012        |  us-east-1b   |  10.0.12.0/24  | False |  Private-1b  |
# |  subnet-0mno345        |  us-east-1a   |  10.0.21.0/28  | False |  Isolated-1a |
# |  subnet-0pqr678        |  us-east-1b   |  10.0.21.16/28 | False |  Isolated-1b |
# +-------------------------+---------------+----------------+-------+--------------+
```

### 步骤 3: 部署

使用部署脚本：
```bash
cd infra/scripts
./deploy.sh dev vpc-0abc123def
```

或使用 CDK 命令：
```bash
cd infra/aws
cdk deploy --context environment=dev --context vpcId=vpc-0abc123def
```

## 场景 3: 生产环境部署（高可用配置）

生产环境会启用 Multi-AZ、更大的实例和自动扩容。

```bash
cd infra/scripts
./deploy.sh prod

# 或使用现有 VPC
./deploy.sh prod vpc-0abc123def
```

### 生产环境特性

- **RDS**: t3.small, Multi-AZ, 7天备份
- **Redis**: cache.t3.small
- **ECS Tasks**: 最小 2 个，最大 10 个
- **Auto Scaling**: 基于 CPU 70% 和内存 80%
- **删除保护**: 启用
- **备份保留**: 7 天

## 场景 4: 多区域部署

在不同 AWS 区域部署应用。

### 部署到 us-east-1

```bash
export AWS_REGION=us-east-1
cd infra/scripts
./deploy.sh prod
```

### 部署到 us-west-2

```bash
export AWS_REGION=us-west-2
cd infra/scripts
./deploy.sh prod
```

### 部署到 ap-northeast-1 (东京)

```bash
export AWS_REGION=ap-northeast-1
cd infra/scripts
./deploy.sh prod
```

## 场景 5: 更新应用代码

修改代码后重新部署应用。

### 只更新后端

```bash
cd infra/scripts

# 构建并推送新镜像
./build-and-push.sh dev backend

# 强制 ECS 服务重新部署
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --force-new-deployment

# 等待部署完成
aws ecs wait services-stable \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev
```

### 只更新前端

```bash
cd infra/scripts

# 构建并推送新镜像
./build-and-push.sh dev frontend

# 强制 ECS 服务重新部署
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-frontend-dev \
  --force-new-deployment
```

### 同时更新前后端

```bash
cd infra/scripts
./build-and-push.sh dev all
```

## 场景 6: 基础设施变更

修改 CDK 代码后重新部署基础设施。

### 查看变更

```bash
cd infra/aws
cdk diff --context environment=dev
```

### 应用变更

```bash
cdk deploy --context environment=dev
```

### 示例：增加 ECS 任务内存

编辑 `lib/awsome-shop-stack.ts`:
```typescript
const backendTaskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
  family: `awsome-shop-backend-${environment}`,
  cpu: environment === 'prod' ? 1024 : 512,
  memoryLimitMiB: environment === 'prod' ? 2048 : 2048,  // 从 1024 改为 2048
  taskRole: backendTaskRole,
});
```

应用变更：
```bash
cdk deploy --context environment=dev
```

## 场景 7: 数据库迁移

部署后运行数据库迁移。

### 方法 1: 通过 ECS Exec

```bash
# 启用 ECS Exec
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --enable-execute-command

# 获取任务 ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev \
  --query 'taskArns[0]' \
  --output text)

# 连接到容器
aws ecs execute-command \
  --cluster awsome-shop-cluster-dev \
  --task $TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/bash"

# 在容器内运行迁移
alembic upgrade head
```

### 方法 2: 使用 Fargate Task

创建一次性任务运行迁移：
```bash
# 创建任务定义 JSON（使用现有的任务定义）
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition awsome-shop-backend-dev \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

# 运行迁移任务
aws ecs run-task \
  --cluster awsome-shop-cluster-dev \
  --task-definition $TASK_DEF \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx]}" \
  --overrides '{
    "containerOverrides": [{
      "name": "backend",
      "command": ["alembic", "upgrade", "head"]
    }]
  }'
```

## 场景 8: 查看日志和监控

### 查看 CloudWatch 日志

```bash
# 后端日志
aws logs tail /ecs/awsome-shop-backend-dev --follow

# 前端日志
aws logs tail /ecs/awsome-shop-frontend-dev --follow

# RDS 日志
aws logs tail /aws/rds/instance/awsome-shop-db-dev/postgresql --follow
```

### 查看 ECS 服务状态

```bash
# 服务概览
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev \
  --query 'services[0].[serviceName,status,runningCount,desiredCount,deployments]'

# 任务列表
aws ecs list-tasks \
  --cluster awsome-shop-cluster-dev \
  --service-name awsome-shop-backend-dev

# 任务详情
aws ecs describe-tasks \
  --cluster awsome-shop-cluster-dev \
  --tasks <task-arn>
```

### 查看负载均衡器健康状态

```bash
# 目标组健康检查
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## 场景 9: 扩容和缩容

### 手动调整任务数量

```bash
# 增加后端任务到 3 个
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 3

# 减少到 1 个
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 1
```

### 调整 Auto Scaling 阈值

编辑 `lib/awsome-shop-stack.ts`:
```typescript
if (environment === 'prod') {
  const backendScaling = backendService.autoScaleTaskCount({
    minCapacity: 2,
    maxCapacity: 20,  // 从 10 改为 20
  });

  backendScaling.scaleOnCpuUtilization('BackendCPUScaling', {
    targetUtilizationPercent: 60,  // 从 70 改为 60，更早触发扩容
  });
}
```

## 场景 10: 回滚部署

### 回滚 ECS 服务到上一版本

```bash
# 查看任务定义历史
aws ecs list-task-definitions \
  --family-prefix awsome-shop-backend-dev \
  --sort DESC

# 回滚到指定版本
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --task-definition awsome-shop-backend-dev:5  # 指定版本号
```

### 回滚基础设施变更

```bash
cd infra/aws

# 查看 CloudFormation 变更集历史
aws cloudformation describe-stack-events \
  --stack-name awsome-shop-dev \
  --max-items 20

# 回滚使用 Git
git log --oneline
git revert <commit-hash>
cdk deploy --context environment=dev
```

## 场景 11: 清理资源

### 删除整个 Stack

```bash
cd infra/aws

# 删除开发环境
cdk destroy --context environment=dev

# 删除使用现有 VPC 的部署
cdk destroy --context environment=dev --context vpcId=vpc-xxx

# 确认删除
# 输入 'y'
```

### 只删除 ECS 服务

如果只想停止应用但保留数据库：

```bash
# 停止服务（设置期望任务数为 0）
aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-backend-dev \
  --desired-count 0

aws ecs update-service \
  --cluster awsome-shop-cluster-dev \
  --service awsome-shop-frontend-dev \
  --desired-count 0
```

## 场景 12: 成本优化

### 开发环境成本优化

```bash
# 下班后停止所有任务
aws ecs update-service --cluster awsome-shop-cluster-dev --service awsome-shop-backend-dev --desired-count 0
aws ecs update-service --cluster awsome-shop-cluster-dev --service awsome-shop-frontend-dev --desired-count 0

# 停止 RDS 实例（最多 7 天）
aws rds stop-db-instance --db-instance-identifier awsome-shop-db-dev

# 第二天早上重启
aws rds start-db-instance --db-instance-identifier awsome-shop-db-dev
aws ecs update-service --cluster awsome-shop-cluster-dev --service awsome-shop-backend-dev --desired-count 1
aws ecs update-service --cluster awsome-shop-cluster-dev --service awsome-shop-frontend-dev --desired-count 1
```

### 使用 Spot 实例（高级）

对于非关键环境，可以考虑使用 Fargate Spot：

编辑 `lib/awsome-shop-stack.ts`:
```typescript
const backendService = new ecs.FargateService(this, 'BackendService', {
  // ... 其他配置
  capacityProviderStrategies: [
    {
      capacityProvider: 'FARGATE_SPOT',
      weight: 2,
      base: 0,
    },
    {
      capacityProvider: 'FARGATE',
      weight: 1,
      base: 1,
    },
  ],
});
```

## 故障排查示例

### 问题: ECS 任务无法启动

```bash
# 检查任务状态
aws ecs describe-tasks \
  --cluster awsome-shop-cluster-dev \
  --tasks <task-arn> \
  --query 'tasks[0].[lastStatus,stoppedReason,containers[0].reason]'

# 查看任务事件
aws ecs describe-services \
  --cluster awsome-shop-cluster-dev \
  --services awsome-shop-backend-dev \
  --query 'services[0].events[:5]'

# 检查日志
aws logs tail /ecs/awsome-shop-backend-dev --follow
```

### 问题: 健康检查失败

```bash
# 检查目标组健康状态
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# 手动测试健康检查端点
TASK_IP=$(aws ecs describe-tasks \
  --cluster awsome-shop-cluster-dev \
  --tasks <task-arn> \
  --query 'tasks[0].containers[0].networkInterfaces[0].privateIpv4Address' \
  --output text)

curl http://$TASK_IP:8000/health
```

### 问题: 无法连接数据库

```bash
# 检查安全组规则
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=awsome-shop-rds-sg-dev" \
  --query 'SecurityGroups[0].IpPermissions'

# 从 ECS 任务测试连接
aws ecs execute-command \
  --cluster awsome-shop-cluster-dev \
  --task <task-arn> \
  --container backend \
  --interactive \
  --command "/bin/bash"

# 在容器内
psql -h <rds-endpoint> -U awsome_admin -d awsome_shop
```

## 总结

这些示例涵盖了从基本部署到高级运维的各种场景。根据您的具体需求选择合适的方法。如需更多帮助，请参考：

- [AWS CDK README](README.md)
- [VPC 部署指南](VPC_DEPLOYMENT_GUIDE.md)
- [部署指南](../DEPLOYMENT_GUIDE.md)
