@echo off
echo Starting GitHub deployment...
cd /d "C:\Users\lenD25\Desktop\SSPAY"

echo.
echo === Current Directory ===
cd

echo.
echo === Files in Directory ===
dir /b

echo.
echo === Git Status ===
git status

echo.
echo === Adding Files ===
git add .

echo.
echo === Committing ===
git commit -m "Complete Solana Crypto Dropship Store"

echo.
echo === Setting Remote ===
git remote remove origin 2>nul
git remote add origin https://github.com/DroHadTo/Solana-shop.git

echo.
echo === Verifying Remote ===
git remote -v

echo.
echo === Pushing to GitHub ===
git push -u origin main

echo.
echo === Final Status ===
git status

echo.
echo Deployment completed!
pause
