@echo off
title SSPAY - Solana Crypto Dropship Store Launcher

echo ===============================================
echo   🚀 SSPAY - SOLANA CRYPTO DROPSHIP STORE
echo   Complete E-commerce Platform Launcher
echo ===============================================
echo.

echo What you built:
echo ✅ Print-on-demand store (Printify integration)
echo ✅ Cryptocurrency payments (Solana Pay)
echo ✅ Complete backend API
echo ✅ Customer shop frontend
echo ✅ Order management system
echo.

cd /d "C:\Users\lenD25\Desktop\SSPAY\crypto-dropship-backend"

echo === CHECKING DEPENDENCIES ===
if not exist "node_modules" (
    echo Installing dependencies... This may take a moment.
    npm install
    echo Dependencies installed!
    echo.
)

echo === STARTING YOUR STORE ===
echo Server starting on port 3000...
echo.
echo 🌐 Your store will be available at:
echo    Shop Frontend: http://localhost:3000/crypto-shop
echo    Admin Panel:   http://localhost:3000/admin
echo    API Health:    http://localhost:3000/health
echo.
echo 💡 Tips:
echo - Visit /crypto-shop to see your store
echo - Visit /admin to manage products
echo - Add Printify API token in .env file for real products
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

node server.js

pause
