const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const path = event.rawPath || event.path;
  const method = event.requestContext.http.method;
  
  try {
    const user = await verifyToken(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    
    if (path.includes('/api/stocks/price/') && method === 'GET') {
      const symbol = event.pathParameters.symbol;
      return await getStockPrice(symbol);
    } else if (path.includes('/api/stocks/recommendation/') && method === 'GET') {
      const symbol = event.pathParameters.symbol;
      return await getRecommendation(symbol, user.userId);
    } else if (path === '/api/stocks/portfolio' && method === 'GET') {
      return await getPortfolio(user.userId);
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

async function verifyToken(event) {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

async function getStockPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
  const response = await axios.get(url);
  const quote = response.data['Global Quote'];
  
  if (!quote || !quote['05. price']) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Stock not found' }) };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: quote['06. volume']
    })
  };
}

async function getRecommendation(symbol, userId) {
  const stockData = await getStockPrice(symbol);
  if (stockData.statusCode !== 200) return stockData;
  
  const stock = JSON.parse(stockData.body);
  const portfolio = await getUserPortfolio(userId);
  
  const holding = portfolio.find(h => h.symbol === symbol);
  const changePercent = parseFloat(stock.changePercent);
  
  let action = 'HOLD';
  let confidence = 'MEDIUM';
  let reasoning = 'Stock shows neutral momentum.';
  
  if (changePercent > 2) {
    action = 'BUY';
    confidence = 'HIGH';
    reasoning = 'Strong upward momentum detected. Good entry point.';
  } else if (changePercent < -2) {
    action = holding ? 'SELL' : 'HOLD';
    confidence = 'MEDIUM';
    reasoning = 'Downward trend detected. Consider reducing exposure.';
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      symbol,
      action,
      confidence,
      reasoning,
      currentPrice: stock.price,
      targetPrice: stock.price * (changePercent > 0 ? 1.05 : 0.95)
    })
  };
}

async function getPortfolio(userId) {
  const portfolio = await getUserPortfolio(userId);
  
  const portfolioWithPrices = await Promise.all(
    portfolio.map(async (holding) => {
      try {
        const stockData = await getStockPrice(holding.symbol);
        const stock = JSON.parse(stockData.body);
        return {
          ...holding,
          currentPrice: stock.price,
          totalValue: stock.price * holding.quantity,
          change: stock.change,
          changePercent: stock.changePercent
        };
      } catch {
        return { ...holding, currentPrice: 0, totalValue: 0, change: 0, changePercent: '0%' };
      }
    })
  );
  
  return { statusCode: 200, body: JSON.stringify(portfolioWithPrices) };
}

async function getUserPortfolio(userId) {
  const params = {
    TableName: process.env.PORTFOLIO_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  };
  
  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
}