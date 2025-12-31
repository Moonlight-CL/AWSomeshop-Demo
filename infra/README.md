# AWSomeShop Infrastructure

AWSomeShop 系统的基础设施配置和部署脚本。

## 目录结构

```
infra/
├── docker/             # Docker配置文件
│   ├── backend/       # 后端Docker配置
│   ├── frontend/      # 前端Docker配置
│   └── nginx/         # Nginx配置
├── aws/               # AWS CDK基础设施代码
├── scripts/           # 部署和管理脚本
└── docker-compose.yml # 本地开发环境编排
```

## 本地开发环境

使用Docker Compose启动完整的开发环境：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 服务端口

- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- 数据库: localhost:5432
- Redis: localhost:6379
- 管理界面: http://localhost:8080

## AWS 部署

### 快速部署

使用一键部署脚本（推荐）：

```bash
cd scripts

# 创建新 VPC 并部署
./deploy.sh dev          # 开发环境
./deploy.sh prod         # 生产环境

# 或使用现有 VPC
./deploy.sh dev vpc-xxxxx   # 在现有 VPC 中部署
```

### 手动部署

使用 AWS CDK 进行云端部署：

```bash
cd aws
npm install

# 创建新 VPC
cdk deploy --context environment=dev

# 使用现有 VPC
cdk deploy --context environment=dev --context vpcId=vpc-xxxxx
```

### 详细文档

- [AWS CDK 完整文档](aws/README.md)
- [使用现有 VPC 部署指南](aws/VPC_DEPLOYMENT_GUIDE.md)
- [CDK 实现总结](CDK_IMPLEMENTATION_SUMMARY.md)
- [部署指南](DEPLOYMENT_GUIDE.md)

## 环境变量

复制 `.env.example` 到 `.env` 并配置相应的环境变量。