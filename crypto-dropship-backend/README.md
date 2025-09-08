# Crypto Dropship Backend

A Node.js backend API for crypto-enabled dropshipping store with Solana Pay integration.

## Features

- 🔐 **Solana Pay Integration** - Accept SOL and SPL token payments
- 📦 **Product Management** - Handle dropship product catalog
- 🛒 **Order Processing** - Complete order lifecycle management
- 🏪 **Supplier Integration** - Connect with dropship suppliers
- 💰 **Payment Verification** - Blockchain payment confirmation
- 📊 **Real-time Tracking** - Order and shipment tracking

## Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Solana wallet (for merchant account)

### Installation

1. **Clone and install dependencies:**
```bash
cd crypto-dropship-backend
npm install
```

2. **Environment Configuration:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
MERCHANT_WALLET_PUBLIC_KEY=your_merchant_wallet_public_key

# Supplier APIs
SUPPLIER_API_KEY_1=your_supplier_api_key
SUPPLIER_API_KEY_2=your_supplier_api_key

# Other configurations...
```

3. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3003`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/meta/categories` - Get product categories

### Payments
- `POST /api/payments/create-payment` - Create payment request
- `POST /api/payments/verify-payment` - Verify blockchain payment
- `GET /api/payments/status/:reference` - Get payment status
- `POST /api/payments/webhook` - Payment confirmation webhook

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get order details
- `PATCH /api/orders/:orderId/status` - Update order status
- `GET /api/orders/customer/:email` - Get customer orders
- `GET /api/orders` - Get all orders (admin)

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:supplierId` - Get supplier details
- `POST /api/suppliers/:supplierId/orders` - Create supplier order
- `GET /api/suppliers/:supplierId/orders/:orderId` - Get supplier order status
- `POST /api/suppliers/:supplierId/sync-inventory` - Sync inventory

## Usage Examples

### Create Payment Request
```javascript
const response = await fetch('http://localhost:3003/api/payments/create-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod_1',
    quantity: 1,
    customerWallet: 'customer_wallet_address',
    paymentMethod: 'SOL'
  })
});

const { paymentRequest, qrCode } = await response.json();
```

### Verify Payment
```javascript
const response = await fetch('http://localhost:3003/api/payments/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reference: 'payment_reference',
    signature: 'transaction_signature'
  })
});
```

### Create Order
```javascript
const response = await fetch('http://localhost:3003/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod_1',
    quantity: 1,
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890'
    },
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US'
    },
    paymentReference: 'payment_reference'
  })
});
```

## Architecture

```
crypto-dropship-backend/
├── server.js              # Main server file
├── routes/
│   ├── products.js         # Product catalog endpoints
│   ├── payments.js         # Solana Pay integration
│   ├── orders.js          # Order management
│   └── suppliers.js       # Supplier integration
├── .env.example           # Environment template
└── package.json           # Dependencies
```

## Integration Notes

### Solana Pay
- Uses Solana devnet by default
- Supports SOL and SPL token payments
- QR code generation for mobile wallets
- Transaction verification on blockchain

### Dropship Suppliers
- Mock supplier integration included
- Easy to extend for real supplier APIs
- Inventory synchronization
- Order fulfillment automation

### Security
- CORS enabled
- Input validation
- Rate limiting (can be added)
- Environment-based configuration

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run in production
npm start
```

## Next Steps

1. **Database Integration** - Add PostgreSQL/MongoDB for persistent storage
2. **Authentication** - Implement JWT-based authentication
3. **Real Supplier APIs** - Connect to actual dropship suppliers
4. **Rate Limiting** - Add API rate limiting
5. **Monitoring** - Add logging and monitoring
6. **Testing** - Add unit and integration tests

## License

ISC
