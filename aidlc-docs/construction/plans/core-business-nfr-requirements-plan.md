# Unit 1: Core Business - NFR Requirements Plan

## Plan Overview
This plan assesses non-functional requirements for the Core Business Unit, focusing on scalability, performance, availability, security, and tech stack decisions based on the functional design.

## Functional Design Analysis Summary
- **Authentication**: AWS Cognito User Pool integration with JWT tokens
- **Business Logic**: Points management (integer-only), single-step redemption, immediate delivery
- **Performance Target**: 5-second response time for all operations
- **Concurrency**: Single user, single session assumption
- **Data Flow**: Real-time balance calculation, no caching layer specified
- **Integration**: AWS Cognito, database operations, future Unit 2/3 integration

## NFR Assessment Plan

### Step 1: Scalability Requirements Assessment
[ ] Analyze expected user load and concurrent usage patterns
[ ] Determine database scaling requirements for points and orders
[ ] Assess AWS Cognito User Pool scaling considerations
[ ] Evaluate API endpoint scaling needs

### Step 2: Performance Requirements Clarification
[ ] Validate 5-second response time targets for all operations
[ ] Determine database query optimization requirements
[ ] Assess real-time balance calculation performance implications
[ ] Evaluate pagination and data retrieval strategies

### Step 3: Availability and Reliability Requirements
[ ] Determine uptime requirements and disaster recovery needs
[ ] Assess error handling and fault tolerance requirements
[ ] Evaluate monitoring and alerting needs
[ ] Determine backup and data recovery strategies

### Step 4: Security Requirements Assessment
[ ] Validate AWS Cognito security configuration requirements
[ ] Assess data protection and encryption needs
[ ] Determine audit trail and compliance requirements
[ ] Evaluate API security and input validation needs

### Step 5: Technology Stack Selection
[ ] Validate backend technology choices (Python/FastAPI assumed)
[ ] Determine database technology and configuration
[ ] Assess AWS service selection and integration patterns
[ ] Evaluate deployment and infrastructure requirements

### Step 6: Integration and Compatibility Requirements
[ ] Assess integration patterns with Units 2 and 3
[ ] Determine API design and versioning strategy
[ ] Evaluate data sharing and consistency requirements
[ ] Assess future extensibility needs

## NFR Requirements Questions

Based on the functional design analysis, please answer the following questions to clarify non-functional requirements:

### Scalability and Load Requirements

**Q1: User Load and Concurrency**
The functional design assumes single user, single session. What are your expectations for:
- Peak concurrent users during business hours?
- Total registered users in the system?
- Expected growth rate over the next 12 months?

[Answer]: peak concurrent users during business hours : 100;Total registered users in the system: 1000;Expected growth rate over the next 12 months:每个月增加10个user

**Q2: Transaction Volume**
For points transactions and redemptions:
- Expected daily redemption volume?
- Peak redemption periods (lunch hours, end of month)?
- Maximum points transactions per user per day?

[Answer]: Expected daily redemption volume： 10000；Peak redemption periods ： lunch hours；Maximum points transactions per user per day： 1

**Q3: Database Scaling Strategy**
Given real-time balance calculation from transaction history:
- How many points transactions do you expect per user over time?
- Should we implement data archiving for old transactions?
- Any preferences for database scaling approach (vertical vs horizontal)?

[Answer]: How many points transactions do you expect per user over time: 1 per day；Should we implement data archiving for old transactions: no;ny preferences for database scaling approach : horizontal

### Performance Requirements

**Q4: Response Time Validation**
The functional design specifies 5-second maximum response times:
- Are these targets acceptable for all operations?
- Any operations that need faster response times (e.g., login < 2 seconds)?
- What's the acceptable response time for points balance queries?

[Answer]: Are these targets acceptable for all operations: yes;Any operations that need faster response times: login; What's the acceptable response time for points balance queries: 3s

**Q5: Database Performance Strategy**
For real-time balance calculation:
- Should we implement balance caching to improve performance?
- How frequently do users check their points balance?
- Any preference for read replicas or performance optimization?

[Answer]: Should we implement balance caching to improve performance: no; How frequently do users check their points balance: 1 per day;Any preference for read replicas or performance optimization: no need for read replicas.

**Q6: Product Catalog Performance**
For product browsing and search:
- How many products do you expect in the catalog initially and long-term?
- Should product search support full-text search or simple filtering?
- Any requirements for product image loading performance?

[Answer]: How many products do you expect in the catalog initially and long-term: initially 10, long-term: 100;Should product search support full-text search or simple filtering: simple filtering; Any requirements for product image loading performance: average in 3s. 

### Availability and Reliability Requirements

**Q7: Uptime and Availability**
What are your availability requirements:
- Target uptime percentage (99%, 99.9%, 99.99%)?
- Acceptable maintenance windows?
- Business hours when system must be available?

[Answer]: Target uptime percentage: 99.9%;Acceptable maintenance windows: 2 hours;Business hours when system must be available: from 8 am to 10pm

**Q8: Disaster Recovery**
For business continuity:
- Recovery Time Objective (RTO) - how quickly system must be restored?
- Recovery Point Objective (RPO) - acceptable data loss timeframe?
- Need for multi-region deployment or single region acceptable?

[Answer]: Recovery Time Objective (RTO) - how quickly system must be restored: 1 hour. Recovery Point Objective (RPO) - acceptable data loss timeframe: 1 day;Need for multi-region deployment or single region acceptable: single region

**Q9: Error Handling Strategy**
For system reliability:
- How should the system handle AWS Cognito service outages?
- What's the acceptable behavior when database is temporarily unavailable?
- Should failed redemptions be queued for retry or immediately failed?

[Answer]: How should the system handle AWS Cognito service outages: stop service;hat's the acceptable behavior when database is temporarily unavailable: stop service;Should failed redemptions be queued for retry or immediately failed: just fail and keep data consistant

### Security Requirements

**Q10: AWS Cognito Configuration**
For authentication security:
- Any specific password policy requirements?
- Need for multi-factor authentication (MFA)?
- Session timeout preferences (current design uses 8 hours default)?

[Answer]: Any specific password policy requirements: number, letter combined at least;Need for multi-factor authentication (MFA): no; Session timeout preferences (current design uses 8 hours default): 8 hours as default

**Q11: Data Protection**
For sensitive data handling:
- Should points transaction data be encrypted at rest?
- Any compliance requirements (SOX, PCI, etc.)?
- Need for data anonymization or pseudonymization?

[Answer]: Should points transaction data be encrypted at rest:no;Any compliance requirements : no;Need for data anonymization or pseudonymization: no;

**Q12: API Security**
For API protection:
- Rate limiting requirements for API endpoints?
- Need for API key authentication in addition to JWT?
- Any IP whitelisting or geographic restrictions?

[Answer]: Rate limiting requirements for API endpoints: no;Need for API key authentication in addition to JWT:no;ny IP whitelisting or geographic restrictions:no

### Technology Stack and Infrastructure

**Q13: Backend Technology Confirmation**
The requirements suggest Python/FastAPI:
- Confirm Python/FastAPI as preferred backend technology?
- Any specific Python version requirements?
- Preference for async/await patterns for database operations?

[Answer]: Confirm Python/FastAPI as preferred backend technology:yes;Any specific Python version requirements: equal or above 3.10;Preference for async/await patterns for database operations: yes

**Q14: Database Technology Selection**
For data persistence:
- Preference for specific database (PostgreSQL, MySQL, Aurora)?
- Need for ACID compliance for redemption transactions?
- Any specific database features required (JSON support, full-text search)?

[Answer]: Preference for specific database (PostgreSQL, MySQL, Aurora):aws rds for mysql 8.0 ;Need for ACID compliance for redemption transactions: no;Any specific database features required (JSON support, full-text search): no

**Q15: AWS Services Integration**
For cloud infrastructure:
- Preference for specific AWS compute services (Lambda, ECS, EC2)?
- Need for managed services vs self-managed infrastructure?
- Any specific AWS regions required for deployment?

[Answer]: reference for specific AWS compute services: ECS;Need for managed services vs self-managed infrastructure: managed services; Any specific AWS regions required for deployment: no prefer region

### Integration and Future Requirements

**Q16: Inter-Unit Communication**
For integration with Units 2 and 3:
- Preference for synchronous vs asynchronous communication?
- Need for event-driven architecture or direct API calls?
- Any message queuing or event streaming requirements?

[Answer]: Preference for synchronous vs asynchronous communication: synchronous;Need for event-driven architecture or direct API calls: direct API calls;Any message queuing or event streaming requirements: no

**Q17: API Design Strategy**
For external integration:
- Need for REST API versioning strategy?
- Should APIs follow specific standards (OpenAPI, JSON:API)?
- Any requirements for API documentation and testing tools?

[Answer]: Need for REST API versioning strategy: yes;hould APIs follow specific standards: OpenAPI;Any requirements for API documentation and testing tools: can be tested with Postman

**Q18: Monitoring and Observability**
For operational visibility:
- What metrics are most important to track (response times, error rates, business metrics)?
- Need for centralized logging and log aggregation?
- Preference for specific monitoring tools (CloudWatch, Datadog, etc.)?

[Answer]: What metrics are most important to track: response times, error rates;Need for centralized logging and log aggregation: aws cloudwatch; Preference for specific monitoring tools: aws cloudwatch

**Q19: Development and Deployment**
For development workflow:
- Need for automated testing requirements (unit, integration, e2e)?
- Preference for CI/CD pipeline tools and deployment strategy?
- Any specific development environment requirements?

[Answer]: Need for automated testing requirements: unit and integration; Preference for CI/CD pipeline tools and deployment strategy: docker image based build and deployment;any specific development environment requirements:no

**Q20: Future Extensibility**
For system evolution:
- Any planned features that might affect architecture decisions?
- Need for plugin architecture or extension points?
- Expected integration with external systems (HR, payroll, etc.)?

[Answer]: Any planned features that might affect architecture decisions: no;Need for plugin architecture or extension points:no;Expected integration with external systems:no

## Completion Checklist

### Analysis Phase
[ ] All 20 questions answered by user
[ ] Ambiguous responses identified and clarified
[ ] Follow-up questions resolved
[ ] NFR requirements validated against functional design

### Artifact Generation Phase
[ ] NFR requirements document created
[ ] Technology stack decisions documented
[ ] Integration patterns specified
[ ] Performance benchmarks defined

### Review and Approval Phase
[ ] NFR requirements reviewed with user
[ ] Technology choices confirmed
[ ] Performance targets validated
[ ] User approval obtained

## Next Steps
After completing this plan:
1. User answers all [Answer]: tags
2. AI analyzes responses for ambiguities
3. AI creates clarification questions if needed
4. AI generates NFR requirements artifacts
5. User reviews and approves NFR requirements
6. Proceed to NFR Design stage
### Analysis Phase
[x] All 20 questions answered by user
[x] Ambiguous responses identified and clarified
[x] Follow-up questions resolved
[x] NFR requirements validated against functional design

### Artifact Generation Phase
[x] NFR requirements document created
[x] Technology stack decisions documented
[x] Integration patterns specified
[x] Performance benchmarks defined

### Review and Approval Phase
[ ] NFR requirements reviewed with user
[ ] Technology choices confirmed
[ ] Performance targets validated
[ ] User approval obtained