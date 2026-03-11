@echo off
echo ========================================
echo   Git Repository Setup & Push (Fixed)
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    echo.
)

REM Get repository URL from user
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/stock-market-app.git): "

REM Add remote origin if not exists
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo Pulling existing repository content...
git pull origin main --allow-unrelated-histories

echo.
echo Adding all files to git...
git add .

echo.
echo Committing changes...
git commit -m "Complete stock market app with AWS serverless deployment - frontend and backend"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   Repository Push Complete!
echo ========================================
echo.
echo Your repository now contains:
echo - Frontend React.js application
echo - Backend Express.js server  
echo - Lambda functions for serverless deployment
echo - CloudFormation infrastructure templates
echo - Automated deployment scripts
echo.
echo Next steps:
echo 1. Verify your code is visible on GitHub
echo 2. Run: .\start-deployment.bat
echo.
pause