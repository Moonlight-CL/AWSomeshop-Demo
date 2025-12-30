# 🚨 快速修复：exec format error

## 问题
ECS 部署失败，错误信息：`exec /docker-entrypoint.sh: exec format error`

## 原因
Docker 镜像架构不匹配（本地 ARM64 vs ECS x86_64）

---

## ✅ 解决方案（3选1）

### 方法1: 一键修复脚本（推荐）⭐

```bash
cd pre-infra
chmod +x fix-and-redeploy.sh
./fix-and-redeploy.sh
```

**耗时**: 约 5-8 分钟  
**自动完成**: 重新构建 → 推送 → 更新服务

---

### 方法2: 使用更新后的部署脚本

```bash
cd pre-infra
./deploy.sh dev
```

**说明**: 部署脚本已更新，现在会自动构建正确架构的镜像

---

### 方法3: 手动修复

```bash
# 1. 进入前端目录
cd AWSomeShopEmployeeRewardsSite

# 2. 设置变量
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/awsomeshop-frontend"

# 3. 创建 buildx builder
docker buildx create --name awsomeshop-builder --use 2>/dev/null || docker buildx use awsomeshop-builder

# 4. 构建正确架构的镜像
docker buildx build \
    --platform linux/amd64 \
    --tag ${ECR_URI}:latest \
    --load \
    .

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

# 8. 等待服务稳定
aws ecs wait services-stable \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --region ${AWS_REGION}
```

---

## 🔍 验证修复

### 检查镜像架构
```bash
docker image inspect awsomeshop-frontend:latest | grep Architecture
# 应该显示: "Architecture": "amd64"
```

### 查看 ECS 服务状态
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### 查看容器日志
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```

应该看到 nginx 正常启动：
```
nginx: [notice] start worker processes
```

### 访问应用
```bash
# 获取 URL
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text
```

---

## 📝 已修复的文件

✅ `AWSomeShopEmployeeRewardsSite/Dockerfile` - 添加 `--platform=linux/amd64`  
✅ `pre-infra/deploy.sh` - 使用 Docker Buildx 构建多架构镜像  
✅ `pre-infra/fix-and-redeploy.sh` - 新增一键修复脚本  
✅ `pre-infra/TROUBLESHOOTING.md` - 完整故障排查指南  

---

## 🎯 预防措施

### 始终使用 Buildx 构建

```bash
docker buildx build --platform linux/amd64 -t myimage:latest .
```

### 或在 Dockerfile 中指定

```dockerfile
FROM --platform=linux/amd64 node:18-alpine AS builder
```

---

## 📚 更多帮助

- 完整故障排查: `pre-infra/TROUBLESHOOTING.md`
- 部署文档: `pre-infra/README.md`
- 快速参考: `pre-infra/QUICK_REFERENCE.md`

---

**问题解决了吗？** 如果还有问题，查看日志：

```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```
