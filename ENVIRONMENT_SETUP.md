# Environment Setup Guide

## 🔒 Security Notice
Environment files (.env) contain sensitive information and are excluded from git for security.

## 📋 Setup Instructions

### Backend Environment Setup
1. Copy the template file:
   ```bash
   cp backend/.env.template backend/.env
   ```

2. Edit `backend/.env` with your actual values:
   ```
   PORT=5000
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-actual-access-key
   AWS_SECRET_ACCESS_KEY=your-actual-secret-key
   JWT_SECRET=your-random-jwt-secret
   ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
   ```

### Frontend Environment Setup
1. Copy the template file:
   ```bash
   cp frontend/.env.template frontend/.env
   ```

2. The deployment script will automatically update this with your API Gateway URL.

## 🚀 Automated Deployment
The deployment scripts will:
- ✅ Create .env files automatically
- ✅ Configure API endpoints
- ✅ Keep sensitive data secure

## 🔑 Required API Keys

### Alpha Vantage API Key
1. Visit: https://www.alphavantage.co/support/#api-key
2. Sign up for free account
3. Get your API key
4. Add to .env file

### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Use during deployment (not stored in files)

### AWS Credentials
1. Run `aws configure` to set up AWS CLI
2. Or use IAM roles if running on EC2

## ⚠️ Important Notes
- Never commit .env files to git
- Use different keys for development/production
- Rotate keys regularly
- Use AWS IAM roles in production instead of access keys