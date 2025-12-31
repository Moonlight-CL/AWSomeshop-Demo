# Core Business Unit - Code Generation Plan

## Plan Overview

This plan implements a **vertical slice development strategy** for the Core Business Unit, building minimal workable end-to-end features incrementally. Each phase delivers a complete, testable feature before moving to the next.

## Unit Context

**Unit Name**: Core Business Unit  
**Assigned Stories**: 8 user stories (US-001 through US-008)  
**Components**: User Management, Points Management, Product Management, Order Management  
**Technology Stack**: Python 3.10+, FastAPI, SQLAlchemy, MySQL 8.0, AWS Cognito

## Development Strategy

### Vertical Slice Approach
1. **Phase 1**: Foundation - Project structure and database setup
2. **Phase 2**: Slice 1 - View Products (simplest read operation)
3. **Phase 3**: Slice 2 - User Authentication (foundation for all features)
4. **Phase 4**: Slice 3 - Redeem Product (core business value)
5. **Phase 5**: Remaining Features - Complete all user stories

### Key Principles
- ✅ Start simple, add complexity incrementally
- ✅ One feature working end-to-end before moving to next
- ✅ Minimal code that actually works
- ✅ Test each slice before proceeding
- ✅ Database migrations for each phase

---

## Code Generation Steps

### Phase 1: Project Foundation

#### Step 1: Create Project Structure
- [ ] Create root directory structure
- [ ] Create `app/` directory for application code
- [ ] Create `tests/` directory for test code
- [ ] Create `alembic/` directory for database migrations
- [ ] Create configuration files (requirements.txt, .env.example, .gitignore)

#### Step 2: Setup FastAPI Application
- [ ] Create `app/main.py` - FastAPI application entry point
- [ ] Create `app/config.py` - Configuration management with environment variables
- [ ] Create `app/database.py` - Database connection and session management
- [ ] Add basic error handling middleware
- [ ] Add CORS middleware for frontend integration

#### Step 3: Setup Database Models Foundation
- [ ] Create `app/models/__init__.py` - Models package initialization
- [ ] Create `app/models/base.py` - SQLAlchemy base model with common fields
- [ ] Setup Alembic for database migrations
- [ ] Create initial migration script

#### Step 4: Create Local Development Setup Documentation
- [ ] Create `README.md` - Project overview and setup instructions
- [ ] Create `docs/local-setup.md` - Detailed local development guide
- [ ] Create `docs/database-setup.md` - MySQL setup with Docker
- [ ] Create `docs/cognito-setup.md` - AWS Cognito configuration guide

---

### Phase 2: Vertical Slice 1 - View Products (US-005, US-006)

#### Step 5: Create Product Domain Model
- [ ] Create `app/models/product.py` - Product entity with SQLAlchemy ORM
- [ ] Define Product table schema (id, name, description, category, points_cost, image_url, inventory_count, is_active, timestamps)
- [ ] Create Alembic migration for products table
- [ ] Add database indexes for performance

#### Step 6: Create Product Repository Layer
- [ ] Create `app/repositories/__init__.py` - Repository package
- [ ] Create `app/repositories/product_repository.py` - Product data access layer
- [ ] Implement `get_all_products()` method
- [ ] Implement `get_product_by_id()` method
- [ ] Implement filtering and sorting logic

#### Step 7: Create Product API Endpoints
- [ ] Create `app/api/__init__.py` - API package
- [ ] Create `app/api/products.py` - Product endpoints router
- [ ] Implement `GET /api/products` - List all products
- [ ] Implement `GET /api/products/{product_id}` - Get product details
- [ ] Add request/response schemas with Pydantic

#### Step 8: Create Product Unit Tests
- [ ] Create `tests/test_products.py` - Product endpoint tests
- [ ] Test product listing endpoint
- [ ] Test product details endpoint
- [ ] Test filtering and sorting
- [ ] Test error scenarios (product not found)

#### Step 9: Create Test Data Scripts
- [ ] Create `scripts/seed_products.py` - Sample product data
- [ ] Add 10-15 sample products for testing
- [ ] Include various categories and price points

---

### Phase 3: Vertical Slice 2 - User Authentication (US-001, US-002)

#### Step 10: Create User Domain Model
- [ ] Create `app/models/user.py` - User entity with Cognito integration
- [ ] Define User table schema (user_id, cognito_username, email, full_name, employee_id, is_active, timestamps)
- [ ] Create Alembic migration for users table

#### Step 11: Setup AWS Cognito Integration
- [ ] Create `app/services/__init__.py` - Services package
- [ ] Create `app/services/cognito_service.py` - Cognito authentication service
- [ ] Implement JWT token validation
- [ ] Implement user info retrieval from Cognito
- [ ] Add Cognito configuration to config.py

#### Step 12: Create Authentication Middleware
- [ ] Create `app/middleware/__init__.py` - Middleware package
- [ ] Create `app/middleware/auth.py` - JWT authentication middleware
- [ ] Implement token extraction from Authorization header
- [ ] Implement token validation with Cognito
- [ ] Add user context to request state

#### Step 13: Create User Repository Layer
- [ ] Create `app/repositories/user_repository.py` - User data access layer
- [ ] Implement `get_user_by_id()` method
- [ ] Implement `get_user_by_cognito_username()` method
- [ ] Implement `create_or_update_user()` method

#### Step 14: Create Authentication API Endpoints
- [ ] Create `app/api/auth.py` - Authentication endpoints router
- [ ] Implement `POST /api/auth/login` - Login endpoint (delegates to Cognito)
- [ ] Implement `GET /api/auth/me` - Get current user info
- [ ] Add authentication to existing product endpoints

#### Step 15: Create Authentication Unit Tests
- [ ] Create `tests/test_auth.py` - Authentication tests
- [ ] Test login endpoint
- [ ] Test user info endpoint
- [ ] Test JWT token validation
- [ ] Test authentication middleware

---

### Phase 4: Vertical Slice 3 - Redeem Product (US-007, US-003, US-008)

#### Step 16: Create Points Domain Model
- [ ] Create `app/models/points.py` - Points transaction entity
- [ ] Define Points table schema (transaction_id, user_id, order_id, transaction_type, amount, description, created_at, created_by)
- [ ] Create Alembic migration for points table
- [ ] Add foreign key constraints

#### Step 17: Create Order Domain Models
- [ ] Create `app/models/order.py` - Order entity
- [ ] Define Order table schema (order_id, user_id, product_id, product_name, product_description, points_deducted, status, created_at, delivered_at)
- [ ] Create `app/models/order_item.py` - OrderItem entity
- [ ] Create Alembic migration for orders and order_items tables

#### Step 18: Create Points Repository Layer
- [ ] Create `app/repositories/points_repository.py` - Points data access layer
- [ ] Implement `get_user_balance()` method
- [ ] Implement `get_user_transactions()` method
- [ ] Implement `create_transaction()` method
- [ ] Implement balance calculation logic

#### Step 19: Create Order Repository Layer
- [ ] Create `app/repositories/order_repository.py` - Order data access layer
- [ ] Implement `create_order()` method
- [ ] Implement `get_user_orders()` method
- [ ] Implement `get_order_by_id()` method

#### Step 20: Create Redemption Service (Business Logic)
- [ ] Create `app/services/redemption_service.py` - Redemption orchestration
- [ ] Implement `redeem_product()` method with transaction management
- [ ] Implement points sufficiency validation
- [ ] Implement product availability validation
- [ ] Implement atomic points deduction and order creation
- [ ] Implement rollback logic for failures

#### Step 21: Create Points API Endpoints
- [ ] Create `app/api/points.py` - Points endpoints router
- [ ] Implement `GET /api/points/balance` - Get current balance
- [ ] Implement `GET /api/points/transactions` - Get transaction history
- [ ] Add authentication requirement

#### Step 22: Create Order API Endpoints
- [ ] Create `app/api/orders.py` - Order endpoints router
- [ ] Implement `POST /api/orders/redeem` - Redeem product
- [ ] Implement `GET /api/orders` - Get order history
- [ ] Implement `GET /api/orders/{order_id}` - Get order details
- [ ] Add authentication requirement

#### Step 23: Create Redemption Unit Tests
- [ ] Create `tests/test_redemption.py` - Redemption flow tests
- [ ] Test successful redemption flow
- [ ] Test insufficient points scenario
- [ ] Test product unavailable scenario
- [ ] Test transaction rollback
- [ ] Test concurrent redemption handling

#### Step 24: Create Points Unit Tests
- [ ] Create `tests/test_points.py` - Points management tests
- [ ] Test balance calculation
- [ ] Test transaction history
- [ ] Test transaction creation

#### Step 25: Create Order Unit Tests
- [ ] Create `tests/test_orders.py` - Order management tests
- [ ] Test order creation
- [ ] Test order history retrieval
- [ ] Test order details retrieval

---

### Phase 5: Remaining Features and Polish

#### Step 26: Create User Profile Endpoints (US-002)
- [ ] Add `GET /api/users/profile` - Get user profile
- [ ] Add user profile response schema
- [ ] Create unit tests for profile endpoint

#### Step 27: Add Points Transaction History Details (US-004)
- [ ] Enhance transaction history endpoint with filtering
- [ ] Add pagination support
- [ ] Add date range filtering
- [ ] Create unit tests for enhanced features

#### Step 28: Add Product Search and Filtering (US-005 enhancement)
- [ ] Add text search to product listing
- [ ] Add category filtering
- [ ] Add points range filtering
- [ ] Add sorting options
- [ ] Create unit tests for search features

#### Step 29: Create API Documentation
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Add endpoint descriptions and examples
- [ ] Document authentication requirements
- [ ] Document error responses

#### Step 30: Create Postman Collection
- [ ] Create `postman/awsomeshop-core-business.json`
- [ ] Add all API endpoints
- [ ] Add authentication examples
- [ ] Add test data examples
- [ ] Add environment variables

#### Step 31: Create Database Seed Script
- [ ] Create `scripts/seed_database.py` - Complete test data
- [ ] Add sample users
- [ ] Add sample products
- [ ] Add sample points transactions
- [ ] Add sample orders

#### Step 32: Add Error Handling and Validation
- [ ] Create `app/exceptions.py` - Custom exception classes
- [ ] Add global exception handler
- [ ] Add request validation
- [ ] Add business rule validation
- [ ] Create error response schemas

#### Step 33: Add Logging and Monitoring
- [ ] Setup structured logging with Python logging
- [ ] Add request/response logging
- [ ] Add business event logging
- [ ] Add error logging
- [ ] Create logging configuration

#### Step 34: Create Integration Tests
- [ ] Create `tests/integration/test_redemption_flow.py`
- [ ] Test complete redemption workflow end-to-end
- [ ] Test authentication + redemption flow
- [ ] Test error scenarios across components

#### Step 35: Performance Optimization
- [ ] Add database connection pooling
- [ ] Add query optimization (indexes, eager loading)
- [ ] Add response caching headers
- [ ] Verify response time requirements (<5 seconds)

#### Step 36: Security Hardening
- [ ] Add input sanitization
- [ ] Add SQL injection prevention
- [ ] Add rate limiting
- [ ] Add security headers
- [ ] Review and test authentication flow

#### Step 37: Create Deployment Documentation
- [ ] Create `docs/deployment.md` - Deployment guide
- [ ] Document environment variables
- [ ] Document database migration process
- [ ] Document Cognito setup requirements

#### Step 38: Final Testing and Validation
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Verify all user stories implemented
- [ ] Verify all acceptance criteria met
- [ ] Performance testing with load simulation

---

## Story Traceability

### User Stories Implemented

| Story ID | Story Title | Implementation Steps | Status |
|----------|-------------|---------------------|--------|
| US-001 | User Login | Steps 10-15 | [ ] |
| US-002 | View Personal Info | Step 26 | [ ] |
| US-003 | View Points Balance | Steps 16-18, 21 | [ ] |
| US-004 | View Points History | Step 27 | [ ] |
| US-005 | Browse Products | Steps 5-9, 28 | [ ] |
| US-006 | View Product Details | Steps 5-9 | [ ] |
| US-007 | Redeem Product | Steps 16-25 | [ ] |
| US-008 | View Order History | Steps 16-25 | [ ] |

---

## Dependencies and Prerequisites

### External Dependencies
- AWS Cognito User Pool (must be created before Step 11)
- MySQL 8.0 database (local or RDS)
- Python 3.10+ environment

### Internal Dependencies
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 1 completion (can run parallel with Phase 2)
- Phase 4 depends on Phase 2 and Phase 3 completion
- Phase 5 depends on Phase 4 completion

---

## Estimated Effort

| Phase | Steps | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Foundation | Steps 1-4 | 8 hours |
| Phase 2: Products | Steps 5-9 | 16 hours |
| Phase 3: Authentication | Steps 10-15 | 20 hours |
| Phase 4: Redemption | Steps 16-25 | 32 hours |
| Phase 5: Polish | Steps 26-38 | 24 hours |
| **Total** | **38 steps** | **100 hours** |

---

## Testing Strategy

### Unit Testing
- Test each repository method independently
- Test each API endpoint independently
- Test business logic in services
- Target: 80%+ code coverage

### Integration Testing
- Test complete user workflows
- Test database transactions
- Test authentication flow
- Test error handling

### Manual Testing
- Use Postman collection for API testing
- Test with local MySQL database
- Test with AWS Cognito integration
- Verify all acceptance criteria

---

## Success Criteria

### Functional Completeness
- ✅ All 8 user stories implemented
- ✅ All acceptance criteria met
- ✅ All API endpoints working
- ✅ Authentication integrated with Cognito

### Quality Standards
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Code coverage > 80%
- ✅ No critical security vulnerabilities

### Performance Standards
- ✅ API response time < 5 seconds
- ✅ Authentication < 2 seconds
- ✅ Product listing < 3 seconds
- ✅ Redemption < 5 seconds

### Documentation Standards
- ✅ API documentation complete
- ✅ Setup guide complete
- ✅ Postman collection available
- ✅ Code comments for complex logic

---

## Next Steps After Code Generation

1. **Local Testing**: Test all features with Postman
2. **Code Review**: Review generated code for quality
3. **Integration Testing**: Test complete workflows
4. **Build & Test Phase**: Execute comprehensive testing
5. **CDK Infrastructure**: Generate infrastructure code (separate phase)

---

## Notes

- This plan focuses on **application code only** - no CDK infrastructure code
- All testing will be done locally with Docker MySQL and AWS Cognito
- CDK infrastructure generation will be a separate phase after application code is complete
- Vertical slice approach ensures working features at each milestone
- Each phase delivers testable, demonstrable functionality
