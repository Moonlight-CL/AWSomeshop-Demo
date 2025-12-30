# 🔧 AWSomeShop 部署故障排查指南

## 常见问题和解决方案

---

## ❌ 问题1: `exec format error` 或 `exec /docker-entrypoint.sh: exec format error`

### 症状
- ECS 任务启动失败
- CloudWatch 日志显示 `exec format error`
- 容器健康检查失败

### 原因
Docker 镜像架构不匹配。通常是在 ARM64 架构（Mac M1/M2）上构建镜像，但 ECS Fargate 运行在 x86_64 架构上。

### 解决方案

#### 方法1: 使用修复脚本（最简单）✅

```bash
cd infrastructure
chmod +x fix-and-redeploy.sh
./fix-and-redeploy.sh
```

这个脚本会：
1. 使用 Docker Buildx 构建正确架构的镜像
2. 推送到 ECR
3. 更新 ECS 服务
4. 等待服务稳定

#### 方法2: 手动重新构建

```bash
# 1. 进入前端目录
cd AWSomeShopEmployeeRewardsSite

# 2. 创建 buildx builder
docker buildx create --name awsomeshop-builder --use

# 3. 构建 linux/amd64 镜像
docker buildx build \
    --platform linux/amd64 \
    --tag awsomeshop-frontend:latest \
    --load \
    .

# 4. 标记镜像
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend"

docker tag awsomeshop-frontend:latest ${ECR_URI}:latest

# 5. 登录 ECR
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_URI}

# 6. 推送镜像
docker push ${ECR_URI}:latest

# 7. 强制 ECS 重新部署
aws ecs update-service \
    --cluster dev-awsomeshop-cluster \
    --service dev-awsomeshop-frontend-service \
    --force-new-deployment \
    --region ${AWS_REGION}
```

#### 方法3: 验证镜像架构

```bash
# 检查本地镜像架构
docker image inspect awsomeshop-frontend:latest | grep Architecture

# 应该显示: "Architecture": "amd64"
```

---

## ❌ 问题2: 健康检查失败

### 症状
- ECS 任务不断重启
- 目标组显示 "unhealthy"
- ALB 无法访问应用

### 诊断步骤

```bash
# 1. 查看 ECS 服务事件
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].events[0:10]'

# 2. 查看容器日志
aws logs tail /ecs/dev-awsomeshop-frontend --follow

# 3. 检查目标组健康状态
aws elbv2 describe-target-health \
    --target-group-arn <TARGET_GROUP_ARN>
```

### 解决方案

#### 检查1: 应用是否正常启动

```bash
# 查看最近的日志
aws logs tail /ecs/dev-awsomeshop-frontend --since 5m
```

应该看到 nginx 启动日志，例如：
```
nginx: [notice] start worker processes
```

#### 检查2: 健康检查路径

确保 nginx 配置正确：

```nginx
# nginx.conf 应该包含
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

#### 检查3: 端口映射

确保容器端口和目标组端口一致（都是 80）。

---

## ❌ 问题3: 无法访问 ALB URL

### 症状
- 浏览器显示 "无法访问此网站"
- 或显示 503 Service Unavailable

### 诊断步骤

```bash
# 1. 获取 ALB URL
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text

# 2. 检查 ALB 状态
aws elbv2 describe-load-balancers \
    --names dev-awsomeshop-alb \
    --query 'LoadBalancers[0].State'

# 3. 检查目标组
aws elbv2 describe-target-health \
    --target-group-arn <TARGET_GROUP_ARN>
```

### 解决方案

#### 等待服务启动

首次部署需要 2-3 分钟：
```bash
# 等待服务稳定
aws ecs wait services-stable \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service
```

#### 检查安全组

确保 ALB 安全组允许入站流量：
```bash
aws ec2 describe-security-groups \
    --filters "Name=tag:Name,Values=dev-awsomeshop-alb-sg" \
    --query 'SecurityGroups[0].IpPermissions'
```

应该允许端口 80 的入站流量。

---

## ❌ 问题4: Docker 构建失败

### 症状
- `npm ci` 失败
- 依赖安装错误
- 构建超时

### 解决方案

#### 清理 Docker 缓存

```bash
# 清理构建缓存
docker builder prune -af

# 重新构建
docker buildx build --no-cache --platform linux/amd64 -t awsomeshop-frontend:latest .
```

#### 检查 package.json

确保所有依赖都已正确定义：
```bash
cd AWSomeShopEmployeeRewardsSite
npm install
npm run build
```

---

## ❌ 问题5: ECR 推送失败

### 症状
- `denied: Your authorization token has expired`
- `no basic auth credentials`

### 解决方案

```bash
# 重新登录 ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend"

aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_URI}

# 重新推送
docker push ${ECR_URI}:latest
```

---

## ❌ 问题6: CloudFormation 堆栈更新失败

### 症状
- `UPDATE_ROLLBACK_COMPLETE`
- 堆栈回滚到之前的状态

### 诊断步骤

```bash
# 查看堆栈事件
aws cloudformation describe-stack-events \
    --stack-name dev-awsomeshop-frontend \
    --max-items 20 \
    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`]'
```

### 解决方案

#### 删除并重新创建

```bash
# 1. 删除失败的堆栈
aws cloudformation delete-stack --stack-name dev-awsomeshop-frontend

# 2. 等待删除完成
aws cloudformation wait stack-delete-complete --stack-name dev-awsomeshop-frontend

# 3. 重新部署
cd infrastructure
./quick-deploy.sh
```

---

## 🔍 诊断工具

### 快速检查脚本

创建 `check-status.sh`:

```bash
#!/bin/bash

ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "=== ECS Service Status ==="
aws ecs describe-services \
    --cluster ${ENVIRONMENT}-awsomeshop-cluster \
    --services ${ENVIRONMENT}-awsomeshop-frontend-service \
    --region ${AWS_REGION} \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}'

echo -e "\n=== Recent Service Events ==="
aws ecs describe-services \
    --cluster ${ENVIRONMENT}-awsomeshop-cluster \
    --services ${ENVIRONMENT}-awsomeshop-frontend-service \
    --region ${AWS_REGION} \
    --query 'services[0].events[0:5]'

echo -e "\n=== Task Status ==="
TASK_ARN=$(aws ecs list-tasks \
    --cluster ${ENVIRONMENT}-awsomeshop-cluster \
    --service-name ${ENVIRONMENT}-awsomeshop-frontend-service \
    --region ${AWS_REGION} \
    --query 'taskArns[0]' \
    --output text)

if [ ! -z "$TASK_ARN" ]; then
    aws ecs describe-tasks \
        --cluster ${ENVIRONMENT}-awsomeshop-cluster \
        --tasks $TASK_ARN \
        --region ${AWS_REGION} \
        --query 'tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,StoppedReason:stoppedReason}'
fi

echo -e "\n=== Recent Logs ==="
aws logs tail /ecs/${ENVIRONMENT}-awsomeshop-frontend --since 5m --region ${AWS_REGION}
```

---

## 📞 获取更多帮助

### 查看详细日志

```bash
# 实时日志
aws logs tail /ecs/dev-awsomeshop-frontend --follow

# 过去1小时的日志
aws logs tail /ecs/dev-awsomeshop-frontend --since 1h

# 搜索错误
aws logs tail /ecs/dev-awsomeshop-frontend --since 1h --filter-pattern "ERROR"
```

### 检查 AWS 服务状态

访问 [AWS Service Health Dashboard](https://status.aws.amazon.com/)

### 联系支持

如果问题持续存在：
1. 收集所有日志和错误信息
2. 记录重现步骤
3. 联系 AWS Support 或提交 GitHub Issue

---

## ✅ 预防措施

### 1. 始终使用正确的架构构建

在 `deploy.sh` 中使用：
```bash
docker buildx build --platform linux/amd64 ...
```

### 2. 本地测试

部署前先本地测试：
```bash
cd infrastructure
./local-test.sh
```

### 3. 使用 CI/CD

设置 GitHub Actions 或 AWS CodePipeline 自动化部署，确保一致性。

### 4. 监控和告警

配置 CloudWatch 告警：
- ECS 服务健康状态
- ALB 目标健康状态
- 容器 CPU/内存使用率

---

**记住**: 大多数部署问题都可以通过查看日志快速诊断！

```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```
