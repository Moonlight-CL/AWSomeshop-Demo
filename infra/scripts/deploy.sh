#!/bin/bash

# AWSomeShop - 一键部署脚本
# 使用方法:
#   ./deploy.sh [dev|prod]                    # 创建新 VPC
#   ./deploy.sh [dev|prod] [vpc-id]           # 使用现有 VPC

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# 检查环境参数
ENVIRONMENT=${1:-dev}
VPC_ID=${2:-}

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
    echo "Usage: ./deploy.sh [dev|prod] [vpc-id]"
    exit 1
fi

if [ -n "$VPC_ID" ]; then
    log_step "AWSomeShop 一键部署 - 环境: $ENVIRONMENT - VPC: $VPC_ID"
else
    log_step "AWSomeShop 一键部署 - 环境: $ENVIRONMENT - 创建新 VPC"
fi

# 检查必要的工具
log_info "检查必要的工具..."
command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed. Aborting."; exit 1; }

log_info "所有必要工具已安装 ✓"

# 获取 AWS 信息
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-$(aws configure get region)}
AWS_REGION=${AWS_REGION:-us-east-1}

log_info "AWS Account: $AWS_ACCOUNT_ID"
log_info "AWS Region: $AWS_REGION"

# 确认部署
if [ "$ENVIRONMENT" == "prod" ]; then
    log_warn "你即将部署到生产环境!"
    read -p "确认继续？(yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
fi

# Step 1: Bootstrap CDK (如果还没有或需要升级)
log_step "Step 1: Bootstrap CDK (如果需要)"
cd ../aws

# 检查当前 bootstrap 版本
CURRENT_BOOTSTRAP_VERSION=$(aws cloudformation describe-stacks \
    --stack-name CDKToolkit \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BootstrapVersion`].OutputValue' \
    --output text 2>/dev/null || echo "0")

REQUIRED_BOOTSTRAP_VERSION=30

log_info "当前 Bootstrap 版本: $CURRENT_BOOTSTRAP_VERSION"
log_info "所需 Bootstrap 版本: $REQUIRED_BOOTSTRAP_VERSION"

if [ "$CURRENT_BOOTSTRAP_VERSION" -lt "$REQUIRED_BOOTSTRAP_VERSION" ]; then
    log_warn "Bootstrap 版本过旧或不存在，开始升级/安装..."
    npm install
    npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
    log_info "CDK bootstrap 完成 ✓"
else
    log_info "CDK Bootstrap 版本满足要求 ✓"
fi

# Step 2: 部署 CDK Stack
log_step "Step 2: 部署基础设施 (CDK Stack)"
log_info "安装依赖..."
npm install

# 构建 CDK 命令参数
CDK_CONTEXT="--context environment=$ENVIRONMENT"
if [ -n "$VPC_ID" ]; then
    log_info "使用现有 VPC: $VPC_ID"
    CDK_CONTEXT="$CDK_CONTEXT --context vpcId=$VPC_ID"
fi

log_info "合成 CloudFormation 模板..."
npx cdk synth $CDK_CONTEXT

log_info "部署 CloudFormation Stack..."
npx cdk deploy $CDK_CONTEXT --require-approval never

log_info "基础设施部署完成 ✓"

# 获取输出值
log_info "获取部署输出..."
BACKEND_ECR=$(aws cloudformation describe-stacks \
    --stack-name awsome-shop-${ENVIRONMENT} \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BackendECRRepository`].OutputValue' \
    --output text)

FRONTEND_ECR=$(aws cloudformation describe-stacks \
    --stack-name awsome-shop-${ENVIRONMENT} \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendECRRepository`].OutputValue' \
    --output text)

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name awsome-shop-${ENVIRONMENT} \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text)

# log_info "Backend ECR: $BACKEND_ECR"
# log_info "Frontend ECR: $FRONTEND_ECR"
# log_info "ALB DNS: $ALB_DNS"

# # Step 3: 构建并推送 Docker 镜像
# log_step "Step 3: 构建并推送 Docker 镜像到 ECR"
# cd ../scripts
# chmod +x build-and-push.sh
# ./build-and-push.sh $ENVIRONMENT all

# # Step 4: 更新 ECS 服务
# log_step "Step 4: 更新 ECS 服务"
# log_info "强制更新 ECS 服务以使用新镜像..."

# # 更新后端服务
# aws ecs update-service \
#     --cluster awsome-shop-cluster-${ENVIRONMENT} \
#     --service awsome-shop-backend-${ENVIRONMENT} \
#     --force-new-deployment \
#     --region $AWS_REGION \
#     >/dev/null

# log_info "后端服务更新已触发 ✓"

# # 更新前端服务
# aws ecs update-service \
#     --cluster awsome-shop-cluster-${ENVIRONMENT} \
#     --service awsome-shop-frontend-${ENVIRONMENT} \
#     --force-new-deployment \
#     --region $AWS_REGION \
#     >/dev/null

# log_info "前端服务更新已触发 ✓"

# Step 5: 等待服务稳定
# log_step "Step 5: 等待服务稳定"
# log_info "等待后端服务稳定..."
# aws ecs wait services-stable \
#     --cluster awsome-shop-cluster-${ENVIRONMENT} \
#     --services awsome-shop-backend-${ENVIRONMENT} \
#     --region $AWS_REGION

# log_info "后端服务已稳定 ✓"

# log_info "等待前端服务稳定..."
# aws ecs wait services-stable \
#     --cluster awsome-shop-cluster-${ENVIRONMENT} \
#     --services awsome-shop-frontend-${ENVIRONMENT} \
#     --region $AWS_REGION

# log_info "前端服务已稳定 ✓"

# Step 6: 运行数据库迁移 (可选)
# log_step "Step 6: 数据库迁移 (可选)"
# log_warn "如需运行数据库迁移，请手动执行："
# log_info "aws ecs run-task --cluster awsome-shop-cluster-${ENVIRONMENT} \\"
# log_info "  --task-definition awsome-shop-backend-${ENVIRONMENT} \\"
# log_info "  --launch-type FARGATE \\"
# log_info "  --network-configuration \"...\" \\"
# log_info "  --overrides '{\"containerOverrides\":[{\"name\":\"backend\",\"command\":[\"alembic\",\"upgrade\",\"head\"]}]}'"

# 完成
log_step "部署完成！"
log_info "应用 URL: http://$ALB_DNS"
log_info "API 文档: http://$ALB_DNS/docs"
log_info ""
log_info "后续步骤:"
log_info "1. 访问应用并验证功能"
log_info "2. 配置域名和 HTTPS (如需要)"
log_info "3. 设置监控和告警"
log_info "4. 配置数据库备份策略"
log_info ""
log_info "查看 ECS 服务状态:"
log_info "aws ecs describe-services --cluster awsome-shop-cluster-${ENVIRONMENT} \\"
log_info "  --services awsome-shop-backend-${ENVIRONMENT} awsome-shop-frontend-${ENVIRONMENT}"
log_info ""
log_info "查看日志:"
log_info "aws logs tail /ecs/awsome-shop-backend-${ENVIRONMENT} --follow"
log_info "aws logs tail /ecs/awsome-shop-frontend-${ENVIRONMENT} --follow"
