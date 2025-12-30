# 🚀 快速参考卡片

## 一键部署

```bash
cd infrastructure
./quick-deploy.sh
```

## 常用命令

### 部署相关
```bash
# 部署到开发环境
./deploy.sh dev

# 部署到生产环境
./deploy.sh prod

# 本地测试
./local-test.sh
```

### 查看状态
```bash
# 获取应用 URL
aws cloudformation describe-stacks \
    --stack-name dev-awsomeshop-frontend \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text

# 查看服务状态
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# 查看任务列表
aws ecs list-tasks \
    --cluster dev-awsomeshop-cluster \
    --service-name dev-awsomeshop-frontend-service
```

### 日志和监控
```bash
# 实时日志
aws logs tail /ecs/dev-awsomeshop-frontend --follow

# 查看最近的事件
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].events[0:5]'
```

### 清理资源
```bash
# 删除堆栈
aws cloudformation delete-stack --stack-name dev-awsomeshop-frontend

# 删除 ECR 仓库
aws ecr delete-repository --repository-name awsomeshop-frontend --force
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | password123 |
| 员工 | zhangsan | password123 |
| 员工 | lisi | password123 |

## 架构组件

- **Region**: us-east-1
- **VPC**: 10.0.0.0/16
- **Subnets**: 2 个公共子网（多可用区）
- **ALB**: 应用负载均衡器
- **ECS**: Fargate 无服务器容器
- **Tasks**: 2 个实例（默认）
- **CPU**: 0.25 vCPU per task
- **Memory**: 512 MB per task

## 预计成本

**~$35/月** (开发环境)

## 故障排查

### 服务无法启动
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].events[0:5]'
```

### 健康检查失败
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```

### 无法访问应用
1. 等待 2-3 分钟
2. 检查 ALB 状态
3. 检查目标组健康状态
4. 检查安全组规则

## 重要文件

| 文件 | 说明 |
|------|------|
| `ecs-deployment.yaml` | CloudFormation 模板 |
| `deploy.sh` | 完整部署脚本 |
| `quick-deploy.sh` | 快速部署脚本 |
| `local-test.sh` | 本地测试脚本 |
| `README.md` | 详细文档 |

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 HTTPS (ACM)
- [ ] 配置 Auto Scaling
- [ ] 集成 CI/CD
- [ ] 添加 WAF 保护
