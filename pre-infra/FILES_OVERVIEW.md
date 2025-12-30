# 📁 ECS 部署文件总览

## 文件结构

```
AWSomeshop-Demo/
├── AWSomeShopEmployeeRewardsSite/
│   ├── Dockerfile                    # Docker 镜像构建文件
│   ├── .dockerignore                 # Docker 构建忽略文件
│   └── nginx.conf                    # Nginx 配置文件
│
├── pre-infra/
│   ├── ecs-deployment.yaml           # CloudFormation 模板（主要）
│   ├── deploy.sh                     # 完整部署脚本
│   ├── quick-deploy.sh               # 快速部署脚本
│   ├── local-test.sh                 # 本地测试脚本
│   ├── README.md                     # 详细部署文档
│   ├── QUICK_REFERENCE.md            # 快速参考卡片
│   ├── DEPLOYMENT_CHECKLIST.md       # 部署检查清单
│   └── FILES_OVERVIEW.md             # 本文件
│
└── DEPLOYMENT_INSTRUCTIONS.md        # 部署指南（根目录）
```

## 文件说明

### 🐳 Docker 相关文件

#### `AWSomeShopEmployeeRewardsSite/Dockerfile`
**用途**: 定义如何构建前端应用的 Docker 镜像

**特点**:
- 多阶段构建，优化镜像大小
- 使用 Node.js 18 Alpine 构建
- 使用 Nginx Alpine 作为生产环境
- 包含健康检查配置

**何时使用**: 自动被部署脚本调用，无需手动使用

---

#### `AWSomeShopEmployeeRewardsSite/.dockerignore`
**用途**: 指定 Docker 构建时忽略的文件

**内容**:
- node_modules
- 开发文件
- Git 文件
- 日志文件

**何时使用**: Docker 构建时自动使用

---

#### `AWSomeShopEmployeeRewardsSite/nginx.conf`
**用途**: Nginx Web 服务器配置

**功能**:
- SPA 路由支持
- Gzip 压缩
- 静态资源缓存
- 安全响应头
- 健康检查端点

**何时使用**: 容器启动时自动加载

---

### ☁️ AWS 基础设施文件

#### `pre-infra/ecs-deployment.yaml`
**用途**: CloudFormation 模板，定义所有 AWS 资源

**包含资源**:
- VPC 和网络配置
- Application Load Balancer
- ECS Cluster 和 Service
- Security Groups
- IAM Roles
- CloudWatch Logs

**参数**:
- EnvironmentName (dev/staging/prod)
- ContainerImage (Docker 镜像 URI)
- DesiredCount (任务数量)
- TaskCpu/TaskMemory (资源配置)

**何时使用**: 通过部署脚本自动使用

---

### 🚀 部署脚本

#### `pre-infra/deploy.sh`
**用途**: 完整的自动化部署脚本

**功能**:
1. 创建 ECR 仓库
2. 构建 Docker 镜像
3. 推送镜像到 ECR
4. 部署 CloudFormation 堆栈
5. 输出应用 URL

**使用方法**:
```bash
cd pre-infra
./deploy.sh dev        # 部署到开发环境
./deploy.sh prod       # 部署到生产环境
```

**执行时间**: 约 10-15 分钟

---

#### `pre-infra/quick-deploy.sh`
**用途**: 简化的一键部署脚本

**功能**:
- 检查前置条件
- 确认部署信息
- 调用完整部署脚本

**使用方法**:
```bash
cd pre-infra
./quick-deploy.sh
```

**适用场景**: 首次部署或快速测试

---

#### `pre-infra/local-test.sh`
**用途**: 本地 Docker 测试脚本

**功能**:
- 构建 Docker 镜像
- 在本地运行容器
- 提供测试 URL

**使用方法**:
```bash
cd pre-infra
./local-test.sh
# 访问 http://localhost:8080
```

**适用场景**: 部署前本地验证

---

### 📚 文档文件

#### `pre-infra/README.md`
**用途**: 详细的部署文档

**内容**:
- 架构说明
- 部署步骤
- 监控和日志
- 更新和回滚
- 成本估算
- 故障排查

**适用人群**: 开发人员、运维人员

---

#### `pre-infra/QUICK_REFERENCE.md`
**用途**: 快速参考卡片

**内容**:
- 常用命令
- 测试账号
- 架构组件
- 故障排查

**适用场景**: 日常运维参考

---

#### `pre-infra/DEPLOYMENT_CHECKLIST.md`
**用途**: 部署检查清单

**内容**:
- 部署前检查
- 部署过程检查
- 部署后验证
- 安全检查
- 清理检查

**适用场景**: 确保部署质量

---

#### `DEPLOYMENT_INSTRUCTIONS.md`
**用途**: 完整的部署指南（根目录）

**内容**:
- 部署前准备
- 本地测试
- 部署到 AWS
- 验证部署
- 监控和日志
- 更新应用
- 清理资源
- 常见问题

**适用人群**: 所有用户

---

## 使用流程

### 首次部署

```
1. 阅读 DEPLOYMENT_INSTRUCTIONS.md
   ↓
2. 检查 DEPLOYMENT_CHECKLIST.md
   ↓
3. 运行 local-test.sh (可选)
   ↓
4. 运行 quick-deploy.sh
   ↓
5. 验证部署成功
```

### 日常运维

```
1. 参考 QUICK_REFERENCE.md
   ↓
2. 使用常用命令
   ↓
3. 查看日志和监控
```

### 更新部署

```
1. 修改代码
   ↓
2. 运行 deploy.sh dev
   ↓
3. 验证更新成功
```

## 快速开始

### 最简单的方式

```bash
# 1. 进入目录
cd pre-infra

# 2. 一键部署
./quick-deploy.sh

# 3. 等待完成（10-15分钟）

# 4. 访问应用
# URL 会在部署完成后显示
```

### 本地测试

```bash
# 1. 本地测试
cd pre-infra
./local-test.sh

# 2. 访问 http://localhost:8080

# 3. 测试通过后部署
./quick-deploy.sh
```

## 获取帮助

### 查看详细文档
```bash
cat pre-infra/README.md
```

### 查看快速参考
```bash
cat pre-infra/QUICK_REFERENCE.md
```

### 查看部署指南
```bash
cat DEPLOYMENT_INSTRUCTIONS.md
```

## 重要提示

1. ⚠️ **首次部署前**，请仔细阅读 `DEPLOYMENT_INSTRUCTIONS.md`
2. ⚠️ **部署过程中**，请参考 `DEPLOYMENT_CHECKLIST.md`
3. ⚠️ **日常运维时**，请使用 `QUICK_REFERENCE.md`
4. ⚠️ **测试完成后**，记得清理资源以避免费用

## 支持

如有问题，请查看：
1. `pre-infra/README.md` - 详细文档
2. `DEPLOYMENT_INSTRUCTIONS.md` - 常见问题
3. AWS CloudWatch Logs - 应用日志
4. AWS Console - 资源状态

---

**祝部署顺利！** 🚀
