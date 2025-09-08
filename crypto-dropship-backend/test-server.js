// test-server.js - Simple server to test routes one by one
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3004; // Different port for testing

// Middleware
app.use(cors());
app.use(express.json());

// Test health endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Test server running' });
});

// Test routes one by one
try {
    console.log('Loading printify route...');
    app.use('/api/printify', require('./routes/printify'));
    console.log('✅ Printify route loaded successfully');
} catch (error) {
    console.error('❌ Error loading printify route:', error.message);
}

try {
    console.log('Loading payments route...');
    app.use('/api/payments', require('./routes/payments'));
    console.log('✅ Payments route loaded successfully');
} catch (error) {
    console.error('❌ Error loading payments route:', error.message);
}

try {
    console.log('Loading orders route...');
    app.use('/api/orders', require('./routes/orders'));
    console.log('✅ Orders route loaded successfully');
} catch (error) {
    console.error('❌ Error loading orders route:', error.message);
}

try {
    console.log('Loading products route...');
    app.use('/api/products', require('./routes/products'));
    console.log('✅ Products route loaded successfully');
} catch (error) {
    console.error('❌ Error loading products route:', error.message);
}

try {
    console.log('Loading suppliers route...');
    app.use('/api/suppliers', require('./routes/suppliers'));
    console.log('✅ Suppliers route loaded successfully');
} catch (error) {
    console.error('❌ Error loading suppliers route:', error.message);
}

app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
});
