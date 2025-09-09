# SSPAY - Cryptocurrency E-commerce Platform

🚀 **SSPAY** is a complete cryptocurrency e-commerce platform that integrates Printify for print-on-demand products with Solana Pay for seamless crypto payments.

## ✨ Features

- 🛍️ **E-commerce Platform**: Complete online store for crypto payments
- 🎨 **Printify Integration**: Automated print-on-demand product management
- 💰 **Solana Pay**: Native cryptocurrency payment processing (SOL, USDC)
- 📱 **Responsive Design**: Mobile-friendly customer experience
- ⚙️ **Admin Dashboard**: Comprehensive management interface
- 🔄 **Real-time Sync**: Automatic product synchronization with Printify
- 🗄️ **Database Management**: SQLite with Sequelize ORM
- 🔐 **Secure Payments**: Blockchain-verified transactions

## 🏗️ Architecture

```
SSPAY/
├── src/                          # Main application source
│   ├── config/                   # Configuration files
│   │   ├── index.js             # Main config
│   │   └── database.js          # Database setup
│   ├── models/                   # Database models
│   │   ├── index.js             # Model exports & associations
│   │   ├── Product.js           # Product model
│   │   ├── Order.js             # Order model
│   │   ├── Payment.js           # Payment model
│   │   ├── Customer.js          # Customer model
│   │   └── OrderItem.js         # Order item model
│   ├── services/                 # Business logic services
│   │   ├── printifyService.js   # Printify API integration
│   │   └── solanaService.js     # Solana Pay integration
│   ├── routes/                   # API route handlers
│   │   ├── products.js          # Product routes
│   │   ├── orders.js            # Order routes
│   │   ├── payments.js          # Payment routes
│   │   ├── printify.js          # Printify routes
│   │   └── admin.js             # Admin routes
│   ├── middleware/               # Express middleware
│   │   ├── logger.js            # Request logging
│   │   └── errorHandler.js      # Error handling
│   ├── scripts/                  # Utility scripts
│   │   ├── setup.js             # Initial setup
│   │   └── sync-printify.js     # Product sync
│   └── server.js                 # Main server file
├── data/                         # Database storage
├── public/                       # Static files
├── solana-pay-shop/             # Frontend application
├── crypto-dropship-backend/     # Legacy backend (deprecated)
├── package.json                 # Dependencies & scripts
├── .env.example                 # Environment template
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DroHadTo/SSPAY.git
   cd SSPAY
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   npm run setup
   ```

4. **Configure your .env file**
   ```bash
   # Edit .env with your Printify credentials
   PRINTIFY_API_KEY=your_actual_api_key
   PRINTIFY_SHOP_ID=your_actual_shop_id
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the platform**
   - 🛍️ **Customer Shop**: http://localhost:3000/shop
   - ⚙️ **Admin Dashboard**: http://localhost:3000/admin
   - 📊 **API Documentation**: http://localhost:3000/api
   - ❤️ **Health Check**: http://localhost:3000/health

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run setup` | Initial project setup |
| `npm run seed` | Seed database with sample products |
| `npm run sync-printify` | Sync products from Printify |
| `npm test` | Run tests |
| `npm run lint` | Check code quality |

## 🔌 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `POST /api/products/sync` - Sync from Printify

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments/create` - Create payment request
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/transaction/:signature` - Get by transaction

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/sync-printify` - Manual Printify sync
- `GET /api/admin/system-info` - System information

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Printify Integration
PRINTIFY_API_KEY=your_printify_api_key
PRINTIFY_SHOP_ID=your_printify_shop_id

# Solana Configuration
SOLANA_NETWORK=devnet
MERCHANT_WALLET=your_solana_wallet_address
SOLANA_RPC_URL=https://api.devnet.solana.com

# CORS Settings
CORS_ORIGIN=http://localhost:3001,http://localhost:8080
```

### Database

The platform uses SQLite by default with Sequelize ORM. The database file is stored in `data/database.sqlite`.

#### Models
- **Product**: Store catalog items with Printify integration
- **Customer**: Customer information and wallet addresses
- **Order**: Order management with crypto payment support
- **Payment**: Solana Pay transaction tracking
- **OrderItem**: Individual order line items

## 💰 Cryptocurrency Integration

### Solana Pay Features
- ✅ SOL and USDC payments
- ✅ Real-time transaction verification
- ✅ Automatic payment confirmation
- ✅ Transaction signature tracking
- ✅ Reference-based payment matching

### Payment Flow
1. Customer adds products to cart
2. System calculates crypto prices
3. Generates Solana Pay URL/QR code
4. Customer completes payment in wallet
5. System verifies transaction on-chain
6. Order status updates automatically

## 🎨 Printify Integration

### Automated Features
- ✅ Product catalog synchronization
- ✅ Inventory management
- ✅ Order fulfillment
- ✅ Shipping tracking
- ✅ Variant and pricing sync

### Manual Actions
- Configure products in Printify dashboard
- Set up print providers
- Manage designs and templates

## 🛠️ Development

### Project Structure
- **src/**: Main application code with clean architecture
- **models/**: Database models with associations
- **services/**: Business logic and external API integrations
- **routes/**: Express route handlers
- **middleware/**: Custom middleware functions
- **scripts/**: Utility and setup scripts

### Adding New Features
1. Create model in `src/models/`
2. Add service logic in `src/services/`
3. Create routes in `src/routes/`
4. Update associations in `src/models/index.js`

### Database Changes
```bash
# The app will automatically sync model changes
npm run dev
```

## 📊 Monitoring & Logging

- Request/response logging
- Error tracking and handling
- Payment verification logs
- Printify sync status
- Performance monitoring

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting
- CORS configuration
- Environment variable protection
- Secure payment verification

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Update CORS origins
4. Set up SSL certificates
5. Configure reverse proxy

### Environment Checklist
- ✅ Printify API credentials
- ✅ Solana wallet configuration
- ✅ Database setup
- ✅ CORS origins
- ✅ SSL certificates

## 📈 Performance Optimization

- Database indexing
- Connection pooling
- Response caching
- Asset optimization
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@sspay.com
- 🐛 Issues: [GitHub Issues](https://github.com/DroHadTo/SSPAY/issues)
- 📖 Documentation: [Wiki](https://github.com/DroHadTo/SSPAY/wiki)

## 🙏 Acknowledgments

- [Printify](https://printify.com) for print-on-demand services
- [Solana](https://solana.com) for blockchain infrastructure
- [Solana Pay](https://solanapay.com) for payment processing
- Open source community for amazing tools and libraries

---

**Made with ❤️ for the crypto community**
