const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const offerRoutes = require('./routes/offer.routes');

// Middlewares
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
