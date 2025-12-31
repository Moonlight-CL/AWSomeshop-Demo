# Infrastructure Changelog

## [1.1.0] - 2025-12-31

### Added
- **支持使用现有 VPC 部署**
  - CDK Stack 新增 `vpcId` 可选参数
  - 用户可以选择在现有 VPC 中部署应用，而不是创建新 VPC
  - 部署脚本支持 VPC ID 作为第二个参数：`./deploy.sh dev vpc-xxxxx`
  - CDK 命令支持通过 context 传递 VPC ID：`cdk deploy --context vpcId=vpc-xxxxx`
  - 新增 npm 脚本：`deploy:dev:vpc` 和 `deploy:prod:vpc`

- **新增文档**
  - [VPC_DEPLOYMENT_GUIDE.md](aws/VPC_DEPLOYMENT_GUIDE.md) - 详细的现有 VPC 部署指南
  - 包含 VPC 要求、子网配置、验证步骤和故障排查

### Changed
- `lib/awsome-shop-stack.ts` - VPC 创建逻辑改为条件判断
  - 如果提供 `vpcId`，使用 `ec2.Vpc.fromLookup()` 导入现有 VPC
  - 如果不提供，创建新 VPC（保持向后兼容）
  - 仅为新创建的 VPC 启用 Flow Logs

- `bin/app.ts` - 从 context 读取 `vpcId` 参数并传递给 Stack

- `scripts/deploy.sh` - 部署脚本增强
  - 支持第二个参数作为 VPC ID
  - 自动构建带 VPC ID 的 CDK 命令
  - 更新使用说明

- `package.json` - 新增 npm 脚本
  - `deploy:dev:vpc` - 使用 `$VPC_ID` 环境变量部署开发环境
  - `deploy:prod:vpc` - 使用 `$VPC_ID` 环境变量部署生产环境

### Documentation
- 更新 [aws/README.md](aws/README.md) - 添加使用现有 VPC 的部署说明
- 更新 [README.md](README.md) - 添加 VPC 选项概述

### Benefits
- ✅ 更灵活的部署选项
- ✅ 可与现有网络基础设施集成
- ✅ 支持多应用共享 VPC
- ✅ 可能降低 NAT Gateway 和 VPC 成本
- ✅ 保持向后兼容，默认行为不变

## [1.0.0] - 2025-12-31

### Added
- 完整的 AWS CDK 基础设施实现
- 一键部署脚本
- 支持开发和生产环境
- 自动构建和推送 Docker 镜像
- 完整的监控和日志配置

### Components
- VPC with multi-AZ deployment
- ECS Fargate cluster
- Application Load Balancer
- RDS PostgreSQL (Multi-AZ in prod)
- ElastiCache Redis
- ECR repositories
- S3 bucket for assets
- Secrets Manager for credentials
- CloudWatch Logs and monitoring
- Auto-scaling for production workloads

### Documentation
- [CDK Implementation Summary](CDK_IMPLEMENTATION_SUMMARY.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [AWS CDK README](aws/README.md)
