const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const path = event.rawPath || event.path;
  const method = event.requestContext.http.method;
  
  try {
    const user = await verifyToken(event);
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    
    if (path === '/api/trading/buy' && method === 'POST') {
      return await buyStock(event, user);
    } else if (path === '/api/trading/sell' && method === 'POST') {
      return await sellStock(event, user);
    } else if (path === '/api/trading/transactions' && method === 'GET') {
      return await getTransactions(user.userId);
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
    throw new Error('Stock not found');
  }
  
  return parseFloat(quote['05. price']);
}

async function buyStock(event, user) {
  const { symbol, quantity } = JSON.parse(event.body);
  const userId = user.userId;
  
  const stockPrice = await getStockPrice(symbol);
  const totalCost = stockPrice * quantity;
  
  // Get user balance
  const userResult = await docClient.send(new GetCommand({
    TableName: 'Users',
    Key: { userId }
  }));
  
  if (!userResult.Item || userResult.Item.balance < totalCost) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Insufficient balance' }) };
  }
  
  // Create transaction
  const transactionId = uuidv4();
  await docClient.send(new PutCommand({
    TableName: process.env.TRANSACTIONS_TABLE,
    Item: {
      transactionId,
      userId,
      symbol,
      type: 'BUY',
      quantity,
      price: stockPrice,
      timestamp: new Date().toISOString()
    }
  }));
  
  // Update user balance
  const newBalance = userResult.Item.balance - totalCost;
  await docClient.send(new UpdateCommand({
    TableName: 'Users',
    Key: { userId },
    UpdateExpression: 'SET balance = :balance',
    ExpressionAttributeValues: { ':balance': newBalance }
  }));
  
  // Update portfolio
  await updatePortfolio(userId, symbol, quantity, 'BUY');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Stock purchased successfully',
      transactionId,
      newBalance
    })
  };
}

async function sellStock(event, user) {
  const { symbol, quantity } = JSON.parse(event.body);
  const userId = user.userId;
  
  // Check portfolio
  const portfolioResult = await docClient.send(new GetCommand({
    TableName: process.env.PORTFOLIO_TABLE,
    Key: { userId, symbol }
  }));
  
  if (!portfolioResult.Item || portfolioResult.Item.quantity < quantity) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Insufficient shares to sell' }) };
  }
  
  const stockPrice = await getStockPrice(symbol);
  const totalValue = stockPrice * quantity;
  
  // Create transaction
  const transactionId = uuidv4();
  await docClient.send(new PutCommand({
    TableName: process.env.TRANSACTIONS_TABLE,
    Item: {
      transactionId,
      userId,
      symbol,
      type: 'SELL',
      quantity,
      price: stockPrice,
      timestamp: new Date().toISOString()
    }
  }));
  
  // Get user and update balance
  const userResult = await docClient.send(new GetCommand({
    TableName: 'Users',
    Key: { userId }
  }));
  
  const newBalance = userResult.Item.balance + totalValue;
  await docClient.send(new UpdateCommand({
    TableName: 'Users',
    Key: { userId },
    UpdateExpression: 'SET balance = :balance',
    ExpressionAttributeValues: { ':balance': newBalance }
  }));
  
  // Update portfolio
  await updatePortfolio(userId, symbol, quantity, 'SELL');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Stock sold successfully',
      transactionId,
      newBalance
    })
  };
}

async function updatePortfolio(userId, symbol, quantity, type) {
  const portfolioResult = await docClient.send(new GetCommand({
    TableName: process.env.PORTFOLIO_TABLE,
    Key: { userId, symbol }
  }));
  
  if (portfolioResult.Item) {
    const currentQuantity = portfolioResult.Item.quantity;
    const newQuantity = type === 'BUY' ? currentQuantity + quantity : currentQuantity - quantity;
    
    if (newQuantity <= 0) {
      // Remove from portfolio if quantity is 0 or less
      await docClient.send(new UpdateCommand({
        TableName: process.env.PORTFOLIO_TABLE,
        Key: { userId, symbol },
        UpdateExpression: 'REMOVE quantity'
      }));
    } else {
      await docClient.send(new UpdateCommand({
        TableName: process.env.PORTFOLIO_TABLE,
        Key: { userId, symbol },
        UpdateExpression: 'SET quantity = :quantity',
        ExpressionAttributeValues: { ':quantity': newQuantity }
      }));
    }
  } else if (type === 'BUY') {
    await docClient.send(new PutCommand({
      TableName: process.env.PORTFOLIO_TABLE,
      Item: { userId, symbol, quantity }
    }));
  }
}

async function getTransactions(userId) {
  const params = {
    TableName: process.env.TRANSACTIONS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false
  };
  
  const result = await docClient.send(new QueryCommand(params));
  return { statusCode: 200, body: JSON.stringify(result.Items || []) };
}