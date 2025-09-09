@echo off
echo ================================================
echo    SSPAY - Cryptocurrency E-commerce Platform
echo ================================================
echo.

echo 🚀 Starting SSPAY server...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the SSPAY root directory
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚙️ Setting up environment...
    npm run setup
    echo.
    echo ⚠️ Please edit .env file with your Printify credentials
    echo.
)

REM Start the server
echo 🌟 Starting server...
echo.
echo 📱 Access your store at:
echo   - Shop: http://localhost:3000/shop
echo   - Admin: http://localhost:3000/admin
echo   - API: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
