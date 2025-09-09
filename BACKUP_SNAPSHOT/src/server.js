require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configuration and models
const config = require('./config');
const { sequelize, initializeDatabase } = require('./models');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const printifyRoutes = require('./routes/printify');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const cryptoRoutes = require('./routes/crypto');
const orderProcessingRoutes = require('./routes/orderProcessing');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.devnet.solana.com", "https://api.mainnet-beta.solana.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Middleware setup
app.use(cors(config.CORS));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV,
        services: {
            printify: !!config.PRINTIFY.API_KEY,
            solana: config.SOLANA.NETWORK,
            database: true
        }
    });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/printify', printifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/orders', orderProcessingRoutes);

// API Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            printify: !!config.PRINTIFY.API_KEY,
            solana: config.SOLANA.NETWORK,
            database: true
        }
    });
});

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Serve frontend applications
app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../solana-pay-shop/frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Default route
app.get('/', (req, res) => {
    res.json({
        name: 'SSPAY API',
        version: '1.0.0',
        description: 'Cryptocurrency e-commerce platform with Printify integration',
        endpoints: {
            health: '/health',
            shop: '/shop',
            admin: '/admin',
            api: {
                products: '/api/products',
                orders: '/api/orders',
                payments: '/api/payments',
                printify: '/api/printify',
                admin: '/api/admin'
            }
        }
    });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Database connection and server startup
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        
        // Initialize database with models
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            console.error('❌ Failed to initialize database');
            process.exit(1);
        }
        
        // Start server
        const server = app.listen(config.PORT, () => {
            console.log(`🚀 SSPAY Server running on port ${config.PORT}`);
            console.log(`📱 Shop: http://localhost:${config.PORT}/shop`);
            console.log(`⚙️ Admin: http://localhost:${config.PORT}/admin`);
            console.log(`� API: http://localhost:${config.PORT}/api`);
            console.log(`� Health: http://localhost:${config.PORT}/health`);
            console.log(`🌐 Environment: ${config.NODE_ENV}`);
            console.log(`💰 Solana Network: ${config.SOLANA.NETWORK}`);
            
            if (config.PRINTIFY.API_KEY) {
                console.log('✅ Printify integration enabled');
            } else {
                console.log('⚠️ Printify API key not configured');
            }
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🔄 Shutting down server...');
            server.close(async () => {
                await sequelize.close();
                console.log('✅ Server shut down successfully');
                process.exit(0);
            });
        });

        process.on('SIGTERM', async () => {
            console.log('\n🔄 Shutting down server...');
            server.close(async () => {
                await sequelize.close();
                console.log('✅ Server shut down successfully');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
