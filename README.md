<<<<<<< HEAD
# Stock Market Application

A full-stack stock market application with React.js frontend, Express.js backend (with Lambda deployment option), DynamoDB database, and AI research assistant.

## 🏗️ Architecture Options

### Option 1: Traditional Deployment
- **Frontend**: React.js served locally
- **Backend**: Express.js server
- **Database**: DynamoDB

### Option 2: Serverless AWS Deployment  
- **Frontend**: AWS Amplify hosting
- **Backend**: AWS Lambda functions
- **Database**: DynamoDB
- **API**: API Gateway

## 📁 Project Structure

```
stock-market-app/
├── frontend/                 # React.js application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.template
├── backend/                  # Express.js server
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── .env.template
├── lambda/                   # AWS Lambda functions
│   ├── auth/
│   ├── stocks/
│   ├── trading/
│   └── layer/
├── cloudformation/           # AWS infrastructure
│   ├── template.yaml
│   └── parameters.json
├── deploy.bat               # Windows deployment
├── deploy.sh                # Linux/Mac deployment
└── start-deployment.bat     # One-click deployment
```

## 🚀 Quick Start

### Traditional Development
```bash
# Backend
cd backend
npm install
cp .env.template .env
# Edit .env with your credentials
npm run dev

# Frontend  
cd frontend
npm install
npm start
```

### AWS Serverless Deployment
```bash
# One command deployment
.\start-deployment.bat
```

## 📋 Features

- User authentication (register/login)
- Real-time stock price fetching
- Buy/sell stocks functionality
- Portfolio management
- AI-powered stock recommendations
- Transaction history

## 🔧 Environment Setup

### Backend (.env)
```
PORT=5000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
# Or your API Gateway URL for AWS deployment
```

## 🔑 Required API Keys

- **Alpha Vantage**: Get free API key from https://www.alphavantage.co/support/#api-key
- **AWS Credentials**: Configure via `aws configure`
- **GitHub Token**: For Amplify deployment (repo permissions)

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - AWS deployment guide
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Environment configuration
- [API Documentation](#api-endpoints) - API reference

## 🛠️ Technologies Used

- **Frontend**: React.js, TypeScript, Axios
- **Backend**: Express.js, Node.js / AWS Lambda
- **Database**: AWS DynamoDB
- **Authentication**: JWT
- **Stock Data**: Alpha Vantage API
- **Infrastructure**: AWS CloudFormation
- **Hosting**: AWS Amplify

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Stocks
- `GET /api/stocks/price/:symbol` - Get stock price
- `GET /api/stocks/recommendation/:symbol` - Get AI recommendation
- `GET /api/stocks/portfolio` - Get user portfolio

### Trading
- `POST /api/trading/buy` - Buy stocks
- `POST /api/trading/sell` - Sell stocks
- `GET /api/trading/transactions` - Get transaction history

## 🔒 Security

- Environment variables excluded from git
- JWT token authentication
- AWS IAM role-based permissions
- CORS configuration
- Input validation

## 💰 Cost Estimation (AWS)

- **Lambda**: Pay per request (free tier: 1M requests/month)
- **DynamoDB**: Pay per request (free tier: 25 GB storage)
- **API Gateway**: Pay per request (free tier: 1M requests/month)
- **Amplify**: Pay per build minute and storage

Estimated monthly cost for moderate usage: $5-20

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.
=======
# stock-market-app
>>>>>>> 01c35de1cb4fd28394366d5fe0556e8a9621087a
