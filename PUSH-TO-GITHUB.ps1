# GitHub Push Script - Solana Crypto Dropship Store
# This script will push your complete project to GitHub

param(
    [switch]$Force,
    [string]$CommitMessage = "Complete Solana Crypto Dropship Store - Full Stack E-commerce Platform"
)

$ErrorActionPreference = "Continue"

Write-Host @"
🚀 PUSHING SOLANA CRYPTO DROPSHIP STORE TO GITHUB
================================================
Repository: https://github.com/DroHadTo/Solana-shop.git
Project: Complete E-commerce Platform with Crypto Payments
"@ -ForegroundColor Green

# Set project directory
$ProjectPath = "C:\Users\lenD25\Desktop\SSPAY"
Set-Location $ProjectPath

Write-Host "`n📁 Project Directory: $(Get-Location)" -ForegroundColor Yellow

# Verify Git installation
Write-Host "`n🔍 Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Cyan
    exit 1
}

# Show project files
Write-Host "`n📋 Files to be pushed:" -ForegroundColor Yellow
Get-ChildItem | Where-Object { $_.Name -notlike "node_modules" } | Select-Object Name, Mode | Format-Table -AutoSize

# Initialize Git repository
Write-Host "`n🔄 Setting up Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Cyan
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize Git repository" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Configure Git user
Write-Host "`n👤 Configuring Git user..." -ForegroundColor Yellow
git config user.name "DroHadTo"
git config user.email "user@example.com"
Write-Host "✅ Git user configured" -ForegroundColor Green

# Add all files
Write-Host "`n📦 Adding all files to Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add files to Git" -ForegroundColor Red
    exit 1
}

# Show staged files
Write-Host "`n📋 Staged files:" -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    $stagedFiles | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
    Write-Host "Total files staged: $($stagedFiles.Count)" -ForegroundColor Cyan
} else {
    Write-Host "  No new changes to stage" -ForegroundColor Yellow
}

# Create commit
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
$commitResult = git commit -m $CommitMessage 2>&1
Write-Host $commitResult -ForegroundColor White

# Configure remote repository
Write-Host "`n🌐 Configuring GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/DroHadTo/Solana-shop.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add remote repository" -ForegroundColor Red
    exit 1
}

# Verify remote
Write-Host "`n📡 Remote configuration:" -ForegroundColor Yellow
git remote -v

# Set main branch
Write-Host "`n🌟 Setting main branch..." -ForegroundColor Yellow
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set main branch" -ForegroundColor Red
    exit 1
}

# Push to GitHub
Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "You may be prompted for GitHub authentication..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to cancel, or any other key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$pushCommand = if ($Force) { "git push -u origin main --force" } else { "git push -u origin main" }
Write-Host "`nExecuting: $pushCommand" -ForegroundColor Cyan

Invoke-Expression $pushCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host @"

🎉 SUCCESS! 
============
✅ Your Solana Crypto Dropship Store has been pushed to GitHub!

🌐 Repository URL: https://github.com/DroHadTo/Solana-shop
🛒 Live at: https://github.com/DroHadTo/Solana-shop

📦 What was pushed:
- ✅ Complete Express.js backend with Printify API integration
- ✅ Crypto payment frontend with Solana Pay
- ✅ SQLite database with Sequelize ORM
- ✅ Product management and sync system
- ✅ Comprehensive documentation (README.md)
- ✅ Configuration files and deployment scripts
- ✅ MIT License and proper .gitignore

🎯 Next steps:
1. Visit your repository: https://github.com/DroHadTo/Solana-shop
2. Set up environment variables (Printify API token)
3. Deploy to your preferred hosting platform
4. Start selling with crypto payments!

"@ -ForegroundColor Green
} else {
    Write-Host @"

⚠️  PUSH FAILED - AUTHENTICATION REQUIRED
========================================

The push failed. This typically means GitHub authentication is needed.

🔧 Quick Solutions:

1. 🔑 Personal Access Token (Recommended):
   - Go to: https://github.com/settings/personal-access-tokens/tokens
   - Generate new token with 'repo' permissions
   - Use token as password when prompted

2. 🛠️  GitHub CLI (Easy):
   - Install: winget install GitHub.cli
   - Authenticate: gh auth login
   - Then re-run this script

3. 🔗 Manual push with credentials:
   git push https://[USERNAME]:[TOKEN]@github.com/DroHadTo/Solana-shop.git main

4. 🔄 Force push (if repository exists):
   Re-run this script with -Force parameter

"@ -ForegroundColor Yellow
}

# Show final status
Write-Host "`n📊 Final Git Status:" -ForegroundColor Yellow
git status

Write-Host "`n📚 Recent Commits:" -ForegroundColor Yellow
git log --oneline -n 3 2>$null

Write-Host "`n🏁 Script completed!" -ForegroundColor Green
Write-Host "Repository: https://github.com/DroHadTo/Solana-shop" -ForegroundColor Cyan
