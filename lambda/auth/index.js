const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const path = event.rawPath || event.path;
  const method = event.requestContext.http.method;
  
  try {
    if (path === '/api/auth/register' && method === 'POST') {
      return await register(event);
    } else if (path === '/api/auth/login' && method === 'POST') {
      return await login(event);
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function register(event) {
  const { email, password, name } = JSON.parse(event.body);
  
  const params = {
    TableName: process.env.USERS_TABLE,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  };
  
  const result = await docClient.send(new QueryCommand(params));
  if (result.Items && result.Items.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User already exists' })
    };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  
  const user = {
    userId,
    email,
    password: hashedPassword,
    name,
    balance: 10000,
    createdAt: new Date().toISOString()
  };
  
  await docClient.send(new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: user
  }));
  
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'User created successfully',
      user: { userId, email, name, balance: user.balance },
      token
    })
  };
}

async function login(event) {
  const { email, password } = JSON.parse(event.body);
  
  const params = {
    TableName: process.env.USERS_TABLE,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  };
  
  const result = await docClient.send(new QueryCommand(params));
  if (!result.Items || result.Items.length === 0) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  }
  
  const user = result.Items[0];
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  }
  
  const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      user: { userId: user.userId, email: user.email, name: user.name, balance: user.balance },
      token
    })
  };
}
