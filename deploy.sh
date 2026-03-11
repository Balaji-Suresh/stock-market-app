#!/bin/bash

# Stock Market App Deployment Script
set -e

# Configuration
STACK_NAME="stock-market-app"
REGION="us-east-1"
GITHUB_REPO=""
GITHUB_TOKEN=""
GITHUB_BRANCH="main"
ALPHA_VANTAGE_API_KEY=""
JWT_SECRET=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get parameters from user
read -p "Enter GitHub repository URL (e.g., https://github.com/username/stock-market-app): " GITHUB_REPO
read -s -p "Enter GitHub Personal Access Token: " GITHUB_TOKEN
echo
read -p "Enter GitHub branch name (default: main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}
read -s -p "Enter Alpha Vantage API Key: " ALPHA_VANTAGE_API_KEY
echo
read -s -p "Enter JWT Secret: " JWT_SECRET
echo

# Generate random JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    print_status "Generated JWT secret"
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="stock-market-lambda-${ACCOUNT_ID}"

print_status "Starting deployment process..."

# Create S3 bucket for Lambda deployment
print_status "Creating S3 bucket for Lambda deployment..."
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || print_warning "Bucket already exists"

# Build Lambda layer
print_status "Building Lambda layer..."
cd lambda/layer
npm install --production
mkdir -p nodejs
cp -r node_modules nodejs/
zip -r ../../lambda-layer.zip nodejs/
cd ../..

# Upload Lambda layer
print_status "Uploading Lambda layer..."
aws s3 cp lambda-layer.zip s3://${BUCKET_NAME}/lambda-layer.zip

# Package Lambda functions
print_status "Packaging Lambda functions..."

# Auth function
cd lambda/auth
zip -r ../../auth-function.zip index.js
cd ../..
aws s3 cp auth-function.zip s3://${BUCKET_NAME}/auth-function.zip

# Stocks function
cd lambda/stocks
zip -r ../../stocks-function.zip index.js
cd ../..
aws s3 cp stocks-function.zip s3://${BUCKET_NAME}/stocks-function.zip

# Trading function
cd lambda/trading
zip -r ../../trading-function.zip index.js
cd ../..
aws s3 cp trading-function.zip s3://${BUCKET_NAME}/trading-function.zip

# Deploy CloudFormation stack
print_status "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation/template.yaml \
    --stack-name ${STACK_NAME} \
    --parameter-overrides \
        GitHubRepo=${GITHUB_REPO} \
        GitHubToken=${GITHUB_TOKEN} \
        GitHubBranch=${GITHUB_BRANCH} \
        AlphaVantageApiKey=${ALPHA_VANTAGE_API_KEY} \
        JWTSecret=${JWT_SECRET} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Get outputs
print_status "Getting deployment outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text --region ${REGION})
AMPLIFY_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue' --output text --region ${REGION})

# Update frontend environment
print_status "Updating frontend environment..."
echo "REACT_APP_API_URL=${API_ENDPOINT}" > frontend/.env
echo
print_status "IMPORTANT: .env file created with API endpoint."
print_warning "This file is excluded from git for security."

# Clean up temporary files
rm -f lambda-layer.zip auth-function.zip stocks-function.zip trading-function.zip
rm -rf lambda/layer/nodejs

print_status "Deployment completed successfully!"
echo
echo "=== Deployment Information ==="
echo "API Endpoint: ${API_ENDPOINT}"
echo "Frontend URL: ${AMPLIFY_URL}"
echo "Stack Name: ${STACK_NAME}"
echo "Region: ${REGION}"
echo
print_status "Your application will be available at: ${AMPLIFY_URL}"
print_warning "Note: Amplify build may take a few minutes to complete."