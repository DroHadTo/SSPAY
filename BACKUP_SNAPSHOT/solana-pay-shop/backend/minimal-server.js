const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        message: 'Minimal server is running',
        timestamp: new Date().toISOString()
    });
});

// Simple products endpoint
app.get('/api/products', (req, res) => {
    console.log('Products requested');
    res.json({
        products: [
            {
                id: '1',
                name: 'Test Product',
                price: 25.99,
                description: 'Test product for debugging'
            }
        ],
        note: 'Minimal server response'
    });
});

// Simple payment creation endpoint
app.post('/api/payment/create-payment', (req, res) => {
    console.log('Payment creation requested:', req.body);
    res.json({
        paymentId: 'test-payment-123',
        status: 'pending',
        message: 'Test payment created successfully'
    });
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
    console.log(`📊 Health: http://127.0.0.1:${PORT}/health`);
    console.log(`🛍️  Products: http://127.0.0.1:${PORT}/api/products`);
    console.log(`💳 Payment: http://127.0.0.1:${PORT}/api/payment/create-payment`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
