# 🚀 开始部署 AWSomeShop 前端到 AWS ECS

## ✅ 已准备就绪

你的 ECS 部署方案已经完全配置好了！所有必要的文件都已创建。

## 📁 文件清单

✅ **Docker 配置** (3个文件)
- `AWSomeShopEmployeeRewardsSite/Dockerfile`
- `AWSomeShopEmployeeRewardsSite/.dockerignore`
- `AWSomeShopEmployeeRewardsSite/nginx.conf`

✅ **AWS 基础设施** (1个文件)
- `pre-infra/ecs-deployment.yaml`

✅ **自动化脚本** (3个文件)
- `pre-infra/deploy.sh` ⭐
- `pre-infra/quick-deploy.sh` ⭐⭐⭐ (推荐)
- `pre-infra/local-test.sh`

✅ **文档** (5个文件)
- `pre-infra/README.md`
- `pre-infra/QUICK_REFERENCE.md`
- `pre-infra/DEPLOYMENT_CHECKLIST.md`
- `pre-infra/FILES_OVERVIEW.md`
- `DEPLOYMENT_INSTRUCTIONS.md`

✅ **总结文档** (2个文件)
- `ECS_DEPLOYMENT_SUMMARY.md`
- `START_HERE.md` (本文件)

---

## 🎯 三种部署方式

### 方式1: 一键部署（最简单）⭐⭐⭐

```bash
cd pre-infra
./quick-deploy.sh
```

**适合**: 首次部署、快速测试

---

### 方式2: 本地测试后部署（推荐）⭐⭐

```bash
# 步骤1: 本地测试
cd pre-infra
./local-test.sh
# 访问 http://localhost:8080 验证

# 步骤2: 部署到 AWS
./quick-deploy.sh
```

**适合**: 谨慎部署、验证配置

---

### 方式3: 完整部署流程（高级）⭐

```bash
cd pre-infra
./deploy.sh dev        # 开发环境
# 或
./deploy.sh prod       # 生产环境
```

**适合**: 生产环境、自定义配置

---

## ⚡ 快速开始（5分钟）

### 步骤1: 检查前置条件

```bash
# 检查 AWS CLI
aws --version
aws sts get-caller-identity

# 检查 Docker
docker --version
```

如果命令失败，请先安装：
- AWS CLI: `brew install awscli`
- Docker: `brew install --cask docker`

### 步骤2: 配置 AWS 凭证（如果还没配置）

```bash
aws configure
```

输入你的：
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### 步骤3: 一键部署

```bash
cd pre-infra
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### 步骤4: 等待完成（10-15分钟）

脚本会自动完成：
1. ✅ 创建 ECR 仓库
2. ✅ 构建 Docker 镜像
3. ✅ 推送镜像到 ECR
4. ✅ 部署 CloudFormation 堆栈
5. ✅ 输出应用 URL

### 步骤5: 访问应用

部署完成后，你会看到类似这样的输出：

```
========================================
Deployment Complete!
========================================
Application URL: http://dev-awsomeshop-alb-1234567890.us-east-1.elb.amazonaws.com
```

在浏览器中打开这个 URL，使用测试账号登录：
- 管理员: `admin` / `password123`
- 员工: `zhangsan` / `password123`

---

## 📚 详细文档

### 新手必读
1. 📘 `DEPLOYMENT_INSTRUCTIONS.md` - 完整的部署指南
2. 📋 `ECS_DEPLOYMENT_SUMMARY.md` - 部署方案总结

### 快速参考
- 🔍 `pre-infra/QUICK_REFERENCE.md` - 常用命令
- 📁 `pre-infra/FILES_OVERVIEW.md` - 文件说明

### 详细文档
- 📚 `pre-infra/README.md` - 完整技术文档
- ✅ `pre-infra/DEPLOYMENT_CHECKLIST.md` - 检查清单

---

## 🧪 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | password123 |
| 员工 | zhangsan | password123 |
| 员工 | lisi | password123 |

---

## 💰 成本说明

**开发环境**: 约 $35/月

包含：
- ECS Fargate (2 tasks): ~$15
- Application Load Balancer: ~$16
- Data Transfer: ~$1
- CloudWatch Logs: ~$3

> ⚠️ **重要**: 测试完成后记得删除资源！

---

## 🧹 测试完成后清理

```bash
# 删除 CloudFormation 堆栈（删除所有资源）
aws cloudformation delete-stack \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1

# 等待删除完成
aws cloudformation wait stack-delete-complete \
    --stack-name dev-awsomeshop-frontend \
    --region us-east-1

# 删除 ECR 仓库（可选）
aws ecr delete-repository \
    --repository-name awsomeshop-frontend \
    --force \
    --region us-east-1
```

---

## 🔧 常用命令

### 查看部署状态
```bash
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --query 'Stacks[0].StackStatus'
```

### 获取应用 URL
```bash
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text
```

### 查看实时日志
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```

### 查看服务状态
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service
```

---

## 🐛 遇到问题？

### 问题1: AWS CLI 未配置
```bash
aws configure
```

### 问题2: Docker 未运行
```bash
# 启动 Docker Desktop
open -a Docker
```

### 问题3: 权限不足
确保你的 IAM 用户有以下权限：
- ECS Full Access
- ECR Full Access
- CloudFormation Full Access
- VPC Full Access
- ELB Full Access
- IAM Full Access

### 问题4: 部署失败
查看详细日志：
```bash
aws cloudformation describe-stack-events \
    --stack-name dev-awsomeshop-frontend \
    --max-items 20
```

### 问题5: 无法访问应用
1. 等待 2-3 分钟让服务完全启动
2. 检查 ECS 服务状态
3. 查看容器日志

---

## 📞 获取更多帮助

### 查看详细文档
```bash
# 完整部署指南
cat DEPLOYMENT_INSTRUCTIONS.md

# 技术文档
cat pre-infra/README.md

# 快速参考
cat pre-infra/QUICK_REFERENCE.md
```

### 查看日志
```bash
# 应用日志
aws logs tail /ecs/dev-awsomeshop-frontend --follow

# CloudFormation 事件
aws cloudformation describe-stack-events \
    --stack-name dev-awsomeshop-frontend

# ECS 服务事件
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].events[0:10]'
```

---

## 🎉 准备好了吗？

现在就开始部署吧！

```bash
cd pre-infra
./quick-deploy.sh
```

**祝部署顺利！** 🚀

---

## 📋 部署后检查清单

部署完成后，确认以下项目：

- [ ] 应用 URL 可以访问
- [ ] 登录页面正常显示
- [ ] 可以使用测试账号登录
- [ ] 产品列表正常显示
- [ ] 积分余额正常显示
- [ ] 页面导航正常工作
- [ ] 无 JavaScript 错误
- [ ] CloudWatch 有日志输出
- [ ] ECS 服务状态为 ACTIVE
- [ ] 运行任务数 = 2

全部完成？恭喜你成功部署了 AWSomeShop 前端！🎊

---

**需要帮助？** 查看 `DEPLOYMENT_INSTRUCTIONS.md` 或 `pre-infra/README.md`
