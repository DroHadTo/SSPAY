# GitHub Deployment Script for Solana Crypto Dropship Store
# This script will push your complete project to GitHub

Write-Host "🚀 Starting GitHub Deployment..." -ForegroundColor Green
Write-Host "Repository: https://github.com/DroHadTo/Solana-shop.git" -ForegroundColor Cyan

# Navigate to project directory
Set-Location "C:\Users\lenD25\Desktop\SSPAY"
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if Git is initialized
if (Test-Path ".git") {
    Write-Host "✅ Git repository found" -ForegroundColor Green
} else {
    Write-Host "❌ Git repository not found, initializing..." -ForegroundColor Red
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Show current status
Write-Host "`n📋 Current Git status:" -ForegroundColor Yellow
git status --porcelain

# Add all files
Write-Host "`n📦 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Check what's staged
Write-Host "`n📋 Files staged for commit:" -ForegroundColor Yellow
git diff --cached --name-only

# Commit changes
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
$commitResult = git commit -m "Complete Solana Crypto Dropship Store with Printify integration" 2>&1
Write-Host $commitResult -ForegroundColor White

# Remove existing remote if it exists
Write-Host "`n🔗 Configuring remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null

# Add remote
git remote add origin https://github.com/DroHadTo/Solana-shop.git
Write-Host "✅ Remote origin added" -ForegroundColor Green

# Verify remote
Write-Host "`n📡 Remote repositories:" -ForegroundColor Yellow
git remote -v

# Set main branch
Write-Host "`n🌟 Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "This may take a moment..." -ForegroundColor Cyan

$pushResult = git push -u origin main 2>&1
Write-Host $pushResult -ForegroundColor White

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 SUCCESS! Your project has been pushed to GitHub!" -ForegroundColor Green
    Write-Host "🌐 View your repository at: https://github.com/DroHadTo/Solana-shop" -ForegroundColor Cyan
    Write-Host "`n📋 What's included:" -ForegroundColor Yellow
    Write-Host "  ✅ Complete Solana Crypto Dropship Store" -ForegroundColor White
    Write-Host "  ✅ Printify API integration" -ForegroundColor White
    Write-Host "  ✅ Crypto payment system" -ForegroundColor White
    Write-Host "  ✅ Frontend and backend code" -ForegroundColor White
    Write-Host "  ✅ Documentation (README.md)" -ForegroundColor White
    Write-Host "  ✅ Setup instructions" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed. Error details above." -ForegroundColor Red
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your GitHub authentication" -ForegroundColor White
    Write-Host "  2. Verify repository permissions" -ForegroundColor White
    Write-Host "  3. Try: git push --set-upstream origin main --force" -ForegroundColor White
}

Write-Host "`n📊 Final repository status:" -ForegroundColor Yellow
git status

Write-Host "`n🏁 Deployment script completed!" -ForegroundColor Green
