# Fresh Push to SSPAY Repository
# Clean setup and push to https://github.com/DroHadTo/SSPAY.git

$ErrorActionPreference = "Continue"

Write-Host @"
🚀 FRESH PUSH TO NEW SSPAY REPOSITORY
====================================
New Repository: https://github.com/DroHadTo/SSPAY.git
Project: Complete Solana Crypto Dropship Store
"@ -ForegroundColor Green

# Set project directory
$ProjectPath = "C:\Users\lenD25\Desktop\SSPAY"
Set-Location $ProjectPath

Write-Host "`n📁 Project Directory: $(Get-Location)" -ForegroundColor Yellow

# Show project contents
Write-Host "`n📋 Project Contents:" -ForegroundColor Yellow
Get-ChildItem | Where-Object { $_.Name -notlike "node_modules" -and $_.Name -notlike ".git" } | 
    Select-Object Name, Mode | Format-Table -AutoSize

# Clean Git setup
Write-Host "`n🧹 Setting up fresh Git repository..." -ForegroundColor Yellow

# Remove existing Git history
if (Test-Path ".git") {
    Write-Host "Removing old Git history..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".git"
}

# Initialize fresh repository
Write-Host "Initializing fresh Git repository..." -ForegroundColor Cyan
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to initialize Git repository" -ForegroundColor Red
    exit 1
}

# Configure Git user
Write-Host "Configuring Git user..." -ForegroundColor Cyan
git config user.name "DroHadTo"
git config user.email "user@example.com"

# Add all files
Write-Host "`n📦 Adding all project files..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add files" -ForegroundColor Red
    exit 1
}

# Show what's being committed
Write-Host "`n📋 Files to be committed:" -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
$stagedFiles | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
Write-Host "Total files: $($stagedFiles.Count)" -ForegroundColor Cyan

# Create initial commit
Write-Host "`n💾 Creating initial commit..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Complete SSPAY - Solana Crypto Dropship Store with Printify Integration and Crypto Payments"
git commit -m $commitMessage

# Add new remote
Write-Host "`n🌐 Setting up new remote repository..." -ForegroundColor Yellow
git remote add origin https://github.com/DroHadTo/SSPAY.git

# Verify remote
Write-Host "`n📡 Remote configuration:" -ForegroundColor Yellow
git remote -v

# Set main branch
Write-Host "`n🌟 Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Push to new repository
Write-Host "`n🚀 Pushing to new SSPAY repository..." -ForegroundColor Yellow
Write-Host "Repository: https://github.com/DroHadTo/SSPAY.git" -ForegroundColor Cyan
Write-Host "You may be prompted for GitHub authentication..." -ForegroundColor Yellow

$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host @"

🎉 SUCCESS! 
============
✅ Your SSPAY project has been pushed to the new repository!

🌐 Repository URL: https://github.com/DroHadTo/SSPAY
🛒 Your complete Solana Crypto Dropship Store is now live!

📦 What was pushed:
- ✅ Complete Express.js backend with Printify integration
- ✅ Crypto payment frontend with Solana Pay
- ✅ SQLite database with Sequelize ORM
- ✅ Product management and sync system
- ✅ Comprehensive documentation
- ✅ Configuration files and deployment scripts
- ✅ Spell checker dictionary
- ✅ License and gitignore files

🎯 Next steps:
1. Visit: https://github.com/DroHadTo/SSPAY
2. Clone and test the repository
3. Set up environment variables
4. Deploy and start selling!

"@ -ForegroundColor Green
} else {
    Write-Host @"

⚠️  PUSH FAILED - AUTHENTICATION REQUIRED
========================================

$pushResult

🔧 Solutions:

1. 🔑 Personal Access Token:
   - Go to: https://github.com/settings/personal-access-tokens/tokens
   - Generate new token with 'repo' permissions
   - Use as password when prompted

2. 🛠️  GitHub CLI:
   - Install: winget install GitHub.cli
   - Authenticate: gh auth login
   - Re-run this script

3. 🔄 Try the batch script:
   - Run: FRESH-PUSH-SSPAY.bat

"@ -ForegroundColor Yellow
}

Write-Host "`n📊 Final Git Status:" -ForegroundColor Yellow
git status

Write-Host "`n🏁 Setup completed!" -ForegroundColor Green
Write-Host "New Repository: https://github.com/DroHadTo/SSPAY" -ForegroundColor Cyan
