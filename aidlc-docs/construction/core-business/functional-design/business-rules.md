# Unit 1: Core Business - Business Rules

## Authentication and Authorization Rules

### User Authentication Rules
```python
class AuthenticationRules:
    """Business rules for user authentication and session management"""
    
    @staticmethod
    def validate_login_request(username: str, password: str) -> List[str]:
        """Validate login request format"""
        errors = []
        if not username or not username.strip():
            errors.append("Username is required")
        if not password or len(password) < 1:
            errors.append("Password is required")
        return errors
    
    @staticmethod
    def validate_jwt_token(token: str) -> bool:
        """Validate JWT token format and structure"""
        if not token or not token.strip():
            return False
        # JWT token should have 3 parts separated by dots
        parts = token.split('.')
        return len(parts) == 3
    
    @staticmethod
    def is_session_valid(token_expiry: datetime) -> bool:
        """Check if session is still valid"""
        return datetime.utcnow() < token_expiry
```

### Session Management Rules
```python
class SessionRules:
    """Business rules for session lifecycle management"""
    
    # Session timeout configuration
    DEFAULT_SESSION_TIMEOUT_HOURS = 8
    MAX_SESSION_TIMEOUT_HOURS = 24
    
    @staticmethod
    def calculate_session_expiry(login_time: datetime) -> datetime:
        """Calculate when session should expire"""
        return login_time + timedelta(hours=SessionRules.DEFAULT_SESSION_TIMEOUT_HOURS)
    
    @staticmethod
    def should_refresh_token(current_time: datetime, token_expiry: datetime) -> bool:
        """Determine if token should be refreshed"""
        # Refresh if token expires within 1 hour
        refresh_threshold = token_expiry - timedelta(hours=1)
        return current_time >= refresh_threshold
```

## Points Management Rules

### Points Balance Rules
```python
class PointsBalanceRules:
    """Business rules for points balance management"""
    
    # Points constraints
    MIN_POINTS_BALANCE = 0
    MAX_POINTS_BALANCE = 1000000  # 1 million points maximum
    
    @staticmethod
    def validate_points_amount(amount: int) -> List[str]:
        """Validate points amount for transactions"""
        errors = []
        if not isinstance(amount, int):
            errors.append("Points amount must be an integer")
        if amount <= 0:
            errors.append("Points amount must be positive")
        if amount > PointsBalanceRules.MAX_POINTS_BALANCE:
            errors.append(f"Points amount cannot exceed {PointsBalanceRules.MAX_POINTS_BALANCE}")
        return errors
    
    @staticmethod
    def can_deduct_points(current_balance: int, deduction_amount: int) -> bool:
        """Check if points can be deducted without going negative"""
        return current_balance >= deduction_amount
    
    @staticmethod
    def calculate_new_balance(current_balance: int, transaction_amount: int, transaction_type: str) -> int:
        """Calculate new balance after transaction"""
        if transaction_type == 'CREDIT':
            new_balance = current_balance + transaction_amount
        elif transaction_type == 'DEBIT':
            new_balance = current_balance - transaction_amount
        else:
            raise ValueError(f"Invalid transaction type: {transaction_type}")
        
        if new_balance < PointsBalanceRules.MIN_POINTS_BALANCE:
            raise ValueError("Transaction would result in negative balance")
        
        return new_balance
```

### Points Transaction Rules
```python
class PointsTransactionRules:
    """Business rules for points transactions"""
    
    # Transaction types
    VALID_TRANSACTION_TYPES = ['CREDIT', 'DEBIT']
    
    # Transaction limits
    MAX_SINGLE_TRANSACTION = 100000  # 100k points per transaction
    
    @staticmethod
    def validate_transaction(user_id: str, amount: int, transaction_type: str, description: str) -> List[str]:
        """Validate points transaction business rules"""
        errors = []
        
        if not user_id or not user_id.strip():
            errors.append("User ID is required")
        
        if transaction_type not in PointsTransactionRules.VALID_TRANSACTION_TYPES:
            errors.append(f"Transaction type must be one of: {PointsTransactionRules.VALID_TRANSACTION_TYPES}")
        
        if amount > PointsTransactionRules.MAX_SINGLE_TRANSACTION:
            errors.append(f"Single transaction cannot exceed {PointsTransactionRules.MAX_SINGLE_TRANSACTION} points")
        
        if not description or not description.strip():
            errors.append("Transaction description is required")
        
        return errors
    
    @staticmethod
    def generate_transaction_description(transaction_type: str, context: str = None) -> str:
        """Generate standardized transaction descriptions"""
        if transaction_type == 'DEBIT' and context:
            return f"Product redemption: {context}"
        elif transaction_type == 'CREDIT' and context:
            return f"Points allocation: {context}"
        elif transaction_type == 'CREDIT':
            return "Points credit"
        else:
            return "Points debit"
```

## Product Management Rules

### Product Availability Rules
```python
class ProductAvailabilityRules:
    """Business rules for product availability and catalog management"""
    
    @staticmethod
    def is_product_available_for_redemption(product: Product) -> bool:
        """Check if product is available for redemption"""
        # Product must be active
        if not product.is_active:
            return False
        
        # Check inventory if tracking is enabled
        if product.inventory_count is not None:
            return product.inventory_count > 0
        
        # If no inventory tracking, product is available
        return True
    
    @staticmethod
    def validate_product_data(name: str, description: str, category: str, points_cost: int) -> List[str]:
        """Validate product data for creation/update"""
        errors = []
        
        if not name or not name.strip():
            errors.append("Product name is required")
        elif len(name.strip()) > 200:
            errors.append("Product name cannot exceed 200 characters")
        
        if description and len(description) > 2000:
            errors.append("Product description cannot exceed 2000 characters")
        
        if not category or not category.strip():
            errors.append("Product category is required")
        elif len(category.strip()) > 100:
            errors.append("Product category cannot exceed 100 characters")
        
        if not isinstance(points_cost, int) or points_cost <= 0:
            errors.append("Points cost must be a positive integer")
        elif points_cost > 100000:
            errors.append("Points cost cannot exceed 100,000 points")
        
        return errors
```

### Product Category Rules
```python
class ProductCategoryRules:
    """Business rules for product categorization"""
    
    # Predefined categories (single-level)
    VALID_CATEGORIES = [
        'Electronics',
        'Office Supplies',
        'Gift Cards',
        'Apparel',
        'Books',
        'Health & Wellness',
        'Food & Beverages',
        'Travel',
        'Entertainment',
        'Home & Garden'
    ]
    
    @staticmethod
    def is_valid_category(category: str) -> bool:
        """Check if category is valid"""
        return category in ProductCategoryRules.VALID_CATEGORIES
    
    @staticmethod
    def get_category_display_name(category: str) -> str:
        """Get display name for category"""
        return category if category in ProductCategoryRules.VALID_CATEGORIES else "Unknown"
```

## Redemption Workflow Rules

### Redemption Eligibility Rules
```python
class RedemptionEligibilityRules:
    """Business rules for product redemption eligibility"""
    
    @staticmethod
    def can_user_redeem_product(user: User, product: Product, user_balance: int) -> Tuple[bool, List[str]]:
        """Check if user can redeem a specific product"""
        errors = []
        
        # User must be active
        if not user.is_active:
            errors.append("User account is not active")
        
        # Product must be available
        if not ProductAvailabilityRules.is_product_available_for_redemption(product):
            errors.append("Product is not available for redemption")
        
        # User must have sufficient points
        if user_balance < product.points_cost:
            errors.append(f"Insufficient points. Required: {product.points_cost}, Available: {user_balance}")
        
        # No additional eligibility restrictions in MVP
        # Future: department restrictions, tenure requirements, etc.
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_redemption_request(user_id: str, product_id: str) -> List[str]:
        """Validate redemption request format"""
        errors = []
        
        if not user_id or not user_id.strip():
            errors.append("User ID is required")
        
        if not product_id or not product_id.strip():
            errors.append("Product ID is required")
        
        return errors
```

### Redemption Process Rules
```python
class RedemptionProcessRules:
    """Business rules for redemption process execution"""
    
    @staticmethod
    def create_redemption_order(user: User, product: Product) -> Order:
        """Create order for redemption following business rules"""
        order = Order(
            order_id=str(uuid.uuid4()),
            user_id=user.user_id,
            product_id=product.product_id,
            product_name=product.name,
            product_description=product.description,
            points_deducted=product.points_cost,
            status='DELIVERED',  # Immediate delivery in MVP
            created_at=datetime.utcnow(),
            delivered_at=datetime.utcnow()  # Same as created_at for immediate delivery
        )
        return order
    
    @staticmethod
    def should_rollback_redemption(error_type: str) -> bool:
        """Determine if redemption should be rolled back based on error"""
        # Always rollback if points were deducted but order creation failed
        rollback_errors = [
            'ORDER_CREATION_FAILED',
            'DATABASE_ERROR',
            'SYSTEM_ERROR'
        ]
        return error_type in rollback_errors
```

## Order Management Rules

### Order Status Rules
```python
class OrderStatusRules:
    """Business rules for order status management"""
    
    # Valid order statuses
    VALID_STATUSES = ['DELIVERED', 'FAILED']
    DEFAULT_STATUS = 'DELIVERED'
    
    @staticmethod
    def is_valid_status(status: str) -> bool:
        """Check if order status is valid"""
        return status in OrderStatusRules.VALID_STATUSES
    
    @staticmethod
    def can_transition_status(current_status: str, new_status: str) -> bool:
        """Check if status transition is allowed"""
        # In MVP, orders are created as DELIVERED or FAILED
        # No status transitions after creation
        return current_status == new_status
    
    @staticmethod
    def get_final_status_for_successful_redemption() -> str:
        """Get status for successful redemption"""
        return 'DELIVERED'
    
    @staticmethod
    def get_final_status_for_failed_redemption() -> str:
        """Get status for failed redemption"""
        return 'FAILED'
```

### Order History Rules
```python
class OrderHistoryRules:
    """Business rules for order history access and display"""
    
    # Pagination settings
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    @staticmethod
    def can_user_access_order(user_id: str, order: Order) -> bool:
        """Check if user can access specific order"""
        return order.user_id == user_id
    
    @staticmethod
    def validate_history_request(user_id: str, page_size: int = None, page_number: int = None) -> List[str]:
        """Validate order history request parameters"""
        errors = []
        
        if not user_id or not user_id.strip():
            errors.append("User ID is required")
        
        if page_size is not None:
            if page_size <= 0:
                errors.append("Page size must be positive")
            elif page_size > OrderHistoryRules.MAX_PAGE_SIZE:
                errors.append(f"Page size cannot exceed {OrderHistoryRules.MAX_PAGE_SIZE}")
        
        if page_number is not None and page_number < 1:
            errors.append("Page number must be 1 or greater")
        
        return errors
```

## Data Validation Rules

### Input Validation Rules
```python
class InputValidationRules:
    """Business rules for API input validation"""
    
    @staticmethod
    def validate_user_id(user_id: str) -> List[str]:
        """Validate user ID format"""
        errors = []
        if not user_id or not user_id.strip():
            errors.append("User ID is required")
        elif len(user_id.strip()) > 50:
            errors.append("User ID cannot exceed 50 characters")
        return errors
    
    @staticmethod
    def validate_product_id(product_id: str) -> List[str]:
        """Validate product ID format"""
        errors = []
        if not product_id or not product_id.strip():
            errors.append("Product ID is required")
        elif len(product_id.strip()) > 50:
            errors.append("Product ID cannot exceed 50 characters")
        return errors
    
    @staticmethod
    def sanitize_text_input(text: str) -> str:
        """Sanitize text input for security"""
        if not text:
            return ""
        # Remove potentially dangerous characters
        sanitized = text.strip()
        # Additional sanitization can be added here
        return sanitized
```

### Business Logic Validation Rules
```python
class BusinessLogicValidationRules:
    """Cross-entity business logic validation rules"""
    
    @staticmethod
    def validate_complete_redemption_flow(user: User, product: Product, user_balance: int) -> List[str]:
        """Validate entire redemption flow business rules"""
        errors = []
        
        # User validation
        if not user.is_active:
            errors.append("User account is inactive")
        
        # Product validation
        if not product.is_active:
            errors.append("Product is inactive")
        
        # Points validation
        if user_balance < product.points_cost:
            errors.append(f"Insufficient points: need {product.points_cost}, have {user_balance}")
        
        # Availability validation
        if not ProductAvailabilityRules.is_product_available_for_redemption(product):
            errors.append("Product is not available")
        
        return errors
    
    @staticmethod
    def validate_points_transaction_consistency(transaction: Points, user_balance_before: int) -> List[str]:
        """Validate points transaction maintains data consistency"""
        errors = []
        
        if transaction.transaction_type == 'DEBIT':
            if user_balance_before < transaction.amount:
                errors.append("Transaction would create negative balance")
        
        if transaction.amount <= 0:
            errors.append("Transaction amount must be positive")
        
        return errors
```

## Error Handling Rules

### Error Recovery Rules
```python
class ErrorRecoveryRules:
    """Business rules for error handling and recovery"""
    
    @staticmethod
    def should_retry_operation(error_type: str, attempt_count: int) -> bool:
        """Determine if operation should be retried"""
        max_retries = 3
        retryable_errors = [
            'DATABASE_TIMEOUT',
            'NETWORK_ERROR',
            'TEMPORARY_SERVICE_UNAVAILABLE'
        ]
        return error_type in retryable_errors and attempt_count < max_retries
    
    @staticmethod
    def create_compensation_transaction(failed_order: Order) -> Points:
        """Create compensating transaction for failed redemption"""
        return Points(
            transaction_id=str(uuid.uuid4()),
            user_id=failed_order.user_id,
            order_id=failed_order.order_id,
            transaction_type='CREDIT',
            amount=failed_order.points_deducted,
            description=f"Refund for failed order {failed_order.order_id}",
            created_at=datetime.utcnow(),
            created_by='SYSTEM'
        )
```

### Audit and Logging Rules
```python
class AuditRules:
    """Business rules for audit trail and logging"""
    
    # Auditable events
    AUDITABLE_EVENTS = [
        'USER_LOGIN',
        'USER_LOGOUT',
        'POINTS_BALANCE_QUERY',
        'PRODUCT_REDEMPTION',
        'ORDER_CREATION',
        'POINTS_TRANSACTION',
        'SYSTEM_ERROR'
    ]
    
    @staticmethod
    def should_audit_event(event_type: str) -> bool:
        """Determine if event should be audited"""
        return event_type in AuditRules.AUDITABLE_EVENTS
    
    @staticmethod
    def create_audit_entry(user_id: str, event_type: str, details: dict) -> dict:
        """Create standardized audit entry"""
        return {
            'user_id': user_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details,
            'who': user_id,
            'what': event_type,
            'when': datetime.utcnow().isoformat()
        }
```

## Performance and Constraints Rules

### Performance Rules
```python
class PerformanceRules:
    """Business rules for performance requirements"""
    
    # Response time targets (in seconds)
    MAX_RESPONSE_TIME_SECONDS = 5
    TARGET_RESPONSE_TIME_SECONDS = 2
    
    # Query limits
    MAX_HISTORY_RECORDS = 1000
    DEFAULT_HISTORY_LIMIT = 50
    
    @staticmethod
    def should_paginate_results(record_count: int) -> bool:
        """Determine if results should be paginated"""
        return record_count > PerformanceRules.DEFAULT_HISTORY_LIMIT
    
    @staticmethod
    def calculate_pagination_params(total_records: int, page_size: int) -> dict:
        """Calculate pagination parameters"""
        total_pages = (total_records + page_size - 1) // page_size
        return {
            'total_records': total_records,
            'total_pages': total_pages,
            'page_size': page_size
        }
```

### System Constraints Rules
```python
class SystemConstraintsRules:
    """Business rules for system-wide constraints"""
    
    # Concurrency assumptions
    SINGLE_USER_SESSION_ASSUMPTION = True
    
    # Data limits
    MAX_PRODUCT_NAME_LENGTH = 200
    MAX_PRODUCT_DESCRIPTION_LENGTH = 2000
    MAX_USER_FULL_NAME_LENGTH = 100
    
    @staticmethod
    def validate_system_constraints(operation: str, data: dict) -> List[str]:
        """Validate operation against system constraints"""
        errors = []
        
        if operation == 'CREATE_PRODUCT':
            if len(data.get('name', '')) > SystemConstraintsRules.MAX_PRODUCT_NAME_LENGTH:
                errors.append(f"Product name exceeds {SystemConstraintsRules.MAX_PRODUCT_NAME_LENGTH} characters")
        
        return errors
```