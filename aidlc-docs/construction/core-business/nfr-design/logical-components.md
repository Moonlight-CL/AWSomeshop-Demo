# Logical Components - Core Business Unit

## Infrastructure Architecture Overview

The Core Business Unit logical components are designed to support a simple, scalable, and maintainable architecture for the AWSomeShop employee benefits platform.

## Application Layer Components

### Load Balancer
**Component**: Application Load Balancer (ALB)
- **Purpose**: Distribute incoming requests across multiple ECS container instances
- **Configuration**:
  - Target Group: ECS service targets
  - Health Check: `/health` endpoint with 30-second interval
  - Sticky Sessions: Disabled (stateless application)
  - SSL Termination: HTTPS listener with ACM certificate
- **Scaling**: Automatic based on request volume
- **Monitoring**: CloudWatch metrics for request count, latency, error rates

### Container Orchestration
**Component**: Amazon ECS Service
- **Purpose**: Manage and scale FastAPI application containers
- **Configuration**:
  - Task Definition: Python/FastAPI application
  - Service Auto Scaling: CPU and memory-based scaling
  - Desired Count: 2-10 tasks based on load
  - Deployment: Rolling deployment with health checks
- **Resource Allocation**:
  - CPU: 256-512 CPU units per task
  - Memory: 512-1024 MB per task
  - Network Mode: awsvpc for security group isolation
- **Health Monitoring**: ECS health checks with ALB integration

### Application Runtime
**Component**: FastAPI Application Container
- **Purpose**: Core business logic execution environment
- **Configuration**:
  - Base Image: Python 3.10+ slim image
  - Framework: FastAPI with async/await support
  - WSGI Server: Uvicorn for async request handling
  - Environment Variables: Database connection, Cognito configuration
- **Performance Optimization**:
  - Connection pooling for database connections
  - Async request processing
  - Structured JSON logging
- **Security**: Non-root container execution, minimal attack surface

## Data Layer Components

### Primary Database
**Component**: Amazon RDS MySQL 8.0
- **Purpose**: Primary data storage for users, points, products, and orders
- **Configuration**:
  - Instance Class: db.t3.micro (scalable to db.t3.medium)
  - Storage: 20GB GP2 SSD with auto-scaling enabled
  - Multi-AZ: Disabled for cost optimization (single AZ deployment)
  - Backup: 7-day automated backup retention
- **Performance Optimization**:
  - Connection pooling (max 20 connections per container)
  - Optimized indexes on user_id, transaction_date, product_id
  - Query optimization for balance calculations
- **Security**: VPC security groups, encryption at rest optional

### Connection Management
**Component**: Database Connection Pool
- **Purpose**: Optimize database connections and prevent connection exhaustion
- **Configuration**:
  - Pool Size: 5-20 connections per application instance
  - Connection Timeout: 30 seconds
  - Idle Timeout: 300 seconds (5 minutes)
  - Retry Logic: 3 attempts with exponential backoff
- **Monitoring**: Connection pool utilization metrics
- **Error Handling**: Graceful degradation on connection failures

## Storage Components

### Product Image Storage
**Component**: Amazon S3 Bucket
- **Purpose**: Store and serve product images with optimized performance
- **Configuration**:
  - Storage Class: S3 Standard for frequently accessed images
  - Versioning: Disabled for cost optimization
  - Lifecycle Policy: No automatic archiving (small dataset)
  - Public Access: Blocked (signed URLs for access)
- **Performance Optimization**:
  - Image compression (max 500KB per image)
  - Direct S3 serving to frontend
  - Optimized image formats (WebP, JPEG)
- **Security**: IAM roles for application access, no public access

## Authentication and Security Components

### Identity Provider
**Component**: AWS Cognito User Pool
- **Purpose**: User authentication and JWT token management
- **Configuration**:
  - Password Policy: Numbers and letters required
  - Session Duration: 8 hours default
  - MFA: Disabled for simplicity
  - User Attributes: Email, name, employee_id
- **Integration**: Direct JWT validation on every API request
- **Security**: Standard Cognito security features, no custom authentication

### API Security Middleware
**Component**: JWT Authentication Middleware
- **Purpose**: Validate JWT tokens and enforce API security
- **Configuration**:
  - Token Validation: Direct Cognito validation (no caching)
  - Error Handling: Clear HTTP status codes (401, 403)
  - Request Logging: Comprehensive audit trail
  - Input Validation: Basic sanitization and validation
- **Performance**: Acceptable latency for direct validation
- **Monitoring**: Authentication success/failure rates

## Monitoring and Observability Components

### Centralized Logging
**Component**: Amazon CloudWatch Logs
- **Purpose**: Centralized application and infrastructure logging
- **Configuration**:
  - Log Groups: Separate groups for application, ECS, and ALB logs
  - Retention: 30 days for cost optimization
  - Log Format: Structured JSON with request IDs
  - Log Levels: INFO, WARN, ERROR for production
- **Integration**: Automatic log forwarding from ECS tasks
- **Analysis**: CloudWatch Insights for log querying

### Metrics and Monitoring
**Component**: Amazon CloudWatch Metrics
- **Purpose**: Performance monitoring and alerting
- **Configuration**:
  - Custom Metrics: Response times, error rates, active users
  - AWS Metrics: ECS, ALB, RDS standard metrics
  - Dashboards: Simple operational dashboards
  - Alarms: High error rate, slow response time alerts
- **Key Metrics**:
  - API response times (< 5 seconds target)
  - Authentication success rates
  - Database connection pool utilization
  - Points transaction success rates

### Health Monitoring
**Component**: Application Health Checks
- **Purpose**: Ensure application and infrastructure health
- **Configuration**:
  - Health Endpoint: `/health` with dependency checks
  - ECS Health Checks: Container-level health monitoring
  - ALB Health Checks: Target group health validation
  - Database Health: Connection and query validation
- **Response**: JSON health status with component details
- **Integration**: ECS service management and ALB routing

## Deployment and Infrastructure Management Components

### Infrastructure as Code
**Component**: AWS CDK (Cloud Development Kit)
- **Purpose**: Define and manage infrastructure resources
- **Configuration**:
  - Language: Python CDK for consistency with application
  - Stacks: Separate stacks for networking, compute, and data layers
  - Parameters: Environment-specific configuration
  - Outputs: Resource ARNs and endpoints for application configuration
- **Benefits**: Version-controlled infrastructure, repeatable deployments
- **Integration**: CI/CD pipeline integration for automated deployments

### CI/CD Pipeline
**Component**: Automated Deployment Pipeline
- **Purpose**: Build, test, and deploy application changes
- **Configuration**:
  - Source: Git repository with webhook triggers
  - Build: Docker image creation and testing
  - Deploy: ECS service updates with rolling deployment
  - Rollback: Automatic rollback on health check failures
- **Stages**: Build → Test → Deploy → Verify
- **Integration**: ECS service deployment with zero-downtime updates

## Network and Security Components

### Virtual Private Cloud
**Component**: Amazon VPC
- **Purpose**: Network isolation and security for all components
- **Configuration**:
  - CIDR Block: 10.0.0.0/16 for adequate address space
  - Subnets: Public subnets for ALB, private subnets for ECS and RDS
  - Availability Zones: Single AZ deployment for cost optimization
  - NAT Gateway: For outbound internet access from private subnets
- **Security**: Security groups for component-level access control
- **Routing**: Route tables for proper traffic flow

### Security Groups
**Component**: VPC Security Groups
- **Purpose**: Network-level access control between components
- **Configuration**:
  - ALB Security Group: HTTP/HTTPS from internet (0.0.0.0/0)
  - ECS Security Group: HTTP from ALB only
  - RDS Security Group: MySQL from ECS only
  - Cognito Integration: No additional security groups required
- **Principle**: Least privilege access between components
- **Monitoring**: VPC Flow Logs for network traffic analysis

## Component Integration and Data Flow

### Request Flow Architecture
1. **User Request**: HTTPS request to ALB
2. **Load Balancing**: ALB distributes to healthy ECS tasks
3. **Authentication**: JWT validation against Cognito
4. **Business Logic**: FastAPI application processing
5. **Data Access**: Database queries with connection pooling
6. **Response**: JSON response with structured logging

### Data Consistency Flow
1. **Transaction Start**: Database transaction initiation
2. **Business Logic**: Points validation and deduction
3. **Order Creation**: Order record creation
4. **Audit Logging**: Transaction audit trail
5. **Transaction Commit**: Atomic commit or rollback
6. **Response**: Success/failure response to user

### Monitoring and Alerting Flow
1. **Metrics Collection**: CloudWatch metrics from all components
2. **Log Aggregation**: Centralized logging in CloudWatch Logs
3. **Health Monitoring**: Continuous health checks
4. **Alert Generation**: Automated alerts on threshold breaches
5. **Operational Response**: Manual intervention based on alerts

## Scalability and Performance Characteristics

### Horizontal Scaling Components
- **ECS Service**: Auto-scaling based on CPU/memory metrics
- **ALB**: Automatic scaling based on request volume
- **Connection Pools**: Scale with container instances

### Vertical Scaling Components
- **RDS Instance**: Manual instance class upgrades
- **ECS Task Resources**: Configurable CPU/memory allocation

### Performance Optimization
- **Database Indexes**: Optimized for balance queries and lookups
- **Connection Pooling**: Efficient database connection management
- **Image Optimization**: Compressed images for fast loading
- **Async Processing**: Non-blocking request handling