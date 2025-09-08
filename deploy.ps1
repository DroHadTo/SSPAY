# Deploy script for Solana Crypto Dropship Store
Write-Host "Starting deployment to GitHub..." -ForegroundColor Green

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Yellow
git status

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Initial commit: Solana Crypto Dropship Store with Printify integration"

# Add remote if not exists
Write-Host "Setting up remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/DroHadTo/Solana-shop.git

# Set main branch
Write-Host "Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your project is now available at: https://github.com/DroHadTo/Solana-shop" -ForegroundColor Cyan
