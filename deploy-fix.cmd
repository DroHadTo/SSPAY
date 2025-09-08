@echo off
title Fixing Solana Crypto Dropship Store - GitHub Deployment

echo ===============================================
echo  FIXING ALL DEPLOYMENT ISSUES
echo  Repository: https://github.com/DroHadTo/Solana-shop.git
echo ===============================================
echo.

cd /d "C:\Users\lenD25\Desktop\SSPAY"

echo Current directory: %CD%
echo.

echo === PROJECT FILES ===
dir /b
echo.

echo === CHECKING GIT ===
git --version
if errorlevel 1 (
    echo ERROR: Git not found. Please install Git first.
    pause
    exit /b 1
)

echo.
echo === INITIALIZING GIT REPOSITORY ===
if not exist ".git" (
    echo Initializing new Git repository...
    git init
    echo Git repository initialized.
) else (
    echo Git repository already exists.
)

echo.
echo === CONFIGURING GIT USER ===
git config --global user.name "DroHadTo" 2>nul
git config --global user.email "user@example.com" 2>nul

echo.
echo === ADDING ALL FILES ===
git add .

echo.
echo === CREATING COMMIT ===
git commit -m "Complete Solana Crypto Dropship Store - Full Stack E-commerce Platform"

echo.
echo === CONFIGURING REMOTE ===
git remote remove origin 2>nul
git remote add origin https://github.com/DroHadTo/Solana-shop.git

echo.
echo === VERIFYING REMOTE ===
git remote -v

echo.
echo === SETTING MAIN BRANCH ===
git branch -M main

echo.
echo === PUSHING TO GITHUB ===
echo Note: You may need to authenticate with GitHub
echo.
git push -u origin main

echo.
echo === FINAL STATUS ===
git status

echo.
echo ===============================================
echo  DEPLOYMENT COMPLETED!
echo  Check: https://github.com/DroHadTo/Solana-shop
echo ===============================================
echo.

pause
