require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createTables } = require('./config/database');

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const tradingRoutes = require('./routes/trading');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/trading', tradingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Initialize database tables
createTables().then(() => {
  console.log('Database tables initialized');
}).catch(error => {
  console.error('Error initializing database:', error);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});