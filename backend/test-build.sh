#!/bin/bash
set -e
echo "Testing Docker build fix..."
docker build -t awsome-shop-backend:test -f Dockerfile . 2>&1 | tee /tmp/docker-build.log
if grep -q "OSError.*README" /tmp/docker-build.log; then
    echo "❌ Build failed - README.md error still exists"
    exit 1
else
    echo "✅ Build successful - README.md error fixed!"
    exit 0
fi
