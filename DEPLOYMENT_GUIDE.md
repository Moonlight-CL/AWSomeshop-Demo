# 🚀 AWSomeShop 部署指南

本指南介绍如何将 AWSomeShop 部署到生产环境。

## 📋 目录

- [前置要求](#前置要求)
- [本地构建](#本地构建)
- [部署到 AWS](#部署到-aws)
- [部署到 Vercel](#部署到-vercel)
- [部署到 Netlify](#部署到-netlify)
- [环境变量配置](#环境变量配置)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)

## 前置要求

### 开发环境
- Node.js 16+ 
- npm 或 yarn
- Git

### 生产环境
- 域名（可选）
- SSL 证书（推荐）
- CDN 服务（推荐）

## 本地构建

### 1. 安装依赖

```bash
cd "/Users/yuanfeng/work-dir/repos/kiro-repo/aidlc-251230-demo/AWSomeshop-Demo/AWSomeShop Employee Rewards Site"
npm install
```

### 2. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 3. 本地预览

```bash
npm run preview
```

访问 `http://localhost:4173` 预览生产构建。

### 4. 构建优化

**检查构建大小**:
```bash
npm run build -- --mode production
```

**分析包大小**:
```bash
npm install -D rollup-plugin-visualizer
```

在 `vite.config.ts` 中添加：
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({ open: true })
  ]
});
```

## 部署到 AWS

### 方案 1: AWS S3 + CloudFront

#### 1. 创建 S3 存储桶

```bash
aws s3 mb s3://awsomeshop-frontend
```

#### 2. 配置静态网站托管

```bash
aws s3 website s3://awsomeshop-frontend \
  --index-document index.html \
  --error-document index.html
```

#### 3. 上传构建文件

```bash
npm run build
aws s3 sync dist/ s3://awsomeshop-frontend --delete
```

#### 4. 配置 CloudFront

创建 CloudFront 分发：
```bash
aws cloudfront create-distribution \
  --origin-domain-name awsomeshop-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

#### 5. 配置自定义域名（可选）

在 Route 53 中添加 CNAME 记录指向 CloudFront 域名。

### 方案 2: AWS Amplify

#### 1. 安装 Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

#### 2. 初始化 Amplify

```bash
amplify init
```

#### 3. 添加托管

```bash
amplify add hosting
```

选择 "Hosting with Amplify Console"

#### 4. 发布

```bash
amplify publish
```

### 方案 3: AWS ECS (容器化部署)

#### 1. 创建 Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. 构建和推送镜像

```bash
# 构建镜像
docker build -t awsomeshop-frontend .

# 标记镜像
docker tag awsomeshop-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/awsomeshop-frontend:latest

# 推送到 ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/awsomeshop-frontend:latest
```

#### 4. 创建 ECS 任务定义

```json
{
  "family": "awsomeshop-frontend",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/awsomeshop-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "memory": 512,
      "cpu": 256
    }
  ]
}
```

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署

```bash
vercel
```

### 4. 配置 vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 5. 生产部署

```bash
vercel --prod
```

## 部署到 Netlify

### 1. 安装 Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. 登录 Netlify

```bash
netlify login
```

### 3. 初始化

```bash
netlify init
```

### 4. 配置 netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 5. 部署

```bash
netlify deploy --prod
```

## 环境变量配置

### 创建 .env 文件

```bash
# .env.production
VITE_API_BASE_URL=https://api.awsomeshop.com/v1
VITE_APP_NAME=AWSomeShop
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

### 在代码中使用

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APP_NAME = import.meta.env.VITE_APP_NAME;
```

### 平台特定配置

**Vercel**:
在项目设置中添加环境变量

**Netlify**:
在 Site settings > Build & deploy > Environment 中添加

**AWS Amplify**:
在 App settings > Environment variables 中添加

## 性能优化

### 1. 代码分割

```typescript
// 使用动态导入
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'));
```

### 2. 图片优化

```bash
# 安装图片优化插件
npm install -D vite-plugin-imagemin
```

```typescript
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ removeViewBox: false }] }
    })
  ]
});
```

### 3. 启用 Gzip/Brotli 压缩

```bash
npm install -D vite-plugin-compression
```

```typescript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

### 4. 预加载关键资源

```html
<!-- index.html -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://api.awsomeshop.com">
```

### 5. 使用 CDN

将静态资源上传到 CDN：
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  base: 'https://cdn.awsomeshop.com/'
});
```

## 监控和日志

### 1. 集成 Google Analytics

```typescript
// src/lib/analytics.ts
export const initAnalytics = () => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    // 初始化 GA
    window.gtag('config', 'GA_MEASUREMENT_ID');
  }
};
```

### 2. 错误监控 (Sentry)

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### 3. 性能监控

```typescript
// 监控 Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 4. 日志收集

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    // 发送到日志服务
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 发送到日志服务
  }
};
```

## CI/CD 配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist'
      
      - name: Invalidate CloudFront
        uses: chetan/invalidate-cloudfront-action@v2
        env:
          DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
          PATHS: '/*'
          AWS_REGION: 'us-east-1'
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 健康检查

### 创建健康检查端点

```typescript
// src/health.ts
export const healthCheck = {
  status: 'ok',
  version: import.meta.env.VITE_APP_VERSION,
  timestamp: new Date().toISOString()
};
```

### 配置监控

使用 AWS CloudWatch 或 Datadog 监控：
- 应用可用性
- 响应时间
- 错误率
- 资源使用情况

## 安全配置

### 1. 配置 CSP (Content Security Policy)

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:;">
```

### 2. 配置 HTTPS

确保所有生产环境都使用 HTTPS。

### 3. 配置 CORS

在后端 API 中配置正确的 CORS 策略。

## 回滚策略

### AWS S3 + CloudFront

```bash
# 保存当前版本
aws s3 sync s3://awsomeshop-frontend s3://awsomeshop-frontend-backup-$(date +%Y%m%d)

# 回滚到上一个版本
aws s3 sync s3://awsomeshop-frontend-backup-20251229 s3://awsomeshop-frontend --delete

# 清除 CloudFront 缓存
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

### Vercel

```bash
# 查看部署历史
vercel ls

# 回滚到指定版本
vercel rollback [deployment-url]
```

## 故障排查

### 常见问题

**1. 白屏问题**
- 检查控制台错误
- 确认 API 地址配置正确
- 检查路由配置

**2. 资源加载失败**
- 检查 CDN 配置
- 确认文件路径正确
- 检查 CORS 设置

**3. 性能问题**
- 使用 Lighthouse 分析
- 检查包大小
- 优化图片和资源

## 检查清单

部署前检查：

- [ ] 所有测试通过
- [ ] 环境变量配置正确
- [ ] API 地址更新为生产环境
- [ ] 移除所有 console.log
- [ ] 启用生产模式构建
- [ ] 配置错误监控
- [ ] 配置性能监控
- [ ] 设置 HTTPS
- [ ] 配置 CDN
- [ ] 设置备份策略
- [ ] 准备回滚方案
- [ ] 通知团队成员

---

**祝部署顺利！** 🚀

如有问题，请参考各平台的官方文档或联系技术支持。
