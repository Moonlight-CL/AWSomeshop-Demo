# Unit 1: Core Business - Functional Design Plan

## Unit Context Analysis
**Unit Name**: Core Business Unit (`core-business`)
**Development Priority**: 1 (Highest)
**Assigned Stories**: 8 stories (6 MVP Core + 2 MVP Important)

### Core Business Responsibilities
- User authentication and session management
- Points balance and transaction management  
- Product catalog browsing and details
- Product redemption workflow
- Order history and tracking

### Key Components
1. **User Management Component** - Authentication, profile management
2. **Points Management Component** - Balance tracking, transaction history
3. **Product Management Component** - Catalog, details, availability
4. **Order Management Component** - Redemption process, order tracking
5. **Data Access Component** - Unified data layer

## Functional Design Plan

### Business Logic Modeling
- [ ] **User Authentication Logic**: Define login workflow, session management, security validation
- [ ] **Points Transaction Logic**: Model point deduction, balance calculation, transaction recording
- [ ] **Product Discovery Logic**: Define catalog filtering, sorting, search algorithms
- [ ] **Redemption Workflow Logic**: Model complete redemption process from selection to confirmation
- [ ] **Order State Management**: Define order lifecycle, status transitions, tracking logic

### Domain Model Design
- [ ] **Core Entities Definition**: User, Points, Product, Order, OrderItem entities with attributes
- [ ] **Entity Relationships**: Define associations, foreign keys, cardinality between entities
- [ ] **Value Objects**: Identify immutable objects like PointsBalance, ProductPrice, OrderStatus
- [ ] **Aggregates**: Define consistency boundaries and aggregate roots for transactions
- [ ] **Domain Events**: Model business events like PointsDeducted, OrderCreated, ProductRedeemed

### Business Rules Specification
- [ ] **Authentication Rules**: Login validation, session timeout, security constraints
- [ ] **Points Rules**: Balance validation, minimum redemption amounts, transaction limits
- [ ] **Product Rules**: Availability checks, redemption eligibility, inventory constraints
- [ ] **Redemption Rules**: Point sufficiency, product availability, user eligibility validation
- [ ] **Order Rules**: Order creation validation, cancellation policies, status change rules

### Data Flow Design
- [ ] **Input Data Validation**: Define validation rules for all user inputs and API requests
- [ ] **Business Process Flows**: Map data flow through authentication, browsing, redemption processes
- [ ] **Data Transformation Logic**: Define how raw data becomes business objects
- [ ] **Output Data Formatting**: Specify response formats, error messages, success confirmations
- [ ] **Persistence Strategy**: Define what data gets stored when and how

## Functional Design Questions

Based on the unit definition and assigned stories, I need clarification on several business logic aspects to ensure comprehensive functional design:

### Business Logic Modeling Questions

**Q1: User Authentication and Session Management**
What specific authentication method should be implemented for employee login?
[Answer]: 使用aws的cognito服务的user pool功能来支持用户登陆和验证

**Q2: Points Transaction Processing**
How should the system handle concurrent point redemptions by the same user to prevent race conditions?
[Answer]: 我们假设同一个用户不会同时登录

**Q3: Product Availability Logic**
Should the system implement real-time inventory checking during browsing, or only at redemption time?
[Answer]: only at redemption time

**Q4: Redemption Workflow Complexity**
Should the redemption process support multi-step confirmation (cart → review → confirm) or single-step immediate redemption?
[Answer]: single-step immediate redemption，不需要购物车功能

### Domain Model Questions

**Q5: Points Balance Precision**
Should points be stored as integers (whole numbers) or support decimal places for fractional points?
[Answer]: integers

**Q6: Order State Granularity**
What are the specific order statuses needed (e.g., Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)?
[Answer]: 只需要Delivered

**Q7: Product Categorization**
Should products have hierarchical categories (main category → subcategory) or flat single-level categories?
[Answer]: single-level category

**Q8: User Profile Data**
What user information beyond authentication is needed for the redemption process (department, employee ID, manager approval)?
[Answer]: 不需要，登录成功就是身份已经验证

### Business Rules Questions

**Q9: Points Expiration Policy**
Do employee points have expiration dates, and if so, how should expired points be handled?
[Answer]: no expiration date

**Q10: Redemption Limits**
Are there daily, weekly, or monthly limits on how many products a user can redeem?
[Answer]: no

**Q11: Product Eligibility Rules**
Are there restrictions on which employees can redeem which products (based on role, department, tenure)?
[Answer]: no

**Q12: Insufficient Points Handling**
When a user doesn't have enough points, should the system suggest alternative products or allow partial payment?
[Answer]: no

### Data Flow and Integration Questions

**Q13: Error Recovery Strategy**
If a redemption fails after points are deducted, how should the system handle rollback and user notification?
[Answer]: return the points and mark the order as failed in database

**Q14: Audit Trail Requirements**
What level of audit logging is required for points transactions and redemptions (who, what, when, why)?
[Answer]: who, what, when

**Q15: Performance Requirements**
What are the expected response times for product catalog loading and redemption processing?
[Answer]: in 5 seconds

## Next Steps

1. **Complete all [Answer]: tags above**
2. **Review answers for ambiguities** - I will analyze all responses and ask follow-up questions if needed
3. **Generate functional design artifacts** based on your answers:
   - Business logic model with detailed workflows
   - Domain entities with complete specifications  
   - Business rules with validation logic
4. **Present design for approval** before proceeding to next stage

## Completion Tracking

- [ ] All questions answered by user
- [ ] Ambiguities resolved through follow-up questions  
- [ ] Business logic model generated
- [ ] Domain entities defined
- [ ] Business rules specified
- [ ] Functional design artifacts created
- [ ] User approval received

## Plan Execution Status

- [x] All questions answered by user
- [x] Ambiguities resolved through follow-up questions  
- [ ] Business logic model generated
- [ ] Domain entities defined
- [ ] Business rules specified
- [ ] Functional design artifacts created
- [ ] User approval received

- [x] Business logic model generated
- [x] Domain entities defined
- [x] Business rules specified
- [x] Functional design artifacts created
- [ ] User approval received