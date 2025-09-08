# Copilot Prompts for Crypto Dropship Backend

This file contains detailed prompts to use with GitHub Copilot for implementing various parts of the crypto dropshipping system.

## 🏗️ Server Setup Prompts

### server.js
```
Create an Express.js server with the following features:
- CORS configuration for frontend communication
- Rate limiting for API protection
- Environment variable configuration
- Request logging middleware
- Health check endpoint that shows service status
- Routes for /api/printify, /api/payments, /api/orders, /api/products
- Error handling middleware
- Graceful shutdown handling
- Security headers and input validation
```

### Package Dependencies
```
Install and configure these npm packages for crypto dropshipping:
- express: web framework
- cors: cross-origin requests
- dotenv: environment variables
- @solana/web3.js: Solana blockchain integration
- @solana/pay: Solana Pay protocol
- axios: HTTP client for API calls
- express-rate-limit: API rate limiting
- node-fetch: fetch API for Node.js
- helmet: security headers
- express-validator: input validation
```

## 🖨️ Printify Integration Prompts

### routes/printify.js
```
Create a comprehensive Printify API integration with:
- Axios instance with proper headers and authentication
- Error handling and retry logic for failed requests
- Request/response logging for debugging
- Rate limiting compliance with Printify API limits
- Endpoints for:
  * GET /shops - list all shops
  * GET /catalog/blueprints - available product templates
  * GET /catalog/blueprints/:id/print_providers - printing services
  * GET /catalog/blueprints/:id/print_providers/:id/variants - product variations
  * GET /shops/:id/products - shop products
  * POST /shops/:id/products - create new product
  * GET /shops/:id/orders - order history
  * POST /shops/:id/orders - create new order
  * POST /shops/:id/orders/:id/send_to_production - fulfill order
- Input validation for all endpoints
- Proper error responses with status codes
```

### Printify Product Management
```
Create functions to:
- Fetch product catalog from Printify
- Transform Printify product data for frontend display
- Calculate pricing including margins and fees
- Handle product variants (sizes, colors, etc.)
- Manage product images and mockups
- Sync inventory levels
- Handle product creation workflow
- Map customer selections to Printify variants
```

### Printify Order Management
```
Implement Printify order processing:
- Create orders from payment confirmations
- Map customer data to Printify order format
- Handle shipping address validation
- Process order fulfillment
- Track order status changes
- Handle order cancellations and refunds
- Implement webhook handling for order updates
- Generate tracking information for customers
```

## 💰 Solana Payment Prompts

### routes/payments.js
```
Create Solana Pay integration with:
- Payment request creation with QR code generation
- Blockchain transaction verification
- Payment status tracking and updates
- Integration with order creation workflow
- Support for SOL and SPL token payments
- Webhook handling for payment confirmations
- Payment expiration and timeout handling
- Refund processing for failed orders
- Anti-fraud measures and duplicate prevention
- Real-time payment status updates via WebSocket
```

### Solana Blockchain Integration
```
Implement blockchain functionality:
- Connect to Solana RPC endpoint
- Verify transaction signatures
- Check transaction confirmation status
- Calculate transaction fees
- Handle network congestion and retries
- Validate payment amounts and recipients
- Support for multiple payment tokens
- Address validation and normalization
- Transaction history and audit logging
```

### Payment Security
```
Add payment security measures:
- Input validation for all payment data
- Rate limiting for payment endpoints
- Signature verification for webhooks
- Payment amount validation
- Duplicate transaction prevention
- Fraud detection algorithms
- Secure storage of payment references
- PCI compliance considerations
- Encryption for sensitive data
```

## 📦 Order Management Prompts

### routes/orders.js
```
Create comprehensive order management:
- Order creation from confirmed payments
- Order status tracking and updates
- Integration with Printify order creation
- Customer notification system
- Order history and search functionality
- Refund and cancellation handling
- Shipping address validation
- Order timeline and audit trail
- Bulk order operations
- Order analytics and reporting
```

### Order Workflow Automation
```
Implement automated order processing:
- Payment confirmation → Order creation
- Order creation → Printify fulfillment
- Order fulfillment → Customer notification
- Shipping updates → Status synchronization
- Failed orders → Customer support notification
- Inventory checks before order creation
- Automatic retry logic for failed operations
- Order priority handling
- Bulk processing capabilities
```

## 🛡️ Security & Validation Prompts

### Input Validation
```
Create comprehensive input validation:
- Solana address format validation
- Email address validation
- Phone number validation
- Shipping address validation
- Payment amount validation
- Product ID validation
- Quantity limits and validation
- File upload validation (for custom designs)
- SQL injection prevention
- XSS prevention
```

### Authentication & Authorization
```
Implement secure authentication:
- JWT token generation and validation
- Role-based access control (customer, admin, super-admin)
- API key management for external services
- Session management
- Password hashing and validation
- Two-factor authentication support
- Rate limiting per user/IP
- Audit logging for admin actions
- Secure cookie handling
```

## 📊 Database Integration Prompts

### Database Schema Design
```
Design database schema for:
- Users table (customers, admins)
- Products table (synced from Printify)
- Orders table (order details and status)
- Payments table (blockchain transaction data)
- Inventory table (stock levels and reservations)
- Audit logs table (all system activities)
- Settings table (configuration and feature flags)
- Webhooks table (incoming webhook data)
- Sessions table (user authentication)
```

### Database Operations
```
Create database functions for:
- CRUD operations for all entities
- Transaction handling for order creation
- Bulk operations for inventory sync
- Search and filtering capabilities
- Data migration and seeding scripts
- Backup and restore procedures
- Performance optimization (indexes, queries)
- Connection pooling and error handling
- Soft delete implementation
- Data archiving for old records
```

## 🔗 API Integration Prompts

### External API Management
```
Create robust API integration layer:
- Centralized HTTP client configuration
- Retry logic with exponential backoff
- Circuit breaker pattern for failing services
- Request/response logging and monitoring
- API key rotation and management
- Response caching for performance
- Error classification and handling
- Health checks for external services
- Timeout configuration
- Mock responses for testing
```

### Webhook Management
```
Implement webhook system:
- Webhook signature verification
- Webhook retry logic for failures
- Webhook event queuing and processing
- Webhook endpoint registration
- Webhook payload validation
- Idempotency handling
- Webhook monitoring and alerting
- Rate limiting for webhook endpoints
- Webhook data transformation
- Webhook testing and debugging tools
```

## 🧪 Testing Prompts

### Unit Testing
```
Create comprehensive unit tests:
- Test all API endpoints with various inputs
- Mock external service calls (Printify, Solana)
- Test error handling and edge cases
- Test input validation functions
- Test payment processing logic
- Test order creation workflow
- Test database operations
- Test authentication and authorization
- Test rate limiting functionality
- Test webhook processing
```

### Integration Testing
```
Create integration tests for:
- End-to-end order processing flow
- Payment verification and order creation
- Printify API integration
- Database transactions
- Webhook processing
- External service failover
- Performance under load
- Security vulnerability scanning
- API contract validation
- Cross-service communication
```

## 🚀 Deployment & Monitoring Prompts

### Production Configuration
```
Configure for production deployment:
- Environment-specific configuration
- Database connection pooling
- Redis caching setup
- Load balancing configuration
- SSL/TLS certificate management
- Environment variable management
- Log aggregation and monitoring
- Error tracking and alerting
- Performance monitoring
- Security scanning and updates
```

### Monitoring & Observability
```
Implement monitoring system:
- API response time tracking
- Error rate monitoring
- Payment success rate tracking
- Order fulfillment metrics
- External service availability
- Database performance monitoring
- Memory and CPU usage tracking
- Custom business metrics
- Alert thresholds and notifications
- Dashboard creation for metrics
```

## 💡 Advanced Features Prompts

### Analytics & Reporting
```
Create analytics system:
- Sales revenue tracking
- Popular product analysis
- Customer behavior analytics
- Payment method preferences
- Geographic sales distribution
- Conversion funnel analysis
- Inventory turnover rates
- Customer lifetime value
- Seasonal trend analysis
- Custom report generation
```

### Scalability Features
```
Implement scalability improvements:
- Database read replicas
- Caching layer implementation
- Queue system for background jobs
- Microservices architecture
- CDN integration for static assets
- Database sharding strategies
- Auto-scaling configuration
- Load testing and optimization
- Resource usage optimization
- Performance profiling
```

---

## 🎯 Usage Instructions

1. **Copy the relevant prompt** for the feature you want to implement
2. **Paste it into your IDE** with GitHub Copilot enabled
3. **Add specific context** about your implementation needs
4. **Let Copilot generate** the initial code structure
5. **Iterate and refine** the generated code
6. **Test thoroughly** before deploying

Each prompt is designed to give Copilot enough context to generate production-ready code while maintaining best practices for security, performance, and maintainability.
