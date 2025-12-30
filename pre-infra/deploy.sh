#!/bin/bash

# AWSomeShop Frontend - ECS Deployment Script
# This script automates the deployment of the frontend to AWS ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY_NAME="awsomeshop-frontend"
STACK_NAME="${ENVIRONMENT}-awsomeshop-frontend"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWSomeShop Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Account ID: ${YELLOW}${AWS_ACCOUNT_ID}${NC}"
echo ""

# Step 1: Create ECR Repository if it doesn't exist
echo -e "${GREEN}[1/6] Checking ECR Repository...${NC}"
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} > /dev/null 2>&1; then
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name ${ECR_REPOSITORY_NAME} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}✓ ECR repository created${NC}"
else
    echo -e "${GREEN}✓ ECR repository already exists${NC}"
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"
IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
FULL_IMAGE_URI="${ECR_URI}:${IMAGE_TAG}"

# Step 2: Build Docker Image (Multi-platform for ECS compatibility)
echo -e "\n${GREEN}[2/6] Building Docker Image...${NC}"
cd ../AWSomeShopEmployeeRewardsSite

# Check if buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: docker buildx not available, using standard build${NC}"
    docker build -t ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} .
else
    echo "Building multi-platform image for linux/amd64..."
    # Create buildx builder if it doesn't exist
    docker buildx create --name awsomeshop-builder --use 2>/dev/null || docker buildx use awsomeshop-builder
    
    # Build for linux/amd64 (ECS Fargate architecture)
    docker buildx build \
        --platform linux/amd64 \
        --tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} \
        --load \
        .
fi

docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${FULL_IMAGE_URI}
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:latest
echo -e "${GREEN}✓ Docker image built for linux/amd64${NC}"

# Step 3: Login to ECR
echo -e "\n${GREEN}[3/6] Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Step 4: Push Docker Image
echo -e "\n${GREEN}[4/6] Pushing Docker Image to ECR...${NC}"
docker push ${FULL_IMAGE_URI}
docker push ${ECR_URI}:latest
echo -e "${GREEN}✓ Docker image pushed${NC}"

# Step 5: Deploy CloudFormation Stack
echo -e "\n${GREEN}[5/6] Deploying CloudFormation Stack...${NC}"
cd ../pre-infra

# Check if stack exists
if aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} > /dev/null 2>&1; then
    echo "Updating existing stack..."
    OPERATION="update-stack"
else
    echo "Creating new stack..."
    OPERATION="create-stack"
fi

aws cloudformation ${OPERATION} \
    --stack-name ${STACK_NAME} \
    --template-body file://ecs-deployment.yaml \
    --parameters \
        ParameterKey=EnvironmentName,ParameterValue=${ENVIRONMENT} \
        ParameterKey=ContainerImage,ParameterValue=${FULL_IMAGE_URI} \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${AWS_REGION}

echo "Waiting for stack operation to complete..."
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME} --region ${AWS_REGION}
else
    aws cloudformation wait stack-update-complete --stack-name ${STACK_NAME} --region ${AWS_REGION} || true
fi

echo -e "${GREEN}✓ CloudFormation stack deployed${NC}"

# Step 6: Get Outputs
echo -e "\n${GREEN}[6/6] Retrieving Deployment Information...${NC}"
ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text)

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Application URL: ${YELLOW}${ALB_URL}${NC}"
echo -e "ECR Image: ${YELLOW}${FULL_IMAGE_URI}${NC}"
echo -e "\n${YELLOW}Note: It may take a few minutes for the service to become healthy.${NC}"
echo -e "\nTo check service status:"
echo -e "  ${YELLOW}aws ecs describe-services --cluster ${ENVIRONMENT}-awsomeshop-cluster --services ${ENVIRONMENT}-awsomeshop-frontend-service --region ${AWS_REGION}${NC}"
echo -e "\nTo view logs:"
echo -e "  ${YELLOW}aws logs tail /ecs/${ENVIRONMENT}-awsomeshop-frontend --follow --region ${AWS_REGION}${NC}"
echo ""
