#!/bin/bash

# AWSomeShop - 构建并推送 Docker 镜像到 ECR
# 使用方法: ./build-and-push.sh [dev|prod] [backend|frontend|all]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-dev}
SERVICE=${2:-all}

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
    exit 1
fi

if [[ ! "$SERVICE" =~ ^(backend|frontend|all)$ ]]; then
    log_error "Invalid service: $SERVICE. Must be 'backend', 'frontend', or 'all'"
    exit 1
fi

log_info "Building and pushing images for environment: $ENVIRONMENT, service: $SERVICE"

# 获取 AWS 账号信息
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

log_info "AWS Account: $AWS_ACCOUNT_ID"
log_info "AWS Region: $AWS_REGION"

# 登录 ECR
log_info "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 获取 ECR 仓库 URI
get_ecr_uri() {
    local service=$1
    local repo_name="awsome-shop-${service}-${ENVIRONMENT}"
    aws ecr describe-repositories --repository-names $repo_name --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text 2>/dev/null || echo ""
}

# 构建并推送后端镜像
build_and_push_backend() {
    log_info "Building backend image..."

    BACKEND_ECR_URI=$(get_ecr_uri "backend")
    if [ -z "$BACKEND_ECR_URI" ]; then
        log_error "Backend ECR repository not found. Please deploy CDK stack first."
        return 1
    fi

    cd ../../backend

    # 构建镜像
    docker build -t awsome-shop-backend:latest -f Dockerfile .

    # 标记镜像
    docker tag awsome-shop-backend:latest $BACKEND_ECR_URI:latest
    # docker tag awsome-shop-backend:latest $BACKEND_ECR_URI:$(date +%Y%m%d-%H%M%S)

    # 推送镜像
    log_info "Pushing backend image to ECR..."
    docker push $BACKEND_ECR_URI:latest
    # docker push $BACKEND_ECR_URI:$(date +%Y%m%d-%H%M%S)

    log_info "Backend image pushed successfully: $BACKEND_ECR_URI:latest"

    cd ../infra/scripts
}

# 构建并推送前端镜像
build_and_push_frontend() {
    log_info "Building frontend image..."

    FRONTEND_ECR_URI=$(get_ecr_uri "frontend")
    if [ -z "$FRONTEND_ECR_URI" ]; then
        log_error "Frontend ECR repository not found. Please deploy CDK stack first."
        return 1
    fi

    cd ../../frontend

    # 使用相对路径,由 Nginx 反向代理到后端
    # Nginx 配置会将 /api/* 请求代理到 Service Connect 的 backend:8000
    log_info "Using Nginx reverse proxy to backend via Service Connect"
    API_BASE_URL=""

    # 构建镜像（生产环境）
    docker build \
        --build-arg VITE_API_BASE_URL=$API_BASE_URL \
        --target production \
        -t awsome-shop-frontend:latest \
        -f Dockerfile .

    # 标记镜像
    docker tag awsome-shop-frontend:latest $FRONTEND_ECR_URI:latest
    # docker tag awsome-shop-frontend:latest $FRONTEND_ECR_URI:$(date +%Y%m%d-%H%M%S)

    # 推送镜像
    log_info "Pushing frontend image to ECR..."
    docker push $FRONTEND_ECR_URI:latest
    # docker push $FRONTEND_ECR_URI:$(date +%Y%m%d-%H%M%S)

    log_info "Frontend image pushed successfully: $FRONTEND_ECR_URI:latest"

    cd ../infra/scripts
}

# 执行构建
case $SERVICE in
    backend)
        build_and_push_backend
        ;;
    frontend)
        build_and_push_frontend
        ;;
    all)
        build_and_push_backend
        build_and_push_frontend
        ;;
esac

log_info "All images built and pushed successfully!"
log_info "You can now deploy or update your ECS services."
