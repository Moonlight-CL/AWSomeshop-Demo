#!/bin/bash

# Quick Deploy Script - Simplified version for testing
# Usage: ./quick-deploy.sh

set -e

echo "🚀 AWSomeShop Frontend - Quick Deploy"
echo "======================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Please install it first."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Please install it first."; exit 1; }

# Get AWS info
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Unable to get AWS account ID. Please configure AWS CLI first:"
    echo "   aws configure"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   AWS Region: $AWS_REGION"
echo ""

# Confirm deployment
read -p "Deploy to AWS? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run main deployment script
chmod +x deploy.sh
./deploy.sh dev
