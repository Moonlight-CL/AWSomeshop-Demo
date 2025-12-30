# Requirements Verification Questions

Please answer the following questions to help clarify the requirements for AWSomeShop.

## Question 1
What type of application should AWSomeShop be?

A) Web application (browser-based)
B) Mobile application (iOS/Android)
C) Both web and mobile applications
D) Desktop application
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
How should employees authenticate to access AWSomeShop?

A) Username and password
B) Corporate SSO (Single Sign-On)
C) Employee ID and PIN
D) Multi-factor authentication
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
How should employees initially receive their "AWSome积分"?

A) Fixed monthly allocation to all employees
B) Performance-based allocation by managers
C) Manual distribution by administrators only
D) Integration with existing HR/payroll systems
E) Other (please describe after [Answer]: tag below)

[Answer]: 每月每个员工都有固定的allocation，但是管理员也可以手动调整

## Question 4
What types of products should be available for redemption?

A) Physical products (electronics, merchandise)
B) Digital products (gift cards, vouchers)
C) Services (training, experiences)
D) Mix of physical, digital, and services
E) Other (please describe after [Answer]: tag below)

[Answer]: 不需要物流的 B

## Question 5
How should product inventory be managed?

A) Unlimited virtual inventory (no stock limits)
B) Limited inventory with stock tracking
C) Pre-order system (fulfill later)
D) External vendor integration for fulfillment
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 6
What should happen when an employee redeems a product?

A) Automatic deduction of points, email confirmation
B) Admin approval required before point deduction
C) Points reserved until product is shipped/delivered
D) Immediate point deduction with order tracking
E) Other (please describe after [Answer]: tag below)

[Answer]: A，但是用户要能查看自己的历史兑换记录

## Question 7
What technology stack preference do you have?

A) Java/Spring Boot with relational database
B) Node.js/Express with NoSQL database
C) Python/Django with relational database
D) .NET Core with SQL Server
E) Other (please describe after [Answer]: tag below)

[Answer]: E： 后端用python和fastapi，前端用typscript语言，框架用react

## Question 8
What deployment environment is preferred?

A) AWS Cloud services
B) On-premises servers
C) Containerized deployment (Docker/Kubernetes)
D) Serverless architecture (Lambda functions)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
How many concurrent users should the system support initially?

A) 1-50 users (small team)
B) 50-200 users (medium company)
C) 200-1000 users (large company)
D) 1000+ users (enterprise scale)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10
What admin capabilities are needed for managing employee points?

A) Add/subtract points with reason logging
B) Bulk point operations (CSV upload)
C) Point expiration and renewal policies
D) All of the above
E) Other (please describe after [Answer]: tag below)

[Answer]: D