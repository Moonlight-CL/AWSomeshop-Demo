#!/bin/bash

# AWSomeShop - Fix Architecture Issue and Redeploy
# This script rebuilds the Docker image with correct architecture and redeploys

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWSomeShop - Fix & Redeploy${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY_NAME="awsomeshop-frontend"
STACK_NAME="${ENVIRONMENT}-awsomeshop-frontend"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"
IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
FULL_IMAGE_URI="${ECR_URI}:${IMAGE_TAG}"

echo -e "${YELLOW}This script will:${NC}"
echo -e "1. Rebuild Docker image with correct architecture (linux/amd64)"
echo -e "2. Push to ECR"
echo -e "3. Update ECS service with new image"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Setup buildx
echo -e "\n${GREEN}[1/5] Setting up Docker Buildx...${NC}"
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}Error: docker buildx is not available${NC}"
    echo -e "${YELLOW}Please upgrade Docker to a version that supports buildx${NC}"
    exit 1
fi

# Create or use existing builder
docker buildx create --name awsomeshop-builder --use 2>/dev/null || docker buildx use awsomeshop-builder
echo -e "${GREEN}✓ Buildx ready${NC}"

# Step 2: Build for correct architecture
echo -e "\n${GREEN}[2/5] Building Docker Image for linux/amd64...${NC}"
cd ../AWSomeShopEmployeeRewardsSite

docker buildx build \
    --platform linux/amd64 \
    --tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} \
    --tag ${FULL_IMAGE_URI} \
    --tag ${ECR_URI}:latest \
    --load \
    .

echo -e "${GREEN}✓ Docker image built for linux/amd64${NC}"

# Step 3: Login to ECR
echo -e "\n${GREEN}[3/5] Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Step 4: Push to ECR
echo -e "\n${GREEN}[4/5] Pushing Docker Image to ECR...${NC}"
docker push ${FULL_IMAGE_URI}
docker push ${ECR_URI}:latest
echo -e "${GREEN}✓ Docker image pushed${NC}"

# Step 5: Update ECS Service
echo -e "\n${GREEN}[5/5] Updating ECS Service...${NC}"

# Get current task definition
TASK_FAMILY="${ENVIRONMENT}-awsomeshop-frontend"
CURRENT_TASK_DEF=$(aws ecs describe-task-definition --task-definition ${TASK_FAMILY} --region ${AWS_REGION})

# Extract task definition without metadata
NEW_TASK_DEF=$(echo $CURRENT_TASK_DEF | jq '.taskDefinition | 
    del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
    .containerDefinitions[0].image = "'${FULL_IMAGE_URI}'"')

# Register new task definition
NEW_TASK_INFO=$(aws ecs register-task-definition \
    --region ${AWS_REGION} \
    --cli-input-json "$NEW_TASK_DEF")

NEW_REVISION=$(echo $NEW_TASK_INFO | jq -r '.taskDefinition.revision')

echo "New task definition revision: ${NEW_REVISION}"

# Update service
aws ecs update-service \
    --cluster ${ENVIRONMENT}-awsomeshop-cluster \
    --service ${ENVIRONMENT}-awsomeshop-frontend-service \
    --task-definition ${TASK_FAMILY}:${NEW_REVISION} \
    --force-new-deployment \
    --region ${AWS_REGION} \
    > /dev/null

echo -e "${GREEN}✓ ECS service updated${NC}"

# Wait for service to stabilize
echo -e "\n${YELLOW}Waiting for service to stabilize (this may take 2-3 minutes)...${NC}"
aws ecs wait services-stable \
    --cluster ${ENVIRONMENT}-awsomeshop-cluster \
    --services ${ENVIRONMENT}-awsomeshop-frontend-service \
    --region ${AWS_REGION}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Fix Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

# Get ALB URL
ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
    --output text)

echo -e "Application URL: ${YELLOW}${ALB_URL}${NC}"
echo -e "New Image: ${YELLOW}${FULL_IMAGE_URI}${NC}"
echo -e "\n${GREEN}The application should now be running correctly!${NC}"
echo ""
