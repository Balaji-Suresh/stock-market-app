const express = require('express');
const stockService = require('../services/stockService');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/price/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await stockService.getStockPrice(symbol);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recommendation/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const userPortfolio = await Transaction.getUserPortfolio(req.user.userId);
    const recommendation = await stockService.getAIRecommendation(symbol, userPortfolio);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/portfolio', auth, async (req, res) => {
  try {
    const portfolio = await Transaction.getUserPortfolio(req.user.userId);
    
    // Get current prices for all stocks in portfolio
    const portfolioWithPrices = await Promise.all(
      portfolio.map(async (holding) => {
        try {
          const stockData = await stockService.getStockPrice(holding.symbol);
          return {
            ...holding,
            currentPrice: stockData.price,
            totalValue: stockData.price * holding.quantity,
            change: stockData.change,
            changePercent: stockData.changePercent
          };
        } catch (error) {
          return {
            ...holding,
            currentPrice: 0,
            totalValue: 0,
            change: 0,
            changePercent: '0%'
          };
        }
      })
    );

    res.json(portfolioWithPrices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;