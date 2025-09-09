# 🚀 SSPAY - Getting Started Guide
## Your Complete Solana Crypto Dropship Store

### 📋 **WHAT YOU BUILT:**
You created a complete e-commerce platform that:
- Sells print-on-demand products via Printify API
- Accepts cryptocurrency payments via Solana Pay
- Has a full backend API and frontend shop
- Manages products, orders, and payments automatically

---

## 🗂️ **PROJECT STRUCTURE EXPLAINED:**

```
C:\Users\lenD25\Desktop\SSPAY\
├── 📁 crypto-dropship-backend/     ← Main Server (START HERE)
│   ├── server.js                   ← Main server file
│   ├── package.json                ← Server dependencies
│   ├── 📁 routes/                  ← API endpoints
│   ├── 📁 database/                ← Database setup
│   └── .env                        ← Configuration file
│
├── 📁 solana-pay-shop/             ← Customer Shop Frontend
│   └── 📁 frontend/
│       ├── index.html              ← Shop homepage
│       ├── script.js               ← Shop functionality
│       └── style.css               ← Shop styling
│
├── 📁 pages/                       ← Next.js API routes
│   └── 📁 api/
│       └── create-payment.js       ← Payment processing
│
├── README.md                       ← Project documentation
├── package.json                    ← Root project file
└── .env                           ← Environment variables
```

---

## 🎯 **STEP-BY-STEP: HOW TO START YOUR STORE**

### **STEP 1: Install Dependencies**
Open PowerShell in your project folder:
```powershell
cd "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"
npm install
```

### **STEP 2: Set Up Environment Variables**
Edit the `.env` file in `crypto-dropship-backend` folder:
```env
# Required for Printify integration
PRINTIFY_API_TOKEN=your_printify_token_here

# Optional email settings
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database (auto-created)
DATABASE_URL=./database/crypto_dropship.db
```

### **STEP 3: Start the Server**
```powershell
cd "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"
node server.js
```

### **STEP 4: Access Your Store**
Open your browser and go to:
- **Shop Frontend**: http://localhost:3000/crypto-shop
- **API Health**: http://localhost:3000/health
- **Products API**: http://localhost:3000/api/products

---

## 🛍️ **HOW YOUR CUSTOMERS USE THE STORE:**

1. **Visit your shop**: http://localhost:3000/crypto-shop
2. **Browse products**: T-shirts, mugs, phone cases, etc.
3. **Click "Buy with Crypto"** on any product
4. **Pay with Solana**: Scan QR code or connect wallet
5. **Order processed**: Automatically sent to Printify for fulfillment

---

## 🔧 **ADMIN FEATURES - HOW YOU MANAGE:**

### **Sync Products from Printify:**
Visit: http://localhost:3000/admin
- Click "Sync Products" to import from your Printify store
- Products automatically appear in your crypto shop

### **View Orders & Payments:**
- API endpoint: http://localhost:3000/api/orders
- See all crypto payments and order status

### **Add Demo Products (for testing):**
Visit: http://localhost:3000/api/seed-products
- Adds sample products if none exist

---

## 💰 **PAYMENT FLOW:**

1. **Customer clicks buy** → System generates Solana Pay QR code
2. **Customer scans QR** → Payment sent to your wallet
3. **Payment confirmed** → Order automatically created
4. **Order sent to Printify** → Product printed and shipped
5. **Customer receives product** → You keep the profit!

**Your Merchant Wallet**: `89znXatBP5yXeA3JowynCwXTYqGSB833A9p96kfLcGkZ`

---

## 🔍 **TROUBLESHOOTING:**

### **Server Won't Start?**
```powershell
cd "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"
npm install
node server.js
```

### **No Products Showing?**
1. Get Printify API token from: https://printify.com/app/account/api
2. Add to `.env` file: `PRINTIFY_API_TOKEN=your_token`
3. Visit: http://localhost:3000/admin to sync products

### **Payments Not Working?**
- Check if server is running on port 3000
- Ensure you're on Solana devnet (for testing)
- Verify merchant wallet address is correct

---

## 🚀 **DEPLOYMENT OPTIONS:**

### **Local Testing (What you're doing now):**
- Run server locally
- Test with friends/family
- Use Solana devnet (fake money)

### **Go Live (Real store):**
1. **Get hosting**: Heroku, Vercel, DigitalOcean
2. **Switch to mainnet**: Real Solana payments
3. **Get domain name**: www.yourstore.com
4. **Set up real Printify account**: Live product fulfillment

---

## 📚 **KEY FILES TO KNOW:**

### **Main Server**: `crypto-dropship-backend/server.js`
- Controls everything
- Handles API requests
- Manages payments and orders

### **Shop Frontend**: `solana-pay-shop/frontend/index.html`
- What customers see
- Product catalog
- Crypto payment interface

### **Configuration**: `crypto-dropship-backend/.env`
- API keys and settings
- Wallet addresses
- Email configuration

---

## 🎯 **YOUR NEXT STEPS:**

1. **Start the server** (Step 1-3 above)
2. **Visit your shop** at http://localhost:3000/crypto-shop
3. **Test a purchase** with fake Solana
4. **Add your Printify token** to sell real products
5. **Customize the design** to match your brand
6. **Deploy online** when ready to go live

---

## 🆘 **NEED HELP?**

**Common Commands:**
```powershell
# Start server
cd "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"
node server.js

# Install dependencies
npm install

# Check if server is running
netstat -ano | findstr :3000
```

**Important URLs:**
- Shop: http://localhost:3000/crypto-shop
- Admin: http://localhost:3000/admin  
- API: http://localhost:3000/api/products

You built a complete crypto e-commerce platform! 🎉
Start with Step 1 and you'll have your store running in minutes!
