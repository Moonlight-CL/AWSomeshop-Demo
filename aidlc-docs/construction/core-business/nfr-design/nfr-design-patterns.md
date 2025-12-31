# NFR Design Patterns - Core Business Unit

## Pattern Analysis and Selection

Based on the NFR requirements and user answers, the following patterns have been selected for the Core Business Unit:

### Resilience and Error Handling Patterns

#### Authentication Failure Handling
**Selected Pattern**: Simple fail-fast with immediate error response
- **Implementation**: Direct AWS Cognito validation on every request
- **Rationale**: Prioritizes simplicity and reliability over complex retry mechanisms
- **Trade-offs**: No fallback authentication, but ensures consistent security posture
- **Error Response**: Immediate HTTP 401 Unauthorized with clear error message

#### Database Connection Failure Handling
**Selected Pattern**: Simple connection pooling with immediate failure on unavailability
- **Implementation**: Standard connection pooling with fail-fast behavior
- **Rationale**: Aligns with strong consistency requirements and simple architecture
- **Trade-offs**: No degraded mode operation, but ensures data integrity
- **Error Response**: HTTP 503 Service Unavailable when database is unreachable

### Performance Optimization Patterns

#### Balance Query Optimization
**Selected Pattern**: Database query optimization with proper indexing only
- **Implementation**: 
  - Optimized SQL queries for points balance calculation
  - Database indexes on user_id and transaction_date fields
  - Direct database queries without caching layer
- **Rationale**: Meets 3-second response target with simple, maintainable approach
- **Performance Target**: < 3 seconds for balance queries
- **Query Strategy**: Single aggregation query with proper indexing

#### Product Image Loading Optimization
**Selected Pattern**: Direct S3 serving with image compression
- **Implementation**:
  - Images stored in Amazon S3 with optimized compression
  - Direct S3 URLs served to frontend
  - Image size optimization (recommended max 500KB per image)
- **Rationale**: Simple implementation meeting 3-second loading target
- **Performance Target**: < 3 seconds average loading time
- **Storage Strategy**: S3 standard storage class with lifecycle policies

### Scalability Architecture Patterns

#### Application Layer Scaling
**Selected Pattern**: Auto-scaling groups with ECS service scaling based on CPU/memory metrics
- **Implementation**:
  - ECS Service with auto-scaling configuration
  - Target tracking scaling policies based on CPU utilization (70% target)
  - Memory utilization monitoring (80% target)
  - Scale-out: Add containers when metrics exceed thresholds
  - Scale-in: Remove containers when metrics drop below thresholds
- **Scaling Metrics**:
  - CPU Utilization: 70% target
  - Memory Utilization: 80% target
  - Target Group Request Count: 1000 requests per target
- **Capacity Planning**: 2-10 container instances based on load

#### Database Scaling Strategy
**Selected Pattern**: Vertical scaling with larger RDS instances
- **Implementation**:
  - Single RDS MySQL instance with vertical scaling capability
  - Instance class upgrades as needed (db.t3.micro → db.t3.small → db.t3.medium)
  - Connection pooling to optimize database connections
- **Rationale**: Simpler than read replicas for current scale (50-200 users)
- **Scaling Path**: Manual instance class upgrades based on performance monitoring
- **Connection Management**: Connection pooling with max 20 connections per container

### Security Implementation Patterns

#### JWT Token Validation
**Selected Pattern**: Direct AWS Cognito validation on every request
- **Implementation**:
  - JWT middleware validates tokens against AWS Cognito on each API request
  - No local token caching or validation
  - Direct integration with Cognito User Pool
- **Security Benefits**: Always up-to-date token validation, immediate revocation support
- **Performance Impact**: Additional network call per request (acceptable for current scale)
- **Error Handling**: Clear authentication errors with appropriate HTTP status codes

#### API Security Approach
**Selected Pattern**: API request logging and monitoring only
- **Implementation**:
  - Comprehensive request/response logging to CloudWatch
  - Error rate monitoring and alerting
  - Basic input validation and sanitization
- **Rationale**: Focused on observability and basic security for internal employee system
- **Monitoring**: Track authentication failures, error rates, and response times
- **Logging**: Structured JSON logs with request IDs for traceability

### Logical Infrastructure Components

#### Monitoring and Observability
**Selected Pattern**: Basic CloudWatch logging only
- **Implementation**:
  - CloudWatch Logs for application logging
  - CloudWatch Metrics for basic performance monitoring
  - Simple dashboards for key metrics (response time, error rate, active users)
- **Metrics Collected**:
  - Application response times
  - Error rates by endpoint
  - Authentication success/failure rates
  - Database connection pool utilization
- **Alerting**: Basic alarms for high error rates and slow response times

#### Deployment and Infrastructure Management
**Selected Pattern**: Infrastructure as Code (CloudFormation/CDK) with automated deployments
- **Implementation**:
  - AWS CDK for infrastructure definition
  - Automated ECS service deployments
  - Docker image builds and deployments via CI/CD pipeline
- **Infrastructure Components**:
  - ECS Cluster with auto-scaling
  - Application Load Balancer
  - RDS MySQL instance
  - S3 bucket for product images
  - CloudWatch for monitoring
- **Deployment Strategy**: Rolling deployments with health checks

### Data Consistency and Transaction Patterns

#### Points Transaction Consistency
**Selected Pattern**: Database transactions with ACID compliance and rollback capability
- **Implementation**:
  - Database transactions for all points operations
  - Rollback capability for failed redemptions
  - Atomic operations for points deduction and order creation
- **Transaction Scope**:
  - Points balance updates
  - Order creation
  - Audit trail logging
- **Consistency Guarantee**: Strong consistency for all financial operations
- **Error Handling**: Automatic rollback on any transaction failure

#### Concurrent Redemption Handling
**Selected Pattern**: Database-level constraints with immediate failure
- **Implementation**:
  - Database constraints to prevent negative point balances
  - Immediate failure response for insufficient points
  - No retry mechanisms for failed redemptions
- **Constraint Strategy**:
  - CHECK constraint on points balance (>= 0)
  - Unique constraints on order IDs
  - Foreign key constraints for data integrity
- **User Experience**: Clear error messages for failed redemptions with current balance information

## Pattern Integration Summary

### Architecture Principles
1. **Simplicity First**: Choose simple, proven patterns over complex solutions
2. **Fail-Fast**: Immediate failure with clear error messages
3. **Strong Consistency**: Prioritize data integrity over availability
4. **Observability**: Comprehensive logging and monitoring for troubleshooting
5. **Scalability**: Vertical scaling for database, horizontal for application

### Performance Characteristics
- **Authentication**: Direct Cognito validation (< 5 seconds)
- **Balance Queries**: Optimized database queries (< 3 seconds)
- **Image Loading**: Direct S3 serving (< 3 seconds)
- **Redemptions**: Database transactions (< 5 seconds)

### Operational Characteristics
- **Deployment**: Automated via CDK and CI/CD
- **Monitoring**: CloudWatch-based observability
- **Scaling**: Auto-scaling for application, manual for database
- **Security**: JWT-based authentication with comprehensive logging

### Risk Mitigation
- **Single Points of Failure**: Accepted for simplicity (AWS Cognito, RDS)
- **Data Consistency**: Strong ACID transactions for financial operations
- **Performance**: Optimized queries and proper indexing
- **Security**: Direct token validation and comprehensive audit logging