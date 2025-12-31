# Unit 1: Core Business - Domain Entities

## Core Entity Definitions

### User Entity
```python
class User:
    """
    Represents an employee user in the AWSomeShop system.
    Integrates with AWS Cognito for authentication.
    """
    # Primary Key
    user_id: str  # UUID, matches Cognito User Pool user ID
    
    # Profile Information
    cognito_username: str  # Username in Cognito User Pool
    email: str  # Employee email address
    full_name: str  # Employee full name
    employee_id: str  # Company employee identifier
    
    # System Metadata
    created_at: datetime  # Account creation timestamp
    updated_at: datetime  # Last profile update timestamp
    is_active: bool  # Account status flag
    
    # Computed Properties (not stored)
    @property
    def current_points_balance(self) -> int:
        """Calculate current points balance from transaction history"""
        pass
```

### Points Entity
```python
class Points:
    """
    Represents a points transaction record.
    Immutable audit trail of all points movements.
    """
    # Primary Key
    transaction_id: str  # UUID for transaction
    
    # Foreign Keys
    user_id: str  # Reference to User entity
    order_id: str  # Reference to Order entity (nullable for admin adjustments)
    
    # Transaction Details
    transaction_type: str  # 'CREDIT' or 'DEBIT'
    amount: int  # Points amount (positive integer)
    description: str  # Transaction description
    
    # Metadata
    created_at: datetime  # Transaction timestamp
    created_by: str  # User or admin who initiated transaction
    
    # Business Rules
    def validate_amount(self) -> bool:
        """Ensure amount is positive integer"""
        return self.amount > 0 and isinstance(self.amount, int)
```

### Product Entity
```python
class Product:
    """
    Represents a product available for redemption.
    Master data managed by administrators.
    """
    # Primary Key
    product_id: str  # UUID for product
    
    # Product Information
    name: str  # Product name
    description: str  # Detailed product description
    category: str  # Single-level category
    points_cost: int  # Points required for redemption
    
    # Product Media
    image_url: str  # Product image URL (nullable)
    
    # Inventory (optional)
    inventory_count: int  # Available quantity (nullable, -1 for unlimited)
    
    # Status
    is_active: bool  # Product availability flag
    
    # Metadata
    created_at: datetime  # Product creation timestamp
    updated_at: datetime  # Last update timestamp
    created_by: str  # Admin who created product
    
    # Business Methods
    def is_available(self) -> bool:
        """Check if product is available for redemption"""
        return self.is_active and (self.inventory_count is None or self.inventory_count > 0)
    
    def validate_points_cost(self) -> bool:
        """Ensure points cost is positive integer"""
        return self.points_cost > 0 and isinstance(self.points_cost, int)
```

### Order Entity
```python
class Order:
    """
    Represents a product redemption order.
    Simplified order model with immediate delivery status.
    """
    # Primary Key
    order_id: str  # UUID for order
    
    # Foreign Keys
    user_id: str  # Reference to User entity
    product_id: str  # Reference to Product entity
    
    # Order Details
    product_name: str  # Product name snapshot
    product_description: str  # Product description snapshot
    points_deducted: int  # Points used for redemption
    
    # Order Status
    status: str  # 'DELIVERED' or 'FAILED'
    
    # Metadata
    created_at: datetime  # Order creation timestamp
    delivered_at: datetime  # Delivery timestamp (same as created_at for immediate delivery)
    
    # Business Methods
    def mark_as_delivered(self):
        """Mark order as delivered immediately"""
        self.status = 'DELIVERED'
        self.delivered_at = datetime.utcnow()
    
    def mark_as_failed(self):
        """Mark order as failed for rollback scenarios"""
        self.status = 'FAILED'
```

### OrderItem Entity
```python
class OrderItem:
    """
    Represents individual items in an order.
    Simplified for single-item orders in MVP.
    """
    # Primary Key
    order_item_id: str  # UUID for order item
    
    # Foreign Keys
    order_id: str  # Reference to Order entity
    product_id: str  # Reference to Product entity
    
    # Item Details
    quantity: int  # Always 1 for MVP (single-item redemption)
    unit_points_cost: int  # Points cost per unit
    total_points_cost: int  # Total points for this item
    
    # Product Snapshot
    product_name: str  # Product name at time of order
    product_category: str  # Product category at time of order
    
    # Metadata
    created_at: datetime  # Item creation timestamp
```

## Value Objects

### PointsBalance Value Object
```python
class PointsBalance:
    """
    Immutable value object representing a user's points balance.
    """
    def __init__(self, user_id: str, balance: int, last_updated: datetime):
        self._user_id = user_id
        self._balance = balance
        self._last_updated = last_updated
    
    @property
    def user_id(self) -> str:
        return self._user_id
    
    @property
    def balance(self) -> int:
        return self._balance
    
    @property
    def last_updated(self) -> datetime:
        return self._last_updated
    
    def has_sufficient_points(self, required_points: int) -> bool:
        """Check if balance is sufficient for a transaction"""
        return self._balance >= required_points
    
    def __str__(self) -> str:
        return f"PointsBalance(user_id={self._user_id}, balance={self._balance})"
```

### ProductPrice Value Object
```python
class ProductPrice:
    """
    Immutable value object representing product pricing.
    """
    def __init__(self, points_cost: int):
        if points_cost <= 0:
            raise ValueError("Points cost must be positive")
        self._points_cost = points_cost
    
    @property
    def points_cost(self) -> int:
        return self._points_cost
    
    def can_afford(self, user_balance: int) -> bool:
        """Check if user can afford this product"""
        return user_balance >= self._points_cost
    
    def __str__(self) -> str:
        return f"{self._points_cost} points"
```

### OrderStatus Value Object
```python
class OrderStatus:
    """
    Immutable value object representing order status.
    """
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    
    def __init__(self, status: str):
        if status not in [self.DELIVERED, self.FAILED]:
            raise ValueError(f"Invalid order status: {status}")
        self._status = status
    
    @property
    def status(self) -> str:
        return self._status
    
    def is_delivered(self) -> bool:
        return self._status == self.DELIVERED
    
    def is_failed(self) -> bool:
        return self._status == self.FAILED
    
    def __str__(self) -> str:
        return self._status
```

## Aggregates and Aggregate Roots

### User Aggregate
```python
class UserAggregate:
    """
    User aggregate root managing user profile and points balance.
    Ensures consistency of user-related operations.
    """
    def __init__(self, user: User):
        self._user = user
        self._points_transactions = []
    
    @property
    def user(self) -> User:
        return self._user
    
    def calculate_points_balance(self) -> PointsBalance:
        """Calculate current points balance from transaction history"""
        total_credits = sum(t.amount for t in self._points_transactions if t.transaction_type == 'CREDIT')
        total_debits = sum(t.amount for t in self._points_transactions if t.transaction_type == 'DEBIT')
        balance = total_credits - total_debits
        
        return PointsBalance(
            user_id=self._user.user_id,
            balance=balance,
            last_updated=datetime.utcnow()
        )
    
    def can_redeem_product(self, product: Product) -> bool:
        """Check if user can redeem a specific product"""
        balance = self.calculate_points_balance()
        return balance.has_sufficient_points(product.points_cost) and product.is_available()
```

### Order Aggregate
```python
class OrderAggregate:
    """
    Order aggregate root managing order lifecycle and consistency.
    Ensures atomic redemption operations.
    """
    def __init__(self, order: Order):
        self._order = order
        self._order_items = []
    
    @property
    def order(self) -> Order:
        return self._order
    
    @property
    def order_items(self) -> List[OrderItem]:
        return self._order_items.copy()
    
    def add_item(self, product: Product, quantity: int = 1):
        """Add item to order (MVP: always single item)"""
        if quantity != 1:
            raise ValueError("MVP only supports single-item orders")
        
        order_item = OrderItem(
            order_item_id=str(uuid.uuid4()),
            order_id=self._order.order_id,
            product_id=product.product_id,
            quantity=quantity,
            unit_points_cost=product.points_cost,
            total_points_cost=product.points_cost * quantity,
            product_name=product.name,
            product_category=product.category,
            created_at=datetime.utcnow()
        )
        self._order_items.append(order_item)
    
    def calculate_total_points(self) -> int:
        """Calculate total points for all items in order"""
        return sum(item.total_points_cost for item in self._order_items)
    
    def complete_order(self):
        """Mark order as delivered (immediate delivery)"""
        self._order.mark_as_delivered()
    
    def fail_order(self):
        """Mark order as failed for rollback"""
        self._order.mark_as_failed()
```

## Domain Events

### PointsDeducted Event
```python
class PointsDeductedEvent:
    """
    Domain event fired when points are deducted from user balance.
    """
    def __init__(self, user_id: str, amount: int, order_id: str, timestamp: datetime):
        self.user_id = user_id
        self.amount = amount
        self.order_id = order_id
        self.timestamp = timestamp
        self.event_type = "POINTS_DEDUCTED"
```

### OrderCreated Event
```python
class OrderCreatedEvent:
    """
    Domain event fired when a new order is created.
    """
    def __init__(self, order_id: str, user_id: str, product_id: str, points_cost: int, timestamp: datetime):
        self.order_id = order_id
        self.user_id = user_id
        self.product_id = product_id
        self.points_cost = points_cost
        self.timestamp = timestamp
        self.event_type = "ORDER_CREATED"
```

### ProductRedeemed Event
```python
class ProductRedeemedEvent:
    """
    Domain event fired when a product is successfully redeemed.
    """
    def __init__(self, order_id: str, user_id: str, product_id: str, product_name: str, timestamp: datetime):
        self.order_id = order_id
        self.user_id = user_id
        self.product_id = product_id
        self.product_name = product_name
        self.timestamp = timestamp
        self.event_type = "PRODUCT_REDEEMED"
```

### RedemptionFailed Event
```python
class RedemptionFailedEvent:
    """
    Domain event fired when a redemption fails and needs rollback.
    """
    def __init__(self, order_id: str, user_id: str, product_id: str, reason: str, timestamp: datetime):
        self.order_id = order_id
        self.user_id = user_id
        self.product_id = product_id
        self.reason = reason
        self.timestamp = timestamp
        self.event_type = "REDEMPTION_FAILED"
```

## Entity Relationships

### Relationship Matrix
```
User (1) ←→ (N) Points [user_id]
User (1) ←→ (N) Order [user_id]
Product (1) ←→ (N) Order [product_id]
Product (1) ←→ (N) OrderItem [product_id]
Order (1) ←→ (N) OrderItem [order_id]
Points (N) ←→ (1) Order [order_id] (nullable)
```

### Foreign Key Constraints
```sql
-- Points table foreign keys
ALTER TABLE Points ADD CONSTRAINT FK_Points_User 
    FOREIGN KEY (user_id) REFERENCES Users(user_id);
ALTER TABLE Points ADD CONSTRAINT FK_Points_Order 
    FOREIGN KEY (order_id) REFERENCES Orders(order_id);

-- Orders table foreign keys
ALTER TABLE Orders ADD CONSTRAINT FK_Orders_User 
    FOREIGN KEY (user_id) REFERENCES Users(user_id);
ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Product 
    FOREIGN KEY (product_id) REFERENCES Products(product_id);

-- OrderItems table foreign keys
ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Order 
    FOREIGN KEY (order_id) REFERENCES Orders(order_id);
ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Product 
    FOREIGN KEY (product_id) REFERENCES Products(product_id);
```

### Cardinality Rules
- **User → Points**: One user can have many points transactions (1:N)
- **User → Orders**: One user can have many orders (1:N)
- **Product → Orders**: One product can be in many orders (1:N)
- **Order → OrderItems**: One order can have many items, but MVP limits to 1 item (1:1 in practice)
- **Points → Order**: Points transaction can be linked to one order (N:1, nullable)

## Data Validation Rules

### Entity-Level Validation
```python
# User validation
def validate_user(user: User) -> List[str]:
    errors = []
    if not user.user_id or not user.user_id.strip():
        errors.append("User ID is required")
    if not user.email or "@" not in user.email:
        errors.append("Valid email is required")
    if not user.full_name or not user.full_name.strip():
        errors.append("Full name is required")
    return errors

# Product validation
def validate_product(product: Product) -> List[str]:
    errors = []
    if not product.name or not product.name.strip():
        errors.append("Product name is required")
    if product.points_cost <= 0:
        errors.append("Points cost must be positive")
    if not isinstance(product.points_cost, int):
        errors.append("Points cost must be integer")
    return errors

# Order validation
def validate_order(order: Order) -> List[str]:
    errors = []
    if not order.user_id or not order.user_id.strip():
        errors.append("User ID is required")
    if not order.product_id or not order.product_id.strip():
        errors.append("Product ID is required")
    if order.points_deducted <= 0:
        errors.append("Points deducted must be positive")
    return errors
```

### Cross-Entity Validation
```python
def validate_redemption(user: User, product: Product, user_balance: int) -> List[str]:
    """Validate redemption business rules across entities"""
    errors = []
    
    if not user.is_active:
        errors.append("User account is not active")
    
    if not product.is_active:
        errors.append("Product is not available")
    
    if user_balance < product.points_cost:
        errors.append(f"Insufficient points. Required: {product.points_cost}, Available: {user_balance}")
    
    if product.inventory_count is not None and product.inventory_count <= 0:
        errors.append("Product is out of stock")
    
    return errors
```