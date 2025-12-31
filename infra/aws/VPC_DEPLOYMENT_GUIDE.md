# 使用现有 VPC 部署指南

本文档说明如何将 AWSomeShop 部署到您现有的 VPC 中。

## 概述

CDK 默认会创建一个新的 VPC，但您也可以选择使用现有的 VPC。使用现有 VPC 时，CDK 会自动查找和使用 VPC 中合适的子网。

## VPC 要求

要在现有 VPC 中部署 AWSomeShop，您的 VPC 必须满足以下条件：

### 1. 子网要求

VPC 中必须包含以下类型的子网：

- **公有子网（Public Subnet）** - ✅ 必需：
  - 用于 Application Load Balancer (ALB)
  - 必须有 Internet Gateway 路由
  - 至少需要 2 个（跨不同可用区）

- **私有子网（Private Subnet with NAT）** - ✅ 必需：
  - 用于 ECS Fargate 任务
  - 必须通过 NAT Gateway 访问互联网
  - 至少需要 2 个（跨不同可用区）

- **隔离子网（Isolated Subnet）** - ⚠️ 推荐（可选）：
  - 推荐用于 RDS PostgreSQL 和 ElastiCache Redis
  - 不需要互联网访问
  - 至少需要 2 个（跨不同可用区）
  - **如果没有隔离子网**：RDS 和 Redis 会自动部署到私有子网中

### 2. 子网标签要求

CDK 使用子网标签来识别子网类型。确保您的子网有正确的标签：

**公有子网：**
```
aws:cdk:subnet-name = Public
aws-cdk:subnet-type = Public
```

**私有子网（带 NAT）：**
```
aws:cdk:subnet-name = Private
aws-cdk:subnet-type = Private
```

**隔离子网：**
```
aws:cdk:subnet-name = Isolated
aws-cdk:subnet-type = Isolated
```

如果您的子网没有这些标签，CDK 会根据路由表自动识别：
- 有 IGW 路由的 = 公有子网
- 有 NAT Gateway 路由的 = 私有子网
- 没有外部路由的 = 隔离子网

## 部署方法

### 方法 1: 使用一键部署脚本（推荐）

```bash
cd infra/scripts

# 替换 vpc-xxxxxxxxx 为您的 VPC ID
./deploy.sh dev vpc-xxxxxxxxx

# 或生产环境
./deploy.sh prod vpc-xxxxxxxxx
```

### 方法 2: 使用 CDK 命令

```bash
cd infra/aws

# 安装依赖
npm install

# 部署到开发环境
cdk deploy --context environment=dev --context vpcId=vpc-xxxxxxxxx

# 部署到生产环境
cdk deploy --context environment=prod --context vpcId=vpc-xxxxxxxxx
```

### 方法 3: 使用 npm 脚本

```bash
cd infra/aws

# 设置 VPC_ID 环境变量
export VPC_ID=vpc-xxxxxxxxx

# 部署到开发环境
npm run deploy:dev:vpc

# 部署到生产环境
npm run deploy:prod:vpc
```

## 查找您的 VPC ID

### 使用 AWS CLI

列出所有 VPC：
```bash
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0],CidrBlock]' --output table
```

查看特定 VPC 的详细信息：
```bash
aws ec2 describe-vpcs --vpc-ids vpc-xxxxxxxxx
```

### 使用 AWS 控制台

1. 登录 AWS 控制台
2. 进入 VPC 服务
3. 在左侧菜单选择 "Your VPCs"
4. 找到您要使用的 VPC，复制 VPC ID

## 验证 VPC 配置

在部署前，建议验证您的 VPC 配置是否满足要求：

### 检查子网

```bash
# 查看 VPC 中的所有子网
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-xxxxxxxxx" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

### 检查路由表

```bash
# 查看路由表
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-xxxxxxxxx" \
  --query 'RouteTables[*].[RouteTableId,Associations[0].SubnetId,Routes[?GatewayId!=`local`]]' \
  --output table
```

### 检查 NAT Gateway

```bash
# 查看 NAT Gateway
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=vpc-xxxxxxxxx" \
  --query 'NatGateways[*].[NatGatewayId,SubnetId,State]' \
  --output table
```

### 检查 Internet Gateway

```bash
# 查看 Internet Gateway
aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=vpc-xxxxxxxxx" \
  --query 'InternetGateways[*].[InternetGatewayId,Attachments[0].State]' \
  --output table
```

## 示例：准备一个符合要求的 VPC

如果您的 VPC 还没有合适的子网结构，可以按以下方式准备：

### 1. 创建子网

```bash
VPC_ID=vpc-xxxxxxxxx
REGION=us-east-1

# 创建公有子网
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 \
  --availability-zone ${REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Public-1a},{Key=aws-cdk:subnet-type,Value=Public}]'

aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 \
  --availability-zone ${REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Public-1b},{Key=aws-cdk:subnet-type,Value=Public}]'

# 创建私有子网
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 \
  --availability-zone ${REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Private-1a},{Key=aws-cdk:subnet-type,Value=Private}]'

aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 \
  --availability-zone ${REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Private-1b},{Key=aws-cdk:subnet-type,Value=Private}]'

# 创建隔离子网
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.21.0/28 \
  --availability-zone ${REGION}a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Isolated-1a},{Key=aws-cdk:subnet-type,Value=Isolated}]'

aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.21.16/28 \
  --availability-zone ${REGION}b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=Isolated-1b},{Key=aws-cdk:subnet-type,Value=Isolated}]'
```

### 2. 配置 Internet Gateway

```bash
# 创建 Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)

# 附加到 VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# 为公有子网创建路由表
PUBLIC_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)

# 添加 Internet Gateway 路由
aws ec2 create-route --route-table-id $PUBLIC_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# 关联公有子网到路由表
aws ec2 associate-route-table --route-table-id $PUBLIC_RT --subnet-id <public-subnet-1-id>
aws ec2 associate-route-table --route-table-id $PUBLIC_RT --subnet-id <public-subnet-2-id>
```

### 3. 配置 NAT Gateway

```bash
# 为 NAT Gateway 分配弹性 IP
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)

# 在公有子网创建 NAT Gateway
NAT_GW=$(aws ec2 create-nat-gateway --subnet-id <public-subnet-1-id> --allocation-id $EIP_ALLOC --query 'NatGateway.NatGatewayId' --output text)

# 等待 NAT Gateway 可用
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW

# 为私有子网创建路由表
PRIVATE_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)

# 添加 NAT Gateway 路由
aws ec2 create-route --route-table-id $PRIVATE_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW

# 关联私有子网到路由表
aws ec2 associate-route-table --route-table-id $PRIVATE_RT --subnet-id <private-subnet-1-id>
aws ec2 associate-route-table --route-table-id $PRIVATE_RT --subnet-id <private-subnet-2-id>
```

## 部署后验证

部署完成后，验证资源是否正确部署到指定的 VPC：

```bash
ENVIRONMENT=dev  # 或 prod

# 检查 ECS 集群
aws ecs describe-clusters --clusters awsome-shop-cluster-${ENVIRONMENT}

# 检查 ECS 服务
aws ecs describe-services \
  --cluster awsome-shop-cluster-${ENVIRONMENT} \
  --services awsome-shop-backend-${ENVIRONMENT} awsome-shop-frontend-${ENVIRONMENT}

# 检查 RDS 实例
aws rds describe-db-instances --db-instance-identifier awsome-shop-db-${ENVIRONMENT}

# 检查负载均衡器
aws elbv2 describe-load-balancers \
  --names awsome-shop-alb-${ENVIRONMENT}

# 验证所有资源都在正确的 VPC 中
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=vpc-xxxxxxxxx" \
  --query 'SecurityGroups[?starts_with(GroupName, `awsome-shop`)].[GroupName,GroupId]' \
  --output table
```

## 常见问题

### Q: 我的 VPC 没有隔离子网，可以使用私有子网代替吗？

A: **可以！** CDK 会自动检测 VPC 中是否有隔离子网。如果没有，它会自动将 RDS 和 Redis 部署到私有子网中。虽然隔离子网（没有互联网访问）对于数据库来说更安全，但使用私有子网并配置适当的安全组规则也是可以接受的。

部署时会看到如下警告：
```
[Warning] No isolated subnets found in VPC. RDS and Redis will be deployed in private subnets.
```

这是正常的，部署会继续进行。

### Q: 我的 VPC 只有单个可用区，可以部署吗？

A: 开发环境可以，但生产环境强烈建议使用多可用区部署以实现高可用性。

### Q: 部署时报错 "No subnets found"

A: 这通常意味着 CDK 无法在您的 VPC 中找到合适的子网。请检查：
1. 子网标签是否正确
2. 路由表配置是否正确
3. 是否至少有 2 个可用区的子网

### Q: 如何切换回创建新 VPC？

A: 只需在部署时不提供 `vpcId` 参数即可：
```bash
./deploy.sh dev
```

### Q: 使用现有 VPC 会影响部署成本吗？

A: 不会创建新的 VPC 资源（如 NAT Gateway），可能会降低成本。但应用本身的成本（ECS、RDS、Redis 等）不变。

## 清理资源

删除在现有 VPC 中部署的资源：

```bash
cd infra/aws

# 删除 CDK Stack
cdk destroy --context environment=dev --context vpcId=vpc-xxxxxxxxx

# 确认删除
# 输入 'y'
```

**注意**：这只会删除 CDK 创建的资源，不会删除您的 VPC 本身。

## 总结

使用现有 VPC 部署 AWSomeShop 的优势：
- ✅ 利用现有网络基础设施
- ✅ 与其他应用共享 VPC 资源
- ✅ 节省 VPC 和 NAT Gateway 成本
- ✅ 统一网络管理

确保您的 VPC 满足所有子网和网络要求后，即可开始部署！
