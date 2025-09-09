# 🎯 QUICK START - Your SSPAY Store in 3 Steps

## 🚀 **FASTEST WAY TO START:**

### **Option 1: One-Click Start**
Double-click this file: `START-STORE.bat`
- Automatically installs dependencies
- Starts your server
- Opens all the right URLs

### **Option 2: Manual Start**
1. Open PowerShell
2. Run these commands:
```powershell
cd "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"
npm install
node server.js
```

## 🌐 **WHERE TO GO:**

Once your server starts, visit these URLs:

### **Your Customer Shop:**
http://localhost:3000/crypto-shop
- This is what customers see
- Browse products
- Test crypto payments

### **Your Admin Panel:**
http://localhost:3000/admin
- Sync products from Printify
- Manage your store

### **API Health Check:**
http://localhost:3000/health
- Verify everything is working

## 🛍️ **WHAT HAPPENS NEXT:**

1. **Server starts** → You see startup messages
2. **Visit crypto-shop** → See your store
3. **Test a purchase** → Click "Buy with Crypto"
4. **Scan QR code** → Use Solana wallet (devnet/fake money)
5. **Order created** → Automatically processed

## ⚙️ **TO SELL REAL PRODUCTS:**

1. **Get Printify API token**: https://printify.com/app/account/api
2. **Edit .env file** in crypto-dropship-backend folder:
   ```
   PRINTIFY_API_TOKEN=your_token_here
   ```
3. **Visit admin panel** → Sync real products
4. **Switch to mainnet** → Accept real Solana payments

## 🎉 **YOU BUILT:**

- ✅ Complete e-commerce platform
- ✅ Crypto payment processing
- ✅ Print-on-demand integration
- ✅ Order management system
- ✅ Customer shopping interface

**Start with the `START-STORE.bat` file and you'll be running in minutes!**
