# ✅ 部署检查清单

## 部署前检查

### 环境准备
- [ ] AWS CLI 已安装 (`aws --version`)
- [ ] Docker 已安装 (`docker --version`)
- [ ] AWS 凭证已配置 (`aws sts get-caller-identity`)
- [ ] 确认 AWS 区域设置为 `us-east-1`

### 权限检查
- [ ] IAM 用户有 ECS 权限
- [ ] IAM 用户有 ECR 权限
- [ ] IAM 用户有 CloudFormation 权限
- [ ] IAM 用户有 VPC/EC2 权限
- [ ] IAM 用户有 ELB 权限
- [ ] IAM 用户有 IAM 创建角色权限

### 代码准备
- [ ] 前端代码已更新到最新版本
- [ ] 本地构建测试通过 (`npm run build`)
- [ ] 所有依赖已安装 (`npm install`)

## 部署过程检查

### 步骤1: ECR 仓库
- [ ] ECR 仓库创建成功
- [ ] 镜像扫描已启用

### 步骤2: Docker 镜像
- [ ] Docker 镜像构建成功
- [ ] 镜像大小合理（< 100MB）
- [ ] 镜像标签正确

### 步骤3: 镜像推送
- [ ] ECR 登录成功
- [ ] 镜像推送成功
- [ ] latest 标签已更新

### 步骤4: CloudFormation
- [ ] 堆栈创建/更新开始
- [ ] VPC 创建成功
- [ ] 子网创建成功
- [ ] 安全组创建成功
- [ ] ALB 创建成功
- [ ] ECS 集群创建成功
- [ ] ECS 服务创建成功
- [ ] 任务定义创建成功

### 步骤5: 服务启动
- [ ] 任务启动成功
- [ ] 健康检查通过
- [ ] 目标组注册成功
- [ ] ALB 状态为 active

## 部署后验证

### 基础验证
- [ ] 获取 ALB URL 成功
- [ ] 浏览器可以访问应用
- [ ] 登录页面正常显示
- [ ] 静态资源加载正常

### 功能验证
- [ ] 管理员登录成功 (admin/password123)
- [ ] 员工登录成功 (zhangsan/password123)
- [ ] 产品列表显示正常
- [ ] 积分余额显示正常
- [ ] 页面导航正常
- [ ] 响应式布局正常

### 性能验证
- [ ] 页面加载时间 < 3秒
- [ ] 健康检查端点响应正常 (/health)
- [ ] 无 JavaScript 错误
- [ ] 无 404 错误

### 监控验证
- [ ] CloudWatch Logs 有日志输出
- [ ] Container Insights 显示指标
- [ ] ECS 服务状态为 ACTIVE
- [ ] 运行任务数 = 期望任务数

## 安全检查

### 网络安全
- [ ] 安全组规则正确配置
- [ ] 仅允许必要的端口
- [ ] ALB 安全组允许 80/443
- [ ] ECS 安全组仅允许来自 ALB 的流量

### 应用安全
- [ ] 容器以非 root 用户运行
- [ ] 敏感信息未硬编码
- [ ] 安全响应头已配置
- [ ] CORS 策略正确配置

### 访问控制
- [ ] IAM 角色遵循最小权限原则
- [ ] 任务执行角色权限正确
- [ ] 任务角色权限正确

## 成本检查

- [ ] 确认资源配置符合预算
- [ ] 了解预计月成本 (~$35)
- [ ] 设置成本告警（可选）
- [ ] 确认不需要时会删除资源

## 文档检查

- [ ] 记录 ALB URL
- [ ] 记录 ECR 仓库 URI
- [ ] 记录堆栈名称
- [ ] 记录部署时间
- [ ] 更新团队文档

## 回滚准备

- [ ] 了解回滚步骤
- [ ] 保留上一个版本的镜像标签
- [ ] 测试回滚流程（可选）

## 清理检查（测试完成后）

- [ ] 删除 CloudFormation 堆栈
- [ ] 确认所有资源已删除
- [ ] 删除 ECR 仓库（可选）
- [ ] 确认无残留费用

---

## 快速命令参考

### 检查部署状态
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

### 查看服务状态
```bash
aws ecs describe-services \
    --cluster dev-awsomeshop-cluster \
    --services dev-awsomeshop-frontend-service \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### 查看日志
```bash
aws logs tail /ecs/dev-awsomeshop-frontend --follow
```

---

**部署日期**: _______________  
**部署人员**: _______________  
**环境**: [ ] dev [ ] staging [ ] prod  
**状态**: [ ] 成功 [ ] 失败 [ ] 部分成功  
**备注**: _______________
