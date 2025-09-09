const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const { rateLimiters } = require('./middleware/rateLimiter');
const { validators } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(rateLimiters.general); // Apply general rate limiting to all routes

// CORS middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Import routes
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Solana Pay Shop API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes with specific middleware
app.use('/api/payment', rateLimiters.payment, paymentRoutes);
app.use('/api/products', rateLimiters.products, productRoutes);
app.use('/api/orders', rateLimiters.general, orderRoutes);
app.use('/api/analytics', rateLimiters.general, analyticsRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Solana Pay Shop API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            products: '/api/products',
            payment: '/api/payment',
            orders: '/api/orders',
            analytics: '/api/analytics'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Start server
app.listen(PORT, 'localhost', () => {
    console.log(`🚀 Solana Pay Shop API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🛍️  API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Server bound to: localhost:${PORT}`);
});

module.exports = app;
