# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWSomeShop is an employee rewards system where employees can use points to redeem various products (gift cards, subscriptions, vouchers). The system has two user roles:
- **Employees**: Can view products, redeem items with points, and track their point history
- **Admins**: Can manage users, adjust points, manage products, and view system statistics

The frontend is a React SPA that currently uses mock data. The backend API design is documented in [API_DESIGN.md](API_DESIGN.md) but not yet implemented.

## Development Commands

### Frontend Development

Navigate to `AWSomeShopEmployeeRewardsSite/` for all frontend commands:

```bash
cd AWSomeShopEmployeeRewardsSite

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Local Docker Testing

```bash
cd pre-infra

# Test Docker build locally (runs on http://localhost:8080)
./local-test.sh
```

### AWS Deployment

```bash
cd pre-infra

# Quick deployment (recommended for first-time deployment)
./quick-deploy.sh

# Full deployment with environment selection
./deploy.sh dev    # Development environment
./deploy.sh prod   # Production environment
```

## Architecture

### Frontend Structure

```
AWSomeShopEmployeeRewardsSite/src/app/
├── components/
│   ├── LoginPage.tsx          # Login interface
│   ├── EmployeeDashboard.tsx  # Employee view with product catalog and redemption
│   ├── AdminDashboard.tsx     # Admin view with management features
│   ├── ui/                    # Reusable Radix UI + shadcn components
│   └── figma/                 # Figma-generated components
├── context/
│   └── AuthContext.tsx        # Authentication state management
├── types/
│   └── index.ts               # TypeScript interfaces (User, Product, Order, etc.)
├── lib/
│   └── mockData.ts            # Mock data for users, products, orders, transactions
└── App.tsx                    # Root component with role-based routing
```

### Key Architectural Patterns

1. **Role-Based Routing**: App.tsx renders different dashboards based on `user.role`:
   - Not authenticated → LoginPage
   - Admin role → AdminDashboard
   - Employee role → EmployeeDashboard

2. **Context-Based Authentication**: AuthContext provides `isAuthenticated`, `user`, `login()`, and `logout()` throughout the app. All authentication state flows through this context.

3. **Mock Data Layer**: Currently all data comes from `lib/mockData.ts`. When implementing the backend:
   - Create API service layer in `lib/api.ts` or `services/` directory
   - Replace mock data calls with API calls
   - Follow the API specification in [API_DESIGN.md](API_DESIGN.md)
   - Keep the same TypeScript interfaces defined in `types/index.ts`

4. **Component Library**: Uses Radix UI primitives with Tailwind CSS styling. UI components in `components/ui/` follow the shadcn/ui pattern.

### Deployment Architecture

```
CloudFront (future) → Application Load Balancer → ECS Fargate Tasks (2+)
                                                   └─ Docker (Nginx + React SPA)
```

Infrastructure defined in `pre-infra/ecs-deployment.yaml` using CloudFormation:
- VPC with 2 public subnets across availability zones
- Application Load Balancer for traffic distribution
- ECS Fargate service with 2+ tasks for high availability
- ECR for Docker image storage
- CloudWatch Logs for monitoring

## Data Flow & State Management

### Current State (Mock Data)

1. User logs in → AuthContext updates with mock user from `mockUsers`
2. Dashboard loads → Components directly import and filter `mockProducts`, `mockOrders`, `mockTransactions`
3. Redemption → Updates mock data in-memory (resets on page refresh)

### Future State (Backend Integration)

When integrating the backend API:

1. **Authentication Flow**:
   - `POST /auth/login` → Store JWT token in localStorage or HTTP-only cookie
   - Include token in all subsequent requests via `Authorization: Bearer {token}`
   - Implement token refresh logic with `POST /auth/refresh`

2. **Data Fetching**:
   - Replace direct mockData imports with API calls
   - Use React hooks (useState/useEffect) or a data fetching library (React Query, SWR)
   - Example pattern:
     ```typescript
     // In EmployeeDashboard.tsx
     const [products, setProducts] = useState<Product[]>([]);
     useEffect(() => {
       fetch('/api/products', { headers: { Authorization: `Bearer ${token}` }})
         .then(res => res.json())
         .then(data => setProducts(data.data.products));
     }, []);
     ```

3. **API Endpoints Mapping** (see [API_DESIGN.md](API_DESIGN.md) for full details):
   - Login: `POST /auth/login`
   - Products: `GET /products`
   - Redeem: `POST /orders`
   - User orders: `GET /orders/me`
   - Point transactions: `GET /transactions/me`
   - Admin user management: `GET /users`, `POST /users/{userId}/points/adjust`
   - Admin product management: `POST /products`, `PUT /products/{productId}`

## Testing

### Test Credentials

Use these credentials in the login form:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password123 |
| Employee | zhangsan | password123 |
| Employee | lisi | password123 |

### Manual Testing Flow

1. **Employee Flow**:
   - Login as `zhangsan`
   - View product catalog with point costs
   - Check point balance (should be 1500)
   - Redeem a product within point budget
   - View redemption history
   - View point transaction history

2. **Admin Flow**:
   - Login as `admin`
   - View statistics dashboard
   - Browse and search user list
   - Adjust user points
   - Manage product catalog (add/edit products)
   - View all orders and transactions

## Code Style & Patterns

### TypeScript

- All components use TypeScript with explicit types
- Type definitions centralized in `src/app/types/index.ts`
- Use interfaces for data models (User, Product, Order, etc.)
- Avoid `any` types; use proper typing for props and state

### React Patterns

- Functional components with hooks (no class components)
- Use `useAuth()` hook to access authentication context
- Props should be explicitly typed with interfaces
- Component file naming: PascalCase.tsx (e.g., `LoginPage.tsx`)

### Styling

- Tailwind CSS utility classes for styling
- Custom configuration in `@tailwindcss/vite` plugin
- UI components use `clsx` and `tailwind-merge` for conditional classes
- Path alias `@/` points to `src/` directory (configured in vite.config.ts)

## Important Files

- [API_DESIGN.md](API_DESIGN.md): Complete backend API specification with request/response formats, database schema, and security considerations
- [START_HERE.md](START_HERE.md): Deployment quick start guide (Chinese)
- [pre-infra/README.md](pre-infra/README.md): Detailed AWS infrastructure and deployment documentation
- [AWSomeShopEmployeeRewardsSite/src/app/types/index.ts](AWSomeShopEmployeeRewardsSite/src/app/types/index.ts): TypeScript type definitions
- [AWSomeShopEmployeeRewardsSite/src/app/lib/mockData.ts](AWSomeShopEmployeeRewardsSite/src/app/lib/mockData.ts): Mock data for development

## Common Tasks

### Adding a New Product Category

1. Add products to `mockData.ts` with new category value
2. Update category filter logic in EmployeeDashboard.tsx if needed
3. No type changes needed (category is `string`)

### Adding a New User Role

1. Update `User` interface in `types/index.ts`: `role: 'employee' | 'admin' | 'newrole'`
2. Add user with new role to `mockUsers` in `mockData.ts`
3. Update routing logic in `App.tsx` to handle new role
4. Create new dashboard component if needed

### Integrating Backend API

1. Review API specification in [API_DESIGN.md](API_DESIGN.md)
2. Create `src/app/services/api.ts` with API client using fetch or axios
3. Implement error handling and loading states
4. Replace mock data imports with API calls in components
5. Update AuthContext to use real authentication endpoints
6. Add environment variable for API base URL (create `.env` file)
7. Update vite.config.ts if proxy to backend is needed during development

### Modifying AWS Infrastructure

1. Edit `pre-infra/ecs-deployment.yaml` CloudFormation template
2. Update stack with: `aws cloudformation update-stack --stack-name dev-awsomeshop-frontend --template-body file://ecs-deployment.yaml ...`
3. Common changes:
   - Task count: Modify `DesiredCount` parameter
   - Container resources: Adjust `TaskCpu` and `TaskMemory`
   - Health check: Edit target group health check settings

## Deployment Workflow

### First-Time Deployment

1. Ensure AWS CLI configured: `aws configure`
2. Ensure Docker is running: `docker ps`
3. Run quick deployment: `cd pre-infra && ./quick-deploy.sh`
4. Wait 10-15 minutes for stack creation
5. Access application via ALB URL from CloudFormation outputs

### Updating the Application

1. Make code changes in `AWSomeShopEmployeeRewardsSite/`
2. Run deployment script: `cd pre-infra && ./deploy.sh dev`
3. Script automatically builds new image, pushes to ECR, and updates ECS service
4. ECS performs rolling update with zero downtime

### Cleanup After Testing

```bash
# Delete CloudFormation stack (removes all resources)
aws cloudformation delete-stack --stack-name dev-awsomeshop-frontend --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name dev-awsomeshop-frontend --region us-east-1

# Delete ECR repository (optional)
aws ecr delete-repository --repository-name awsomeshop-frontend --force --region us-east-1
```

## Troubleshooting

### Development Server Issues

- **Port already in use**: Vite uses port 5173 by default; kill existing process or change port in vite.config.ts
- **Module not found**: Run `npm install` to ensure all dependencies are installed
- **TypeScript errors**: Check that `@/` path alias is resolving correctly

### Deployment Issues

- **Docker build fails**: Ensure you're in `AWSomeShopEmployeeRewardsSite/` directory with Dockerfile present
- **ECS service unhealthy**: Check nginx.conf configuration and health check endpoint
- **Cannot access application**: Wait 2-3 minutes after deployment for tasks to become healthy; verify security group allows port 80

### Viewing Logs

```bash
# Application logs (CloudWatch)
aws logs tail /ecs/dev-awsomeshop-frontend --follow --region us-east-1

# ECS service events
aws ecs describe-services --cluster dev-awsomeshop-cluster --services dev-awsomeshop-frontend-service --region us-east-1

# CloudFormation stack events
aws cloudformation describe-stack-events --stack-name dev-awsomeshop-frontend --region us-east-1 --max-items 20
```
