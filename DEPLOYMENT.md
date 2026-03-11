# AWS Deployment Guide

⚠️ **IMPORTANT**: Before deployment, set up your environment files for security.

## Quick Setup:
1. Copy environment templates:
   ```bash
   cp backend/.env.template backend/.env
   cp frontend/.env.template frontend/.env
   ```

2. Edit `backend/.env` with your actual AWS credentials and API keys

3. Run deployment:
   ```cmd
   .\start-deployment.bat
   ```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed instructions.

This guide provides automated deployment of the Stock Market Application using AWS Lambda (backend) and AWS Amplify (frontend).

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **GitHub Repository** with your code
   - Push your code to GitHub
   - Create a Personal Access Token with repo permissions

3. **Alpha Vantage API Key**
   - Get free API key from https://www.alphavantage.co/support/#api-key

## Quick Deployment

### Windows
```cmd
deploy.bat
```

### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

## Manual Deployment

If you prefer manual deployment:

1. **Update parameters file**
   ```bash
   # Edit cloudformation/parameters.json with your values
   ```

2. **Deploy using AWS CLI**
   ```bash
   # Create S3 bucket for Lambda deployment
   aws s3 mb s3://stock-market-lambda-$(aws sts get-caller-identity --query Account --output text)
   
   # Build and upload Lambda functions
   cd lambda/layer && npm install --production
   # ... (see deploy.sh for complete steps)
   
   # Deploy CloudFormation stack
   aws cloudformation deploy \
     --template-file cloudformation/template.yaml \
     --stack-name stock-market-app \
     --parameter-overrides file://cloudformation/parameters.json \
     --capabilities CAPABILITY_IAM
   ```

## What Gets Deployed

### AWS Resources Created:
- **DynamoDB Tables**: Users, Transactions, Portfolio
- **Lambda Functions**: Auth, Stocks, Trading
- **API Gateway**: HTTP API with CORS enabled
- **Amplify App**: Frontend hosting with auto-build
- **IAM Roles**: Lambda execution roles with DynamoDB permissions
- **S3 Bucket**: Lambda deployment artifacts

### Architecture:
```
Frontend (Amplify) → API Gateway → Lambda Functions → DynamoDB
```

## Post-Deployment

1. **Frontend URL**: Available immediately after Amplify build completes
2. **API Endpoint**: Ready for frontend consumption
3. **Database**: Tables auto-created and ready

## Environment Variables

The deployment automatically configures:
- `REACT_APP_API_URL` in frontend
- Lambda environment variables for DynamoDB table names
- JWT secrets and API keys

## Cleanup

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name stock-market-app
aws s3 rm s3://stock-market-lambda-$(aws sts get-caller-identity --query Account --output text) --recursive
aws s3 rb s3://stock-market-lambda-$(aws sts get-caller-identity --query Account --output text)
```

## Troubleshooting

1. **Amplify Build Fails**: Check GitHub token permissions
2. **Lambda Errors**: Check CloudWatch logs
3. **API Gateway Issues**: Verify CORS configuration
4. **DynamoDB Access**: Check IAM role permissions

## Cost Estimation

- **Lambda**: Pay per request (free tier: 1M requests/month)
- **DynamoDB**: Pay per request (free tier: 25 GB storage)
- **API Gateway**: Pay per request (free tier: 1M requests/month)
- **Amplify**: Pay per build minute and storage
- **S3**: Minimal storage costs for Lambda artifacts

Estimated monthly cost for moderate usage: $5-20