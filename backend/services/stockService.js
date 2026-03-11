const axios = require('axios');
const { dynamodb } = require('../config/database');

class StockService {
  constructor() {
    this.exchangeRate = 83.25; // USD to INR - in production, fetch live rates
  }

  async getStockPrice(symbol) {
    try {
      // Handle Indian stocks (.NS suffix)
      const cleanSymbol = symbol.replace('.NS', '');
      
      // For demo purposes, return mock data for Indian stocks
      if (symbol.includes('.NS')) {
        return this.getIndianStockData(cleanSymbol);
      }
      
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );
      
      const quote = response.data['Global Quote'];
      if (!quote || !quote['01. symbol']) {
        throw new Error('Invalid response from Alpha Vantage');
      }
      
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent']
      };
    } catch (error) {
      console.error('Stock price fetch error:', error.message);
      // Return mock data as fallback
      return this.getMockStockData(symbol);
    }
  }

  getIndianStockData(symbol) {
    const indianStocks = {
      'RELIANCE': { price: 2456.75, change: 23.45, changePercent: '0.96%' },
      'TCS': { price: 3678.90, change: -12.30, changePercent: '-0.33%' },
      'HDFCBANK': { price: 1543.20, change: 8.75, changePercent: '0.57%' },
      'INFY': { price: 1456.80, change: 15.60, changePercent: '1.08%' },
      'ICICIBANK': { price: 987.45, change: -5.25, changePercent: '-0.53%' },
      'HINDUNILVR': { price: 2234.60, change: 12.80, changePercent: '0.58%' },
      'KOTAKBANK': { price: 1876.30, change: -8.90, changePercent: '-0.47%' },
      'BHARTIARTL': { price: 876.45, change: 4.20, changePercent: '0.48%' },
      'ITC': { price: 456.75, change: 2.35, changePercent: '0.52%' },
      'SBIN': { price: 634.80, change: -3.45, changePercent: '-0.54%' }
    };

    const stockData = indianStocks[symbol] || { price: 1000, change: 0, changePercent: '0.00%' };
    
    return {
      symbol: `${symbol}.NS`,
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent
    };
  }

  getMockStockData(symbol) {
    // Fallback mock data for when API fails
    const mockData = {
      'AAPL': { price: 175.50, change: 2.30, changePercent: '1.33%' },
      'GOOGL': { price: 142.80, change: -1.20, changePercent: '-0.83%' },
      'TSLA': { price: 248.90, change: 5.60, changePercent: '2.30%' },
      'MSFT': { price: 378.20, change: 1.80, changePercent: '0.48%' }
    };

    const stockData = mockData[symbol] || { price: 100, change: 0, changePercent: '0.00%' };
    
    return {
      symbol,
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent
    };
  }

  async getAIRecommendation(symbol, userPortfolio) {
    try {
      const stockData = await this.getStockPrice(symbol);
      const historicalData = await this.getHistoricalData(symbol);
      
      // Enhanced AI logic for Indian market
      const recommendation = this.analyzeStock(stockData, historicalData, userPortfolio);
      
      return {
        symbol,
        recommendation: recommendation.action,
        confidence: recommendation.confidence,
        reason: recommendation.reason,
        targetPrice: recommendation.targetPrice
      };
    } catch (error) {
      throw new Error('Failed to generate AI recommendation');
    }
  }

  analyzeStock(stockData, historicalData, userPortfolio) {
    const currentPrice = stockData.price;
    const change = stockData.change;
    const changePercent = parseFloat(stockData.changePercent.replace('%', ''));
    
    // Enhanced analysis for Indian stocks
    if (stockData.symbol.includes('.NS')) {
      return this.analyzeIndianStock(stockData, changePercent);
    }
    
    // Original logic for US stocks
    if (change > 0 && Math.abs(changePercent) > 2) {
      return {
        action: 'BUY',
        confidence: 0.75,
        reason: 'Strong upward momentum detected',
        targetPrice: currentPrice * 1.1
      };
    } else if (change < 0 && Math.abs(changePercent) > 3) {
      return {
        action: 'SELL',
        confidence: 0.8,
        reason: 'Significant downward trend',
        targetPrice: currentPrice * 0.95
      };
    } else {
      return {
        action: 'HOLD',
        confidence: 0.6,
        reason: 'Market conditions are stable',
        targetPrice: currentPrice
      };
    }
  }

  analyzeIndianStock(stockData, changePercent) {
    const currentPrice = stockData.price;
    const symbol = stockData.symbol.replace('.NS', '');
    
    // Sector-specific analysis
    const bankingStocks = ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN'];
    const techStocks = ['TCS', 'INFY', 'HCLTECH', 'WIPRO'];
    const fmcgStocks = ['HINDUNILVR', 'ITC'];
    
    let sectorMultiplier = 1;
    let sectorReason = '';
    
    if (bankingStocks.includes(symbol)) {
      sectorMultiplier = 1.1;
      sectorReason = 'Banking sector showing resilience';
    } else if (techStocks.includes(symbol)) {
      sectorMultiplier = 1.2;
      sectorReason = 'IT sector benefiting from global demand';
    } else if (fmcgStocks.includes(symbol)) {
      sectorMultiplier = 0.9;
      sectorReason = 'FMCG sector facing margin pressure';
    }
    
    if (changePercent > 1.5) {
      return {
        action: 'BUY',
        confidence: 0.8 * sectorMultiplier,
        reason: `Positive momentum in Indian market. ${sectorReason}`,
        targetPrice: currentPrice * 1.08
      };
    } else if (changePercent < -2) {
      return {
        action: 'SELL',
        confidence: 0.75,
        reason: `Bearish trend detected. Consider booking profits`,
        targetPrice: currentPrice * 0.92
      };
    } else {
      return {
        action: 'HOLD',
        confidence: 0.65,
        reason: `Consolidation phase. ${sectorReason}`,
        targetPrice: currentPrice * 1.02
      };
    }
  }

  async getHistoricalData(symbol) {
    try {
      if (symbol.includes('.NS')) {
        // Mock historical data for Indian stocks
        return this.getMockHistoricalData(symbol);
      }
      
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );
      return response.data['Time Series (Daily)'];
    } catch (error) {
      return this.getMockHistoricalData(symbol);
    }
  }

  getMockHistoricalData(symbol) {
    // Generate mock historical data
    const data = {};
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data[dateStr] = {
        '1. open': '100.00',
        '2. high': '105.00',
        '3. low': '98.00',
        '4. close': '102.00',
        '5. volume': '1000000'
      };
    }
    
    return data;
  }

  convertUSDToINR(usdAmount) {
    return usdAmount * this.exchangeRate;
  }

  convertINRToUSD(inrAmount) {
    return inrAmount / this.exchangeRate;
  }
}

module.exports = new StockService();