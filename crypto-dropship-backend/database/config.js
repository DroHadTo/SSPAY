// database/config.js - Ask Copilot:
// "Configure SQLite database connection with Sequelize
// Set up database path, logging, and connection options
// Handle database initialization and error management"

const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'crypto_dropship.db');

// Create Sequelize instance with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_PATH,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to database:', error.message);
        return false;
    }
}

// Initialize database (create tables)
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Import all models
        require('./models/Customer');
        require('./models/Product');
        require('./models/Order');
        require('./models/Payment');
        require('./models/OrderItem');
        
        // Sync all models
        await sequelize.sync({ 
            force: process.env.NODE_ENV === 'development' && process.env.DB_RESET === 'true',
            alter: process.env.NODE_ENV === 'development'
        });
        
        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}

// Close database connection
async function closeConnection() {
    try {
        await sequelize.close();
        console.log('📝 Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database:', error.message);
    }
}

module.exports = {
    sequelize,
    testConnection,
    initializeDatabase,
    closeConnection
};
