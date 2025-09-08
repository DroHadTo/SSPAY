@echo off
title GitHub Push - Solana Crypto Dropship Store

echo ================================================
echo   PUSHING SOLANA CRYPTO DROPSHIP STORE TO GITHUB
echo   Repository: https://github.com/DroHadTo/Solana-shop.git
echo ================================================
echo.

:: Change to project directory
cd /d "C:\Users\lenD25\Desktop\SSPAY"
echo Current directory: %CD%
echo.

:: Show files being pushed
echo === FILES TO PUSH ===
dir /b
echo.

:: Check Git installation
echo === CHECKING GIT ===
git --version
if errorlevel 1 (
    echo ERROR: Git not found! Please install Git first.
    pause
    exit /b 1
)
echo Git is installed.
echo.

:: Initialize Git if needed
echo === INITIALIZING GIT ===
if not exist ".git" (
    echo Initializing Git repository...
    git init
    if errorlevel 1 (
        echo ERROR: Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo Git repository initialized.
) else (
    echo Git repository already exists.
)
echo.

:: Configure Git user
echo === CONFIGURING GIT USER ===
git config user.name "DroHadTo"
git config user.email "user@example.com"
echo Git user configured.
echo.

:: Add all files
echo === ADDING FILES ===
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo All files added to staging.
echo.

:: Show what's staged
echo === STAGED FILES ===
git diff --cached --name-only
echo.

:: Create commit
echo === CREATING COMMIT ===
git commit -m "Complete Solana Crypto Dropship Store - Print-on-Demand E-commerce with Crypto Payments"
if errorlevel 1 (
    echo Note: Commit may have failed if no changes to commit
)
echo.

:: Remove existing remote and add new one
echo === CONFIGURING REMOTE ===
git remote remove origin 2>nul
git remote add origin https://github.com/DroHadTo/Solana-shop.git
if errorlevel 1 (
    echo ERROR: Failed to add remote repository
    pause
    exit /b 1
)
echo Remote repository configured.
echo.

:: Verify remote
echo === VERIFYING REMOTE ===
git remote -v
echo.

:: Set main branch
echo === SETTING MAIN BRANCH ===
git branch -M main
if errorlevel 1 (
    echo ERROR: Failed to set main branch
    pause
    exit /b 1
)
echo Main branch set.
echo.

:: Push to GitHub
echo === PUSHING TO GITHUB ===
echo This will push your complete Solana Crypto Dropship Store to GitHub...
echo You may be prompted for authentication.
echo.
echo Press any key to continue with the push...
pause >nul

git push -u origin main
if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED - AUTHENTICATION NEEDED
    echo ========================================
    echo.
    echo The push failed. This usually means you need to authenticate.
    echo.
    echo SOLUTIONS:
    echo 1. Use Personal Access Token:
    echo    - Go to GitHub.com ^> Settings ^> Developer settings ^> Personal access tokens
    echo    - Generate new token with 'repo' permissions
    echo    - Use token as password when prompted
    echo.
    echo 2. Try GitHub CLI:
    echo    - Install: winget install GitHub.cli
    echo    - Run: gh auth login
    echo    - Then run this script again
    echo.
    echo 3. Manual push with credentials:
    echo    git push https://[USERNAME]:[TOKEN]@github.com/DroHadTo/Solana-shop.git main
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo           SUCCESS!
    echo ========================================
    echo.
    echo Your Solana Crypto Dropship Store has been successfully pushed to GitHub!
    echo.
    echo Repository URL: https://github.com/DroHadTo/Solana-shop
    echo.
    echo What was pushed:
    echo - Complete Express.js backend with Printify integration
    echo - Crypto payment frontend with Solana Pay
    echo - Database models and API routes
    echo - Documentation and setup instructions
    echo - Configuration files and deployment scripts
    echo.
)

:: Show final status
echo === FINAL GIT STATUS ===
git status
echo.

:: Show recent commits
echo === RECENT COMMITS ===
git log --oneline -n 3 2>nul
echo.

echo ================================================
echo   GITHUB PUSH COMPLETED!
echo   View your repository at:
echo   https://github.com/DroHadTo/Solana-shop
echo ================================================
echo.

pause
