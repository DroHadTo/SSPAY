const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test server is running',
        timestamp: new Date().toISOString()
    });
});

// Simple products endpoint with mock data
app.get('/api/products', (req, res) => {
    res.json({
        products: [
            {
                id: '1',
                name: 'Test Product',
                price: 25.99,
                description: 'Test product for debugging',
                category: 'Test',
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
            }
        ],
        note: 'Test server response'
    });
});

// Start server with error handling
app.listen(PORT, 'localhost', (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
