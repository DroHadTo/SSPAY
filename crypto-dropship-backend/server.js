// server.js - Enhanced Crypto Dropship Backend
// Complete Express server with Printify API and Solana Pay integration

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database initialization
const { initializeDatabase } = require('./database/models');

// Import route handlers
const productsV2Routes = require('./routes/products-v2');
const cryptoPaymentRoutes = require('./routes/crypto-payments');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Crypto Dropship Backend with Printify & Solana Pay Integration',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            printify: !!process.env.PRINTIFY_API_TOKEN,
            solana: !!process.env.SOLANA_RPC_URL || 'devnet',
            database: true,
            crypto_payments: true
        }
    });
});

// Enhanced API Routes
app.use('/api/products', productsV2Routes); // Enhanced product routes with Printify sync
app.use('/api/crypto', cryptoPaymentRoutes); // New crypto payment routes

// Legacy API Routes (for backward compatibility)
app.use('/api/printify', require('./routes/printify'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/admin', require('./routes/admin'));

// Serve enhanced crypto shop frontend
app.get('/crypto-shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../solana-pay-shop/frontend/index.html'));
});

// Serve admin dashboard static files
app.use('/admin', express.static('public/admin'));

// Serve crypto-shop static files from solana-pay-shop frontend
app.use('/crypto-shop-static', express.static(path.join(__dirname, '../solana-pay-shop/frontend')));

// Serve main shop frontend
app.use('/', express.static('public'));

// Temporary seed endpoint for demo products
app.post('/api/seed-products', async (req, res) => {
    try {
        const { Product } = require('./database/models');
        
        // Check if products already exist
        const existingProducts = await Product.findAll();
        if (existingProducts.length > 0) {
            return res.json({
                success: true,
                message: 'Products already exist',
                count: existingProducts.length,
                products: existingProducts.map(p => ({ id: p.id, title: p.title, price: p.selling_price }))
            });
        }
        
        // Create demo products
        const demoProducts = [
            {
                title: 'Custom T-Shirt Premium',
                description: 'High-quality cotton t-shirt with custom design print - Printify Integration',
                base_price: 19.99,
                markup_percentage: 50,
                selling_price: 29.99,
                category: 'Apparel',
                tags: JSON.stringify(['apparel', 'shirts', 'custom', 'printify']),
                images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop']),
                is_available: true,
                is_published: true,
                inventory_count: 100
            },
            {
                title: 'Ceramic Coffee Mug',
                description: 'Durable ceramic coffee mug with personalized artwork - Printify POD',
                base_price: 9.99,
                markup_percentage: 50,
                selling_price: 14.99,
                category: 'Drinkware',
                tags: JSON.stringify(['accessories', 'drinkware', 'mugs', 'printify']),
                images: JSON.stringify(['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop']),
                is_available: true,
                is_published: true,
                inventory_count: 50
            },
            {
                title: 'Premium Phone Case',
                description: 'Protective phone case with custom artwork design - Printify Quality',
                base_price: 12.99,
                markup_percentage: 54,
                selling_price: 19.99,
                category: 'Accessories',
                tags: JSON.stringify(['accessories', 'phone', 'cases', 'printify']),
                images: JSON.stringify(['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop']),
                is_available: true,
                is_published: true,
                inventory_count: 75
            },
            {
                title: 'Canvas Tote Bag',
                description: 'Eco-friendly canvas tote bag with custom print - Printify Sustainable',
                base_price: 14.99,
                markup_percentage: 40,
                selling_price: 20.99,
                category: 'Bags',
                tags: JSON.stringify(['accessories', 'bags', 'eco-friendly', 'printify']),
                images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop']),
                is_available: true,
                is_published: true,
                inventory_count: 30
            }
        ];
        
        const createdProducts = [];
        for (const productData of demoProducts) {
            const product = await Product.create(productData);
            createdProducts.push({ id: product.id, title: product.title, price: product.selling_price });
        }
        
        res.json({
            success: true,
            message: 'Demo products created successfully',
            count: createdProducts.length,
            products: createdProducts
        });
        
    } catch (error) {
        console.error('Seed products error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Printify sync endpoint
app.post('/api/sync-printify', async (req, res) => {
    try {
        const axios = require('axios');
        const { Product } = require('./database/models');
        
        const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
        const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
        
        // Get shops
        const shopsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });
        
        if (shopsResponse.data.length === 0) {
            return res.json({
                success: false,
                error: 'No shops found in your Printify account'
            });
        }
        
        const shop = shopsResponse.data[0];
        
        // Get products
        const productsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops/${shop.id}/products.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });
        
        const printifyProducts = productsResponse.data.data;
        
        if (printifyProducts.length === 0) {
            return res.json({
                success: false,
                error: 'No products found in your Printify shop. Please create some products first.'
            });
        }
        
        // Clear existing products
        await Product.destroy({ where: {} });
        
        // Sync products
        const syncedProducts = [];
        for (const printifyProduct of printifyProducts) {
            const basePrice = printifyProduct.variants?.[0]?.price || 2000;
            const basePriceUSD = basePrice / 100;
            const markupPercentage = 50;
            const sellingPrice = basePriceUSD * (1 + markupPercentage / 100);
            
            const images = [];
            if (printifyProduct.images && printifyProduct.images.length > 0) {
                images.push(printifyProduct.images[0].src);
            }
            
            const productData = {
                printify_product_id: printifyProduct.id.toString(),
                printify_blueprint_id: printifyProduct.blueprint_id,
                printify_print_provider_id: printifyProduct.print_provider_id,
                title: printifyProduct.title,
                description: printifyProduct.description || `Premium ${printifyProduct.title} from Printify`,
                tags: JSON.stringify(printifyProduct.tags || ['printify', 'custom']),
                images: JSON.stringify(images),
                variants: JSON.stringify(printifyProduct.variants || []),
                base_price: basePriceUSD,
                markup_percentage: markupPercentage,
                selling_price: Math.round(sellingPrice * 100) / 100,
                category: detectCategory(printifyProduct.title, printifyProduct.blueprint_id),
                is_available: printifyProduct.visible && !printifyProduct.is_locked,
                is_published: printifyProduct.visible,
                inventory_count: 999
            };
            
            const product = await Product.create(productData);
            syncedProducts.push({
                id: product.id,
                title: product.title,
                selling_price: product.selling_price
            });
        }
        
        res.json({
            success: true,
            message: `Successfully synced ${syncedProducts.length} products from Printify`,
            count: syncedProducts.length,
            products: syncedProducts
        });
        
    } catch (error) {
        console.error('Printify sync error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Printify API test endpoint
app.post('/api/test-printify', async (req, res) => {
    try {
        const axios = require('axios');
        const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
        const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
        
        // Test user info
        const userResponse = await axios.get(`${PRINTIFY_API_BASE}/user.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });
        
        // Test shops
        const shopsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });
        
        let products = [];
        if (shopsResponse.data.length > 0) {
            const productsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops/${shopsResponse.data[0].id}/products.json`, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'User-Agent': 'Crypto Dropship Store'
                }
            });
            products = productsResponse.data.data;
        }
        
        res.json({
            success: true,
            user: {
                id: userResponse.data.id,
                email: userResponse.data.email,
                name: userResponse.data.first_name + ' ' + userResponse.data.last_name
            },
            shops: shopsResponse.data,
            products: products,
            catalog: true
        });
        
    } catch (error) {
        console.error('Printify test error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Helper function for category detection
function detectCategory(title, blueprintId) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('tank')) {
        return 'Apparel';
    } else if (titleLower.includes('mug') || titleLower.includes('cup') || titleLower.includes('bottle')) {
        return 'Drinkware';
    } else if (titleLower.includes('bag') || titleLower.includes('tote') || titleLower.includes('backpack')) {
        return 'Bags';
    } else if (titleLower.includes('phone') || titleLower.includes('case') || titleLower.includes('cover')) {
        return 'Accessories';
    } else if (titleLower.includes('poster') || titleLower.includes('print') || titleLower.includes('canvas')) {
        return 'Wall Art';
    } else if (titleLower.includes('sticker') || titleLower.includes('decal')) {
        return 'Stickers';
    } else {
        const blueprintCategories = {
            3: 'Apparel', 6: 'Drinkware', 26: 'Bags', 30: 'Accessories', 384: 'Wall Art'
        };
        return blueprintCategories[blueprintId] || 'Other';
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database connection and sync models
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            console.error('❌ Failed to initialize database. Server not started.');
            process.exit(1);
        }

        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Crypto Dropship Backend running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🛍️  API Base URL: http://localhost:${PORT}/api`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Database: SQLite with Sequelize ORM`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
