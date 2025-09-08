# 🚀 Solana Crypto Dropship Store

A complete cryptocurrency e-commerce platform combining **Printify print-on-demand** with **Solana Pay** payments. Accept crypto payments (SOL, USDC) for custom products with automatic fulfillment.

## 🎯 Features

### 💰 **Crypto Payments**
- **Solana Pay Integration** - Accept SOL, USDC, and other SPL tokens
- **Real-time Payment Processing** - Instant transaction verification
- **QR Code Payments** - Mobile-friendly crypto payments
- **Devnet/Mainnet Support** - Development and production ready

### 🛍️ **E-commerce Platform**
- **Product Management** - Add, edit, and sync products
- **Printify Integration** - Automatic print-on-demand fulfillment
- **Inventory Tracking** - Real-time stock management
- **Order Management** - Complete order lifecycle

### 🔧 **Technical Stack**
- **Backend**: Node.js + Express + SQLite + Sequelize ORM
- **Frontend**: Vanilla JS + Modern CSS + Responsive Design
- **Blockchain**: Solana Web3.js + @solana/pay
- **API**: Printify API v1 with full scopes
- **Database**: SQLite with crypto payment models

## 🏗️ Architecture

```
SSPAY/
├── crypto-dropship-backend/     # Main backend server
│   ├── database/               # SQLite database & models
│   ├── routes/                # API endpoints
│   ├── services/              # Printify & crypto services
│   ├── public/                # Static files & admin interface
│   └── server.js              # Main server file
├── solana-pay-shop/           # Frontend shop
│   └── frontend/              # Customer-facing shop
├── pages/                     # Next.js API routes (optional)
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Printify account with API access
- Solana wallet (for receiving payments)

### 1. Clone & Install
```bash
git clone https://github.com/DroHadTo/Solana-shop.git
cd Solana-shop
cd crypto-dropship-backend
npm install
```

### 2. Environment Setup
Create `.env` file in `crypto-dropship-backend/`:
```env
# Printify API (Get from: https://printify.com/app/settings/api)
PRINTIFY_API_TOKEN=your_printify_jwt_token_here

# Solana Configuration
SOLANA_NETWORK=devnet  # or mainnet-beta for production
SOLANA_RPC_URL=https://api.devnet.solana.com
MERCHANT_WALLET_PUBLIC_KEY=your_solana_wallet_address

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Optional: Email notifications
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Start the Server
```bash
npm start
# or for development with auto-reload:
npx nodemon server.js
```

### 4. Access the Platform
- **Main Shop**: http://localhost:3000/crypto-shop
- **Admin Dashboard**: http://localhost:3000/
- **Printify Sync**: http://localhost:3000/printify-sync.html
- **Product Seeder**: http://localhost:3000/seed.html
- **API Health**: http://localhost:3000/health

## 📱 Usage Guide

### For Store Owners

#### 1. **Setup Printify Products**
- Visit http://localhost:3000/printify-sync.html
- Click "Test Connection" to verify API
- Click "Sync Now" to import your Printify products
- Products automatically get crypto pricing with 50% markup

#### 2. **Configure Payments**
- Set your Solana wallet address in `.env`
- Choose devnet (testing) or mainnet (production)
- Payments are processed automatically

#### 3. **Manage Orders**
- Orders sync to Printify for fulfillment
- Crypto payments are verified on-chain
- Email notifications for new orders

### For Customers

#### 1. **Browse Products**
- Visit the crypto shop
- View products with USD and crypto prices
- Mobile-responsive design

#### 2. **Pay with Crypto**
- Click "Pay with Crypto" on any product
- Scan QR code with Solana wallet (Phantom, Solflare)
- Payment is verified instantly

#### 3. **Order Fulfillment**
- Orders automatically sent to Printify
- Products printed and shipped
- Tracking information provided

## 🔌 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/sync-printify` - Sync Printify products

### Payments
- `POST /api/crypto/create-payment` - Create payment request
- `GET /api/crypto/verify-payment/:reference` - Verify payment
- `GET /api/crypto/health` - Service health check

### Admin
- `POST /api/seed-products` - Add demo products
- `POST /api/test-printify` - Test Printify API
- `GET /health` - Server health check

## 🔧 Configuration

### Printify Scopes Required
```
✅ shops.read         - Read shop information
✅ shops.manage       - Manage shop settings
✅ catalog.read       - Access product catalog
✅ products.read      - Read products
✅ products.write     - Create/update products
✅ orders.read        - Read orders
✅ orders.write       - Create orders
✅ webhooks.read      - Read webhooks
✅ webhooks.write     - Manage webhooks
✅ uploads.read       - Read uploads
✅ uploads.write      - Upload files
✅ print_providers.read - Read print providers
✅ user.info          - Read user information
```

### Solana Network Configuration
```javascript
// Development (Devnet)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

// Production (Mainnet)
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## 🛡️ Security Features

- **Environment Variables** - Sensitive data in .env
- **Rate Limiting** - API request throttling
- **Input Validation** - SQL injection prevention
- **CORS Protection** - Cross-origin security
- **Helmet.js** - Security headers
- **Payment Verification** - On-chain transaction verification

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway
```bash
# Connect to Railway
railway login
railway link

# Deploy
railway up
```

### Digital Ocean / AWS / Heroku
- Set environment variables
- Install dependencies: `npm install`
- Start server: `npm start`
- Configure reverse proxy (nginx)

## 📊 Monitoring & Analytics

- **Real-time Dashboard** - Product sales and inventory
- **Payment Tracking** - Crypto transaction monitoring
- **Printify Sync Status** - Product synchronization health
- **Error Logging** - Comprehensive error tracking

## 🔮 Roadmap

- [ ] **Multi-currency Support** - ETH, BTC, other chains
- [ ] **NFT Integration** - Token-gated products
- [ ] **Subscription Products** - Recurring crypto payments
- [ ] **Advanced Analytics** - Sales dashboard
- [ ] **Mobile App** - React Native frontend
- [ ] **Multi-vendor** - Support multiple Printify accounts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** - For the amazing blockchain infrastructure
- **Printify** - For the print-on-demand platform
- **Solana Pay** - For the crypto payment protocol
- **Phantom Wallet** - For the wallet integration examples

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DroHadTo/Solana-shop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DroHadTo/Solana-shop/discussions)
- **Documentation**: Check the `/docs` folder for detailed guides

---

**Built with ❤️ by the crypto community**

*Ready to revolutionize e-commerce with cryptocurrency payments!* 🚀
