# AWSomeShop 前端部署指南

## 🎯 部署目标

将 AWSomeShop 前端应用部署到 AWS ECS，实现：
- ✅ 高可用性（多可用区部署）
- ✅ 自动扩展
- ✅ 负载均衡
- ✅ 健康检查和自动恢复
- ✅ 零停机更新

## 📋 部署前准备

### 1. 安装必要工具

**AWS CLI**
```bash
# macOS
brew install awscli

# 验证安装
aws --version
```

**Docker**
```bash
# macOS
brew install --cask docker

# 验证安装
docker --version
```

### 2. 配置 AWS 凭证

```bash
aws configure
```

输入以下信息：
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `us-east-1`
- Default output format: `json`

### 3. 验证 AWS 权限

```bash
# 测试 AWS 连接
aws sts get-caller-identity

# 应该返回你的账号信息
```

## 🧪 本地测试（可选但推荐）

在部署到 AWS 之前，先在本地测试 Docker 镜像：

```bash
cd pre-infra
chmod +x local-test.sh
./local-test.sh
```

访问 http://localhost:8080 验证应用正常运行。

测试完成后清理：
```bash
docker stop awsomeshop-test && docker rm awsomeshop-test
```

## 🚀 部署到 AWS ECS

### 方法1: 一键部署（推荐）

```bash
cd pre-infra
chmod +x quick-deploy.sh
./quick-deploy.sh
```

这个脚本会：
1. ✅ 检查所有前置条件
2. ✅ 确认部署信息
3. ✅ 自动执行完整部署流程

### 方法2: 完整部署脚本

```bash
cd pre-infra
chmod +x deploy.sh

# 部署到开发环境
./deploy.sh dev

# 或部署到生产环境
./deploy.sh prod
```

### 部署过程说明

脚本会自动完成以下步骤（约 10-15 分钟）：

1. **[1/6] 创建 ECR 仓库** (~30秒)
   - 创建 Docker 镜像仓库
   - 启用镜像扫描

2. **[2/6] 构建 Docker 镜像** (~2-3分钟)
   - 编译前端应用
   - 构建生产环境镜像

3. **[3/6] 登录 ECR** (~5秒)
   - 获取 ECR 登录凭证

4. **[4/6] 推送镜像** (~1-2分钟)
   - 上传镜像到 ECR

5. **[5/6] 部署 CloudFormation** (~5-8分钟)
   - 创建 VPC、子网、安全组
   - 创建负载均衡器
   - 创建 ECS 集群和服务
   - 启动容器

6. **[6/6] 获取访问地址** (~5秒)
   - 输出应用 URL

## ✅ 验证部署

### 1. 检查部署状态

```bash
# 查看 CloudFormation 堆栈状态
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus'

# 应该返回: "CREATE_COMPLETE" 或 "UPDATE_COMPLETE"
```

### 2. 获取应用 URL

```bash
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text
```

### 3. 访问应用

在浏览器中打开上面获取的 URL，例如：
```
http://dev-awsomeshop-alb-1234567890.us-east-1.elb.amazonaws.com
```

### 4. 测试功能

- ✅ 登录页面正常显示
- ✅ 使用测试账号登录：
  - 管理员：`admin` / `password123`
  - 员工：`zhangsan` / `password123`
- ✅ 查看产品列表
- ✅ 查看积分余额

### 5. 检查服务健康状态

```bash
# 查看 ECS 服务状态
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --region us-east-1 \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

应该看到：
```json
{
    "Status": "ACTIVE",
    "Running": 2,
    "Desired": 2
}
```

## 📊 监控和日志

### 查看实时日志

```bash
# 查看应用日志
aws logs tail /ecs/dev-awsomeshop-frontend --follow --region us-east-1
```

### 查看 CloudWatch 指标

1. 登录 AWS Console
2. 进入 CloudWatch
3. 选择 "Container Insights"
4. 查看 ECS 集群指标

### 查看 ECS 控制台

1. 登录 AWS Console
2. 进入 ECS 服务
3. 选择集群：`dev-awsomeshop-cluster`
4. 查看服务和任务状态

## 🔄 更新应用

### 更新代码后重新部署

```bash
# 修改代码后
cd pre-infra
./deploy.sh dev
```

ECS 会自动执行滚动更新：
1. 启动新版本容器
2. 等待健康检查通过
3. 停止旧版本容器
4. 零停机完成更新

### 回滚到上一个版本

```bash
# 查看镜像历史
aws ecr describe-images \
    --repository-name awsomeshop-frontend \
    --region us-east-1 \
    --query 'sort_by(imageDetails,& imagePushedAt)[*].[imageTags[0],imagePushedAt]' \
    --output table

# 更新服务使用旧镜像
aws ecs update-service \
    --cluster dev-awsomeshop-cluster \
    --service dev-awsomeshop-frontend-service \
    --task-definition <OLD_TASK_DEFINITION_ARN> \
    --region us-east-1
```

## 🧹 清理资源

### 删除整个部署

```bash
# 删除 CloudFormation 堆栈（会删除所有资源）
aws cloudformation delete-stack \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1

# 等待删除完成（约 5-10 分钟）
aws cloudformation wait stack-delete-complete \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1
```

### 删除 ECR 仓库

```bash
# 删除 ECR 仓库和所有镜像
aws ecr delete-repository \
    --repository-name awsomeshop-frontend \
    --force \
    --region us-east-1
```

## 💰 成本说明

基于默认配置，预计月成本：

| 服务 | 成本 |
|------|------|
| ECS Fargate (2 tasks) | ~$15 |
| Application Load Balancer | ~$16 |
| Data Transfer | ~$1 |
| CloudWatch Logs | ~$3 |
| **总计** | **~$35/月** |

> 💡 提示：开发测试完成后记得删除资源以避免持续费用

## 🐛 常见问题

### 问题1: 部署失败 - "No space left on device"

**解决方案**：清理 Docker 空间
```bash
docker system prune -a
```

### 问题2: 健康检查失败

**解决方案**：检查容器日志
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow --region us-east-1
```

### 问题3: 无法访问应用

**检查步骤**：
1. 确认 ALB 状态为 "active"
2. 确认目标组有健康的目标
3. 确认安全组允许 80 端口入站流量
4. 等待 2-3 分钟让服务完全启动

### 问题4: AWS CLI 权限不足

**解决方案**：确保 IAM 用户有以下权限：
- AmazonECS_FullAccess
- AmazonEC2ContainerRegistryFullAccess
- CloudFormationFullAccess
- IAMFullAccess
- AmazonVPCFullAccess
- ElasticLoadBalancingFullAccess

## 📞 获取帮助

### 查看详细文档

```bash
cd pre-infra
cat README.md
```

### 查看部署日志

```bash
# CloudFormation 事件
aws cloudformation describe-stack-events \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1 \
    --max-items 20

# ECS 服务事件
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --region us-east-1 \
    --query 'services[0].events[0:10]'
```

## 🎉 下一步

部署成功后，你可以：

1. ✅ 配置自定义域名（Route 53 + ACM）
2. ✅ 启用 HTTPS
3. ✅ 配置 Auto Scaling
4. ✅ 集成 CI/CD（GitHub Actions）
5. ✅ 添加 WAF 保护
6. ✅ 配置备份策略

---

**祝部署顺利！** 🚀
