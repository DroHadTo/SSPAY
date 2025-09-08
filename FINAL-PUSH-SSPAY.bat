@echo off
title PUSH TO SSPAY REPOSITORY - Final Setup

echo ===============================================
echo  PUSHING TO NEW SSPAY REPOSITORY
echo  Repository: https://github.com/DroHadTo/SSPAY.git
echo  Email: Drometax@icloud.com
echo ===============================================
echo.

cd /d "C:\Users\lenD25\Desktop\SSPAY"

echo === CLEAN SETUP FOR NEW REPOSITORY ===

:: Remove old Git history for fresh start
if exist ".git" (
    echo Removing old Git history...
    rmdir /s /q ".git"
)

:: Initialize fresh repository
echo Initializing fresh Git repository...
git init

:: Configure Git with correct email
echo Configuring Git user...
git config user.name "DroHadTo"
git config user.email "Drometax@icloud.com"

:: Add all files
echo Adding all project files...
git add .

:: Show files being added
echo.
echo === FILES BEING COMMITTED ===
git diff --cached --name-only
echo.

:: Create initial commit
echo Creating initial commit...
git commit -m "Initial commit: Complete SSPAY - Solana Crypto Dropship Store with Printify Integration"

:: Set up new remote
echo Setting up new SSPAY repository remote...
git remote add origin https://github.com/DroHadTo/SSPAY.git

:: Set main branch
echo Setting main branch...
git branch -M main

:: Push to new repository
echo.
echo ===============================================
echo  PUSHING TO https://github.com/DroHadTo/SSPAY.git
echo ===============================================
echo.
echo About to push your complete Solana Crypto Dropship Store...
echo You may be prompted for GitHub authentication.
echo.
echo Press any key to continue...
pause >nul

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   AUTHENTICATION NEEDED
    echo ========================================
    echo.
    echo The push failed. Please authenticate with GitHub:
    echo.
    echo 1. Use Personal Access Token as password
    echo 2. Or install GitHub CLI: winget install GitHub.cli
    echo 3. Then run: gh auth login
    echo.
    echo After authentication, run this script again.
    echo.
) else (
    echo.
    echo ========================================
    echo           SUCCESS!
    echo ========================================
    echo.
    echo Your SSPAY project is now live at:
    echo https://github.com/DroHadTo/SSPAY
    echo.
    echo Complete Solana Crypto Dropship Store deployed!
    echo - Print-on-demand integration (Printify)
    echo - Cryptocurrency payments (Solana Pay)
    echo - Full stack e-commerce platform
    echo - Express.js backend + React frontend
    echo - SQLite database with Sequelize ORM
    echo - Comprehensive documentation
    echo.
)

echo === FINAL STATUS ===
git status
echo.
echo Repository: https://github.com/DroHadTo/SSPAY
echo Email: Drometax@icloud.com
echo.
pause
