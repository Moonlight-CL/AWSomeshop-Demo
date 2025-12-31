# Infrastructure Design - Core Business Unit

## Infrastructure Service Mapping

Based on the infrastructure design questions and answers, this document maps logical components to specific AWS services for the Core Business Unit deployment.

### User Answers Summary
- **Region**: us-east-2 (Ohio) for good balance of cost and latency
- **Account**: Shared development AWS account with resource tagging
- **Compute**: ECS Fargate for serverless container management
- **Scaling**: 2 tasks minimum, 10 tasks maximum with auto-scaling
- **Database**: db.t3.micro single-AZ for cost optimization
- **Backup**: 30-day automated backup retention for compliance
- **Storage**: S3 Standard storage class with no lifecycle policies
- **Versioning**: No versioning, no lifecycle policies for simplicity
- **Network**: Single AZ deployment with public/private subnets
- **NAT**: Single NAT Gateway in public subnet for cost optimization
- **Monitoring**: Basic CloudWatch with 30-day log retention
- **Logging**: CloudWatch Logs only for simplicity
- **IaC**: AWS CDK with Python for infrastructure as code
- **CI/CD**: Manual deployment process for simplicity
- **SSL**: AWS Certificate Manager (ACM) certificate with automatic renewal
- **WAF**: No WAF for cost optimization and simplicity

## AWS Service Mappings

### Application Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| Load Balancer | Application Load Balancer (ALB) | Internet-facing, SSL termination with ACM |
| Container Runtime | Amazon ECS Fargate | Serverless container management |
| Application Service | ECS Service | 2-10 tasks with auto-scaling based on CPU/memory |
| Container Image | Amazon ECR | Private repository for FastAPI container images |

### Data Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| Primary Database | Amazon RDS MySQL 8.0 | db.t3.micro, single-AZ, 30-day backup retention |
| File Storage | Amazon S3 | Standard storage class for product images |
| Database Connection | RDS Proxy | Connection pooling and management |

### Security Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| User Authentication | Amazon Cognito User Pool | JWT token validation |
| SSL/TLS Certificates | AWS Certificate Manager | Automatic certificate renewal |
| Network Security | VPC Security Groups | Application and database tier isolation |
| Identity Management | IAM Roles and Policies | ECS task execution and service roles |

### Network Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| Virtual Network | Amazon VPC | Single AZ with public/private subnets |
| Internet Gateway | VPC Internet Gateway | Public subnet internet access |
| NAT Gateway | VPC NAT Gateway | Private subnet outbound internet access |
| DNS | Route 53 | Domain name resolution for ALB |

### Monitoring Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| Application Logs | CloudWatch Logs | 30-day retention, structured logging |
| Metrics Collection | CloudWatch Metrics | ECS, RDS, and ALB metrics |
| Health Monitoring | ALB Health Checks | Application endpoint health validation |
| Alerting | CloudWatch Alarms | Basic CPU, memory, and error rate alerts |

### Deployment Layer
| Logical Component | AWS Service | Configuration |
|------------------|-------------|---------------|
| Infrastructure as Code | AWS CDK (Python) | Stack-based infrastructure deployment |
| Container Registry | Amazon ECR | Private Docker image repository |
| Deployment Method | Manual CDK Deploy | Simplified deployment process |

## Resource Specifications

### ECS Fargate Configuration
```yaml
Service Configuration:
  - Desired Count: 2
  - Min Capacity: 2
  - Max Capacity: 10
  - CPU: 512 (0.5 vCPU)
  - Memory: 1024 MB (1 GB)
  - Auto Scaling Metrics:
    - Target CPU Utilization: 70%
    - Target Memory Utilization: 80%
```

### RDS MySQL Configuration
```yaml
Database Configuration:
  - Instance Class: db.t3.micro
  - Engine: MySQL 8.0
  - Storage: 20 GB gp2
  - Multi-AZ: false
  - Backup Retention: 30 days
  - Backup Window: 03:00-04:00 UTC
  - Maintenance Window: Sun:04:00-Sun:05:00 UTC
```

### VPC Network Configuration
```yaml
Network Configuration:
  - VPC CIDR: 10.0.0.0/16
  - Public Subnet: 10.0.1.0/24 (us-east-2a)
  - Private Subnet: 10.0.2.0/24 (us-east-2a)
  - NAT Gateway: Single instance in public subnet
  - Internet Gateway: Attached to VPC
```

### Security Group Rules
```yaml
ALB Security Group:
  - Inbound: 443 (HTTPS) from 0.0.0.0/0
  - Inbound: 80 (HTTP) from 0.0.0.0/0 (redirect to HTTPS)
  - Outbound: All traffic to ECS Security Group

ECS Security Group:
  - Inbound: 8000 (FastAPI) from ALB Security Group
  - Outbound: 443 (HTTPS) to 0.0.0.0/0
  - Outbound: 3306 (MySQL) to RDS Security Group

RDS Security Group:
  - Inbound: 3306 (MySQL) from ECS Security Group
  - Outbound: None
```

## Environment Variables and Configuration

### ECS Task Environment Variables
```yaml
Application Configuration:
  - DATABASE_URL: RDS endpoint with credentials from Secrets Manager
  - COGNITO_USER_POOL_ID: Cognito User Pool identifier
  - COGNITO_CLIENT_ID: Cognito App Client identifier
  - AWS_REGION: us-east-2
  - LOG_LEVEL: INFO
  - S3_BUCKET_NAME: Product images bucket name
```

### Secrets Management
```yaml
AWS Secrets Manager:
  - Database credentials (username/password)
  - Cognito client secret
  - Application JWT secret key
```

## Cost Optimization Considerations

### Resource Sizing Strategy
- **ECS Fargate**: Start with minimal resources (0.5 vCPU, 1 GB RAM)
- **RDS**: db.t3.micro for development, can scale up based on usage
- **S3**: Standard storage class, no lifecycle policies initially
- **NAT Gateway**: Single instance to minimize costs

### Monitoring and Alerting
- **CloudWatch**: Basic metrics with 30-day retention
- **Cost Alerts**: Set up billing alerts for unexpected usage
- **Resource Utilization**: Monitor ECS and RDS utilization for right-sizing

## Security Considerations

### Network Security
- **Private Subnets**: Database and application containers in private subnets
- **Security Groups**: Least privilege access between tiers
- **SSL/TLS**: End-to-end encryption with ACM certificates

### Application Security
- **Cognito Integration**: Centralized user authentication and authorization
- **IAM Roles**: Minimal permissions for ECS tasks and services
- **Secrets Management**: Database credentials stored in Secrets Manager

### Data Security
- **RDS Encryption**: Encryption at rest for database storage
- **S3 Encryption**: Server-side encryption for product images
- **Backup Security**: Encrypted automated backups with 30-day retention

## Operational Procedures

### Deployment Process
1. Build and push container image to ECR
2. Update ECS service with new task definition
3. Monitor deployment through CloudWatch and ALB health checks
4. Rollback if health checks fail

### Monitoring and Troubleshooting
1. **Application Logs**: CloudWatch Logs for application debugging
2. **Performance Metrics**: ECS CPU/memory utilization monitoring
3. **Database Monitoring**: RDS performance insights and slow query logs
4. **Load Balancer**: ALB access logs and target health monitoring

### Backup and Recovery
1. **Database Backups**: Automated daily backups with 30-day retention
2. **Point-in-Time Recovery**: RDS PITR capability for data recovery
3. **Application Recovery**: ECS service auto-recovery and health checks
4. **Disaster Recovery**: Manual process for cross-region recovery

## Integration Points

### External Service Dependencies
- **Amazon Cognito**: User authentication and JWT token validation
- **Amazon S3**: Product image storage and retrieval
- **AWS Secrets Manager**: Secure credential storage and rotation

### Internal Component Communication
- **ALB → ECS**: HTTP/HTTPS load balancing to FastAPI containers
- **ECS → RDS**: Database connections through RDS Proxy
- **ECS → S3**: Direct API calls for image upload/download
- **ECS → Cognito**: JWT token validation for user authentication

## Scalability and Performance

### Auto Scaling Configuration
```yaml
ECS Auto Scaling:
  - Scale Out: CPU > 70% or Memory > 80% for 2 minutes
  - Scale In: CPU < 30% and Memory < 50% for 5 minutes
  - Cooldown: 300 seconds between scaling actions
```

### Performance Optimization
- **Database Indexing**: Optimized indexes for user queries and product searches
- **Connection Pooling**: RDS Proxy for efficient database connections
- **Caching Strategy**: Application-level caching for frequently accessed data
- **Image Optimization**: S3 with CloudFront CDN for future enhancement

## Future Enhancement Considerations

### Potential Improvements
1. **Multi-AZ Deployment**: Enhanced availability with cross-AZ redundancy
2. **CloudFront CDN**: Global content delivery for product images
3. **ElastiCache**: Redis caching layer for improved performance
4. **AWS WAF**: Web application firewall for enhanced security
5. **CI/CD Pipeline**: Automated deployment with CodePipeline/CodeBuild
6. **Container Insights**: Enhanced ECS monitoring and observability

### Migration Path
- Current architecture supports gradual enhancement
- Modular design allows independent component upgrades
- Infrastructure as Code enables consistent environment provisioning