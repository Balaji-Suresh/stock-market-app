const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const stockService = require('../services/stockService');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/buy', auth, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user.userId;

    // Get current stock price
    const stockData = await stockService.getStockPrice(symbol);
    const totalCost = stockData.price * quantity;

    // Check if user has sufficient balance
    if (req.user.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      symbol,
      type: 'BUY',
      quantity,
      price: stockData.price
    });

    // Update user balance
    const newBalance = req.user.balance - totalCost;
    await User.updateBalance(userId, newBalance);

    // Update portfolio
    await Transaction.updatePortfolio(userId, symbol, quantity, 'BUY');

    res.json({
      message: 'Stock purchased successfully',
      transaction,
      newBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sell', auth, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user.userId;

    // Check if user owns enough shares
    const portfolio = await Transaction.getUserPortfolio(userId);
    const holding = portfolio.find(h => h.symbol === symbol);
    
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient shares to sell' });
    }

    // Get current stock price
    const stockData = await stockService.getStockPrice(symbol);
    const totalValue = stockData.price * quantity;

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      symbol,
      type: 'SELL',
      quantity,
      price: stockData.price
    });

    // Update user balance
    const newBalance = req.user.balance + totalValue;
    await User.updateBalance(userId, newBalance);

    // Update portfolio
    await Transaction.updatePortfolio(userId, symbol, quantity, 'SELL');

    res.json({
      message: 'Stock sold successfully',
      transaction,
      newBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.getUserTransactions(req.user.userId);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;