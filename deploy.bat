@echo off
setlocal enabledelayedexpansion

REM Stock Market App Deployment Script for Windows
echo Starting Stock Market App Deployment...

REM Configuration
set STACK_NAME=stock-market-app
set REGION=us-east-1

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if user is logged in to AWS
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI is not configured. Please run 'aws configure' first.
    exit /b 1
)

REM Get parameters from user
set /p GITHUB_REPO="Enter GitHub repository URL (e.g., https://github.com/username/stock-market-app): "
set /p GITHUB_TOKEN="Enter GitHub Personal Access Token: "
set /p GITHUB_BRANCH="Enter GitHub branch name (default: main): "
if "!GITHUB_BRANCH!"=="" set GITHUB_BRANCH=main
set /p ALPHA_VANTAGE_API_KEY="Enter Alpha Vantage API Key: "
set /p JWT_SECRET="Enter JWT Secret (leave empty to generate): "

REM Generate random JWT secret if not provided
if "!JWT_SECRET!"=="" (
    for /f %%i in ('powershell -command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))"') do set JWT_SECRET=%%i
    echo Generated JWT secret
)

REM Get AWS Account ID
for /f %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
set BUCKET_NAME=stock-market-lambda-!ACCOUNT_ID!

echo Starting deployment process...

REM Create S3 bucket for Lambda deployment
echo Creating S3 bucket for Lambda deployment...
aws s3 mb s3://!BUCKET_NAME! --region !REGION! 2>nul || echo Bucket already exists

REM Build Lambda layer
echo Building Lambda layer...
cd lambda\layer
call npm install --production
mkdir nodejs 2>nul
xcopy /E /I node_modules nodejs\node_modules
powershell -command "Compress-Archive -Path nodejs -DestinationPath ..\..\lambda-layer.zip -Force"
cd ..\..

REM Upload Lambda layer
echo Uploading Lambda layer...
aws s3 cp lambda-layer.zip s3://!BUCKET_NAME!/lambda-layer.zip

REM Package Lambda functions
echo Packaging Lambda functions...

REM Auth function
cd lambda\auth
powershell -command "Compress-Archive -Path index.js -DestinationPath ..\..\auth-function.zip -Force"
cd ..\..
aws s3 cp auth-function.zip s3://!BUCKET_NAME!/auth-function.zip

REM Stocks function
cd lambda\stocks
powershell -command "Compress-Archive -Path index.js -DestinationPath ..\..\stocks-function.zip -Force"
cd ..\..
aws s3 cp stocks-function.zip s3://!BUCKET_NAME!/stocks-function.zip

REM Trading function
cd lambda\trading
powershell -command "Compress-Archive -Path index.js -DestinationPath ..\..\trading-function.zip -Force"
cd ..\..
aws s3 cp trading-function.zip s3://!BUCKET_NAME!/trading-function.zip

REM Deploy CloudFormation stack
echo Deploying CloudFormation stack...
aws cloudformation deploy ^
    --template-file cloudformation\template.yaml ^
    --stack-name !STACK_NAME! ^
    --parameter-overrides ^
        GitHubRepo=!GITHUB_REPO! ^
        GitHubToken=!GITHUB_TOKEN! ^
        GitHubBranch=!GITHUB_BRANCH! ^
        AlphaVantageApiKey=!ALPHA_VANTAGE_API_KEY! ^
        JWTSecret=!JWT_SECRET! ^
    --capabilities CAPABILITY_IAM ^
    --region !REGION!

REM Get outputs
echo Getting deployment outputs...
for /f %%i in ('aws cloudformation describe-stacks --stack-name !STACK_NAME! --query "Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue" --output text --region !REGION!') do set API_ENDPOINT=%%i
for /f %%i in ('aws cloudformation describe-stacks --stack-name !STACK_NAME! --query "Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue" --output text --region !REGION!') do set AMPLIFY_URL=%%i

REM Update frontend environment
echo Updating frontend environment...
echo REACT_APP_API_URL=!API_ENDPOINT! > frontend\.env
echo.
echo IMPORTANT: .env file created with API endpoint.
echo This file is excluded from git for security.

REM Clean up temporary files
del /f lambda-layer.zip auth-function.zip stocks-function.zip trading-function.zip 2>nul
rmdir /s /q lambda\layer\nodejs 2>nul

echo.
echo Deployment completed successfully!
echo.
echo === Deployment Information ===
echo API Endpoint: !API_ENDPOINT!
echo Frontend URL: !AMPLIFY_URL!
echo Stack Name: !STACK_NAME!
echo Region: !REGION!
echo.
echo Your application will be available at: !AMPLIFY_URL!
echo Note: Amplify build may take a few minutes to complete.

pause