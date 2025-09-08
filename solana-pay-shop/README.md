# Solana Pay Shop

A modern e-commerce application built with **Solana Pay** integration for secure, fast, and low-cost cryptocurrency payments. This project demonstrates how to implement blockchain-based payments in a real-world shopping application.

## 🚀 Features

### Frontend
- **Responsive Design**: Modern, mobile-first UI built with vanilla HTML, CSS, and JavaScript
- **Product Catalog**: Browse and search through available products
- **Shopping Cart**: Add, remove, and manage items in your cart
- **Real-time Updates**: Dynamic cart calculations and product availability
- **Solana Pay Integration**: QR code generation for seamless crypto payments

### Backend
- **RESTful API**: Built with Node.js and Express.js
- **Payment Processing**: Solana Pay integration for blockchain transactions
- **Order Management**: Complete order lifecycle management
- **Product Management**: Inventory tracking and product catalog
- **Real-time Verification**: Blockchain transaction verification

## 📁 Project Structure

```
solana-pay-shop/
├── 📁 frontend/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Stylesheet with modern design
│   └── script.js           # Frontend JavaScript logic
├── 📁 backend/
│   ├── package.json        # Node.js dependencies and scripts
│   ├── server.js           # Express server setup
│   └── 📁 routes/
│       ├── payment.js      # Solana Pay integration routes
│       ├── products.js     # Product management routes
│       └── orders.js       # Order management routes
└── README.md               # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup for better accessibility
- **CSS3**: Modern styling with Flexbox and Grid
- **Vanilla JavaScript**: ES6+ features for clean, modern code

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Fast and minimal web framework
- **Solana Web3.js**: Solana blockchain integration
- **Solana Pay**: Official Solana payment protocol
- **QRCode**: QR code generation for payment links

## 📦 Installation

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Solana Wallet** (Phantom, Solflare, etc.) for testing payments

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
# Create a .env file in the backend directory
PORT=3000
NODE_ENV=development
MERCHANT_WALLET=YourSolanaWalletAddressHere
```

4. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Open `index.html` in your browser or serve it using a local web server:

**Option 1: Simple file server**
```bash
# Using Python (if installed)
python -m http.server 8080

# Using Node.js (if live-server is installed globally)
npx live-server
```

**Option 2: Open directly**
- Simply open `frontend/index.html` in your web browser

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Solana Configuration
MERCHANT_WALLET=your_solana_wallet_address_here
SOLANA_NETWORK=devnet

# API Configuration
API_BASE_URL=http://localhost:3000
```

### Solana Wallet Setup

1. Install a Solana wallet browser extension (Phantom recommended)
2. Create a new wallet or import an existing one
3. Switch to **Devnet** for testing
4. Get some test SOL from the [Solana Faucet](https://faucet.solana.com/)

## 🚀 Usage

### Starting the Application

1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Open the frontend:**
```bash
cd frontend
# Open index.html in your browser or use a local server
```

### Making a Purchase

1. **Browse Products**: View available products on the main page
2. **Add to Cart**: Click "Add to Cart" for desired items
3. **Review Cart**: Check your items and total in the cart sidebar
4. **Initiate Payment**: Click "Pay with Solana" to generate a payment QR code
5. **Complete Payment**: Scan the QR code with your Solana wallet
6. **Confirmation**: Receive order confirmation after payment verification

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get specific product
- `GET /api/products/meta/categories` - Get product categories
- `POST /api/products/check-availability` - Check product availability

#### Payments
- `POST /api/payment/create` - Create new payment request
- `GET /api/payment/status/:paymentId` - Check payment status
- `POST /api/payment/verify/:paymentId` - Verify payment transaction
- `POST /api/payment/cancel/:paymentId` - Cancel payment request

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders` - Get all orders (with pagination)
- `PUT /api/orders/:orderId/status` - Update order status
- `POST /api/orders/:orderId/cancel` - Cancel order

### Example API Usage

**Create a payment request:**
```javascript
const response = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        items: [
            { id: 1, name: "Solana T-Shirt", price: 25.00, quantity: 1 }
        ],
        total: 25.00,
        currency: 'USD'
    })
});

const payment = await response.json();
console.log(payment.qrCode); // QR code for payment
```

## 🔒 Security Features

- **Blockchain Verification**: All payments are verified on the Solana blockchain
- **Transaction Signatures**: Each payment includes a unique transaction signature
- **Input Validation**: All API endpoints validate input data
- **CORS Protection**: Cross-origin requests are properly configured
- **Error Handling**: Comprehensive error handling and logging

## 🧪 Testing

### Manual Testing

1. **Frontend Testing**:
   - Add products to cart
   - Update quantities
   - Remove items
   - Initiate checkout process

2. **Backend Testing**:
   - Test API endpoints using tools like Postman or curl
   - Verify payment creation and status checking
   - Test order management functionality

### API Testing Examples

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Get Products:**
```bash
curl http://localhost:3000/api/products
```

**Create Payment:**
```bash
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":1,"name":"Test Product","price":10,"quantity":1}],"total":10}'
```

## 🔮 Future Enhancements

### Phase 2 Features
- **User Authentication**: User accounts and order history
- **Database Integration**: Replace in-memory storage with MongoDB/PostgreSQL
- **Advanced UI**: React.js frontend with better state management
- **Mobile App**: React Native mobile application
- **Admin Dashboard**: Order and inventory management interface

### Phase 3 Features
- **Multi-currency Support**: Accept multiple cryptocurrencies
- **NFT Integration**: Sell NFTs alongside physical products
- **Subscription Payments**: Recurring payment support
- **Analytics Dashboard**: Sales and customer analytics
- **Inventory Management**: Advanced stock tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/solana-pay-shop/issues) page
2. Create a new issue with detailed information
3. Join our [Discord community](https://discord.gg/solana) for real-time support

## 🙏 Acknowledgments

- **Solana Foundation** for the amazing blockchain technology
- **Solana Pay** team for the payment protocol
- **Open Source Community** for the tools and libraries used

---

**Built with ❤️ for the future of decentralized commerce**
