@echo off
echo ========================================
echo   Stock Market App - AWS Deployment
echo ========================================
echo.
echo This will deploy your app to AWS with:
echo - Lambda functions for backend API
echo - Amplify for frontend hosting  
echo - DynamoDB for data storage
echo - API Gateway for REST endpoints
echo.
echo Prerequisites:
echo - AWS CLI configured (aws configure)
echo - GitHub repository with your code
echo - Alpha Vantage API key
echo.
set /p confirm="Continue with deployment? (y/N): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Starting automated deployment...
call deploy.bat

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================