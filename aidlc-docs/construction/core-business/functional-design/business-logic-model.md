# Unit 1: Core Business - Business Logic Model

## Authentication and Session Management

### AWS Cognito Integration Logic
```
Authentication Flow:
1. User submits credentials to frontend
2. Frontend calls AWS Cognito User Pool API
3. Cognito validates credentials and returns JWT token
4. Frontend stores JWT token in secure storage
5. All subsequent API calls include JWT token in Authorization header
6. Backend validates JWT token with Cognito for each request
```

### Session Management Logic
```
Session Lifecycle:
- Session Creation: JWT token issued by Cognito (configurable expiration)
- Session Validation: Token verified on each API call
- Session Refresh: Automatic token refresh using refresh token
- Session Termination: Explicit logout clears tokens
- Concurrent Sessions: Single user, single session assumption (no race condition handling needed)
```

## Points Transaction Processing

### Points Balance Management Logic
```
Balance Calculation:
- Current Balance = Initial Points + Total Credits - Total Debits
- Balance stored as integer (whole numbers only)
- Real-time balance calculation from transaction history
- No decimal point handling required
```

### Transaction Recording Logic
```
Transaction Process:
1. Validate user authentication
2. Check current points balance
3. Validate transaction amount (positive integers only)
4. Record transaction in PointsHistory table
5. Update user's current balance
6. Return transaction confirmation
```

### Concurrent Transaction Handling
```
Concurrency Strategy:
- Assumption: Single user, single session (no concurrent access)
- Database-level constraints ensure data integrity
- Transaction isolation at database level
- No application-level locking required
```

## Product Discovery and Availability

### Product Catalog Logic
```
Catalog Display:
- Load all active products from database
- Apply single-level category filtering
- Support sorting by: name, points required, category
- No hierarchical category navigation
- Real-time availability checking not required during browsing
```

### Product Availability Logic
```
Availability Check (Redemption Time Only):
1. Check product exists and is active
2. Verify product has sufficient inventory (if inventory tracking enabled)
3. Validate product is not discontinued
4. Return boolean availability status
```

### Product Search and Filtering Logic
```
Search Capabilities:
- Text search across product name and description
- Category-based filtering (single-level categories)
- Points range filtering (min/max points required)
- Sort options: alphabetical, points (low to high, high to low)
```

## Redemption Workflow Logic

### Single-Step Redemption Process
```
Redemption Flow:
1. User clicks "Redeem" on product detail page
2. System validates user authentication
3. Check user has sufficient points
4. Verify product availability
5. Deduct points from user balance
6. Create order record with "Delivered" status
7. Record points transaction
8. Return redemption confirmation
9. No cart or multi-step confirmation required
```

### Points Deduction Logic
```
Deduction Process:
1. Calculate required points for product
2. Verify user balance >= required points
3. Create negative points transaction record
4. Update user balance atomically
5. Link transaction to order record
```

### Redemption Validation Logic
```
Validation Rules:
- User must be authenticated
- User balance must be >= product points cost
- Product must be available and active
- No additional eligibility restrictions
- No daily/monthly redemption limits
```

## Order State Management

### Order Lifecycle Logic
```
Order States:
- Created: Order record created (temporary state)
- Delivered: Final state (only persistent state needed)
- Failed: Error state for rollback scenarios

State Transitions:
- Created → Delivered (successful redemption)
- Created → Failed (redemption failure, points returned)
```

### Order Tracking Logic
```
Order Information:
- Order ID (unique identifier)
- User ID (order owner)
- Product ID and details snapshot
- Points deducted
- Order timestamp
- Status (Delivered/Failed)
- No shipping or processing states needed
```

### Error Recovery Logic
```
Failure Handling:
1. If redemption fails after points deduction:
   - Create compensating points transaction (credit)
   - Mark order as "Failed"
   - Log error details for audit
   - Return points to user balance
   - Notify user of failure
```

## Data Flow Patterns

### Input Validation Logic
```
API Input Validation:
- JWT token validation for all authenticated endpoints
- Request payload schema validation
- Business rule validation (points sufficiency, product availability)
- Input sanitization for security
```

### Business Process Data Flow
```
Authentication Flow:
User Credentials → Cognito → JWT Token → Session Storage

Points Query Flow:
User Request → JWT Validation → Database Query → Balance Calculation → Response

Product Browse Flow:
User Request → JWT Validation → Product Query → Category Filter → Sort → Response

Redemption Flow:
Redemption Request → JWT Validation → Points Check → Product Check → 
Transaction Creation → Order Creation → Confirmation Response
```

### Data Transformation Logic
```
Request/Response Transformation:
- Database entities → API response DTOs
- API request DTOs → domain objects
- Domain events → audit log entries
- Error objects → standardized error responses
```

### Persistence Strategy
```
Data Storage Logic:
- User authentication: Managed by AWS Cognito
- User profile: Local database with Cognito user ID reference
- Points transactions: Immutable audit trail in PointsHistory
- Product data: Master data in Products table
- Orders: Transactional data in Orders table
- Real-time data: Calculated from persistent data, no caching layer
```

## Performance and Response Logic

### Response Time Requirements
```
Performance Targets:
- All API responses: < 5 seconds
- Authentication: < 2 seconds
- Product catalog loading: < 3 seconds
- Redemption processing: < 5 seconds
- Points balance query: < 1 second
```

### Database Query Optimization
```
Query Strategy:
- Index on user_id for points and orders queries
- Index on product category for filtering
- Index on order timestamp for history queries
- Limit result sets with pagination
- Use database connection pooling
```

## Audit and Logging Logic

### Audit Trail Requirements
```
Audit Information (Who, What, When):
- Who: User ID from JWT token
- What: Action performed (login, redemption, points query)
- When: Timestamp (ISO 8601 format)
- Additional context: IP address, user agent, request ID
```

### Audit Event Types
```
Auditable Events:
- User authentication (login/logout)
- Points balance queries
- Product redemptions
- Points transactions
- Order creation
- System errors and failures
```

### Logging Strategy
```
Log Levels and Content:
- INFO: Successful business operations
- WARN: Business rule violations, insufficient points
- ERROR: System failures, integration errors
- DEBUG: Detailed request/response data (development only)
```

## Integration Points

### AWS Cognito Integration
```
Cognito Operations:
- User authentication validation
- JWT token verification
- User profile data retrieval
- Session management
- Password reset (if required)
```

### Database Integration
```
Database Operations:
- CRUD operations on all business entities
- Transaction management for redemptions
- Query optimization for performance
- Data consistency enforcement
```

### External Service Integration
```
Future Integration Points:
- Notification service (Unit 3) for redemption confirmations
- Audit service (Unit 3) for operation logging
- Admin services (Unit 2) for data access
```

## Business Logic Validation Rules

### Authentication Validation
```
Login Validation:
- Valid JWT token format
- Token not expired
- Token issued by correct Cognito User Pool
- User account active in Cognito
```

### Points Validation
```
Points Business Rules:
- Points balance must be non-negative
- Points transactions must be positive integers
- Deduction amount cannot exceed current balance
- No fractional points allowed
```

### Product Validation
```
Product Business Rules:
- Product must exist and be active
- Product points cost must be positive integer
- Product category must be valid single-level category
- Product availability checked only at redemption time
```

### Order Validation
```
Order Business Rules:
- One order per redemption (no cart functionality)
- Order immediately marked as "Delivered" upon successful redemption
- Failed orders must return points to user
- Order history accessible only to order owner
```