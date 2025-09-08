@echo off
title FRESH PUSH TO SSPAY REPOSITORY

echo ===============================================
echo  PUSHING TO NEW REPOSITORY: SSPAY
echo  https://github.com/DroHadTo/SSPAY.git
echo ===============================================
echo.

cd /d "C:\Users\lenD25\Desktop\SSPAY"

echo Current directory: %CD%
echo.

echo === PROJECT FILES ===
dir /b
echo.

echo === CLEAN GIT SETUP ===
:: Remove any existing Git history
if exist ".git" (
    echo Removing old Git history...
    rmdir /s /q ".git"
)

:: Initialize fresh Git repository
echo Initializing fresh Git repository...
git init
if errorlevel 1 (
    echo ERROR: Failed to initialize Git
    pause
    exit /b 1
)

:: Configure Git user
echo Configuring Git user...
git config user.name "DroHadTo"
git config user.email "user@example.com"

:: Add all files
echo Adding all files...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)

:: Create initial commit
echo Creating initial commit...
git commit -m "Initial commit: Complete SSPAY - Solana Crypto Dropship Store with Printify Integration"
if errorlevel 1 (
    echo ERROR: Failed to create commit
    pause
    exit /b 1
)

:: Add new remote
echo Setting up new remote repository...
git remote add origin https://github.com/DroHadTo/SSPAY.git

:: Set main branch
echo Setting main branch...
git branch -M main

:: Push to new repository
echo ===============================================
echo  PUSHING TO https://github.com/DroHadTo/SSPAY.git
echo ===============================================
echo.
echo You may be prompted for GitHub authentication...
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED - AUTHENTICATION NEEDED
    echo ========================================
    echo.
    echo Solutions:
    echo 1. Use Personal Access Token as password
    echo 2. Install GitHub CLI: winget install GitHub.cli
    echo 3. Use GitHub Desktop
    echo.
    pause
) else (
    echo.
    echo ========================================
    echo           SUCCESS!
    echo ========================================
    echo.
    echo Your SSPAY project is now live at:
    echo https://github.com/DroHadTo/SSPAY
    echo.
    echo What was pushed:
    echo - Complete Solana Crypto Dropship Store
    echo - Printify API integration
    echo - Crypto payment system
    echo - Express.js backend
    echo - Frontend shop interface
    echo - Documentation and setup files
    echo.
)

echo === FINAL STATUS ===
git status
echo.

echo Repository: https://github.com/DroHadTo/SSPAY
pause
