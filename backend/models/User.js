const { dynamodb } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = {
      userId,
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      balance: 10000, // Starting balance
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: 'Users',
      Item: user
    }).promise();

    return { userId, email: user.email, name: user.name, balance: user.balance };
  }

  static async findByEmail(email) {
    const result = await dynamodb.scan({
      TableName: 'Users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }).promise();

    return result.Items[0] || null;
  }

  static async findById(userId) {
    const result = await dynamodb.get({
      TableName: 'Users',
      Key: { userId }
    }).promise();

    return result.Item || null;
  }

  static async updateBalance(userId, newBalance) {
    await dynamodb.update({
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: 'SET balance = :balance',
      ExpressionAttributeValues: { ':balance': newBalance }
    }).promise();
  }

  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { userId: user.userId, email: user.email, name: user.name, balance: user.balance } };
  }
}

module.exports = User;