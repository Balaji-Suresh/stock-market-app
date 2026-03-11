const { dynamodb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  static async create(transactionData) {
    const transaction = {   
      transactionId: uuidv4(),
      userId: transactionData.userId,
      symbol: transactionData.symbol,
      type: transactionData.type, // 'BUY' or 'SELL'
      quantity: transactionData.quantity,
      price: transactionData.price,
      total: transactionData.quantity * transactionData.price,
      timestamp: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: 'Transactions',
      Item: transaction
    }).promise();

    return transaction;
  }

  static async getUserTransactions(userId) {
    const result = await dynamodb.scan({
      TableName: 'Transactions',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }).promise();

    return result.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async updatePortfolio(userId, symbol, quantity, type) {
    try {
      const result = await dynamodb.get({
        TableName: 'Portfolio',
        Key: { userId, symbol }
      }).promise();

      let currentQuantity = result.Item ? result.Item.quantity : 0;
      let newQuantity = type === 'BUY' ? currentQuantity + quantity : currentQuantity - quantity;

      if (newQuantity <= 0) {
        await dynamodb.delete({
          TableName: 'Portfolio',
          Key: { userId, symbol }
        }).promise();
      } else {
        await dynamodb.put({
          TableName: 'Portfolio',
          Item: {
            userId,
            symbol,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString()
          }
        }).promise();
      }

      return newQuantity;
    } catch (error) {
      throw new Error('Failed to update portfolio');
    }
  }

  static async getUserPortfolio(userId) {
    const result = await dynamodb.query({
      TableName: 'Portfolio',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }).promise();

    return result.Items;
  }
}

module.exports = Transaction;