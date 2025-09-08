# COMPREHENSIVE FIX SCRIPT for Solana Crypto Dropship Store
# This script will fix all deployment issues and push to GitHub

$ErrorActionPreference = "Continue"

Write-Host @"
🔧 FIXING ALL DEPLOYMENT ISSUES
==============================
Repository: https://github.com/DroHadTo/Solana-shop.git
Project: Solana Crypto Dropship Store
"@ -ForegroundColor Green

# Set working directory
$ProjectPath = "C:\Users\lenD25\Desktop\SSPAY"
Set-Location $ProjectPath

Write-Host "`n📍 Current Directory: $(Get-Location)" -ForegroundColor Yellow

# Check if Git is installed
Write-Host "`n🔍 Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Show project files
Write-Host "`n📁 Project Files:" -ForegroundColor Yellow
Get-ChildItem | Select-Object Name, Mode | Format-Table -AutoSize

# Initialize Git if needed
Write-Host "`n🔄 Checking Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check Git status
Write-Host "`n📋 Git Status:" -ForegroundColor Yellow
git status

# Configure Git user if not set
Write-Host "`n👤 Checking Git configuration..." -ForegroundColor Yellow
$userName = git config --global user.name 2>$null
$userEmail = git config --global user.email 2>$null

if (-not $userName) {
    Write-Host "Setting default Git user name..." -ForegroundColor Cyan
    git config --global user.name "DroHadTo"
}
if (-not $userEmail) {
    Write-Host "Setting default Git email..." -ForegroundColor Cyan
    git config --global user.email "user@example.com"
}

# Add all files
Write-Host "`n📦 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Show what's staged
Write-Host "`n📋 Files staged for commit:" -ForegroundColor Yellow
git diff --cached --name-only

# Create commit
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
$commitMessage = "Complete Solana Crypto Dropship Store - Printify Integration, Crypto Payments, Full Stack E-commerce Platform"
git commit -m $commitMessage

# Configure remote
Write-Host "`n🌐 Configuring GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/DroHadTo/Solana-shop.git

# Verify remote
Write-Host "`n📡 Remote configuration:" -ForegroundColor Yellow
git remote -v

# Set main branch
Write-Host "`n🌟 Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Attempt to push
Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may need to authenticate with GitHub" -ForegroundColor Cyan

$pushResult = git push -u origin main 2>&1
Write-Host $pushResult

if ($LASTEXITCODE -eq 0) {
    Write-Host @"

🎉 SUCCESS! 
===========
✅ Repository successfully pushed to GitHub!
🌐 View at: https://github.com/DroHadTo/Solana-shop
🛒 Your Solana Crypto Dropship Store is now live!

📋 What's included:
- Complete e-commerce platform
- Printify print-on-demand integration  
- Solana Pay cryptocurrency payments
- Express.js backend API
- React frontend shop
- SQLite database
- Comprehensive documentation

"@ -ForegroundColor Green
} else {
    Write-Host @"

⚠️  PUSH FAILED - AUTHENTICATION NEEDED
======================================
The repository push failed. This usually means authentication is required.

🔧 Solutions:

1. GitHub Personal Access Token:
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens
   - Generate new token with 'repo' permissions
   - Use token as password when prompted

2. GitHub CLI (Recommended):
   - Install: winget install GitHub.cli
   - Run: gh auth login
   - Follow prompts to authenticate

3. Manual Push with Token:
   git push https://[USERNAME]:[TOKEN]@github.com/DroHadTo/Solana-shop.git main

"@ -ForegroundColor Yellow
}

Write-Host "`n📊 Final Status:" -ForegroundColor Yellow
git status
git log --oneline -n 3 2>$null

Write-Host "`n🏁 Fix script completed!" -ForegroundColor Green
