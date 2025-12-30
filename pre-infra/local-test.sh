#!/bin/bash

# Local Docker Test Script
# Test the Docker image locally before deploying to AWS

set -e

echo "🧪 Testing Docker Image Locally"
echo "================================"
echo ""

# Build the image
echo "📦 Building Docker image..."
cd ../AWSomeShopEmployeeRewardsSite
docker build -t awsomeshop-frontend:test .

echo ""
echo "✅ Image built successfully!"
echo ""

# Run the container
echo "🚀 Starting container on port 8080..."
docker run -d \
    --name awsomeshop-test \
    -p 8080:80 \
    awsomeshop-frontend:test

echo ""
echo "✅ Container started!"
echo ""
echo "🌐 Application is running at: http://localhost:8080"
echo ""
echo "Test the following:"
echo "  - Homepage: http://localhost:8080"
echo "  - Health check: http://localhost:8080/health"
echo ""
echo "To view logs:"
echo "  docker logs -f awsomeshop-test"
echo ""
echo "To stop and remove:"
echo "  docker stop awsomeshop-test && docker rm awsomeshop-test"
echo ""
