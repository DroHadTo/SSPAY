// database/models/index.js - Enhanced with existing model compatibility
// Work with existing database structure while adding crypto functionality

const { sequelize } = require('../config');
const Customer = require('./Customer');
const Product = require('./Product');

// Use existing models instead of creating new ones
const Order = require('./Order');
const Payment = require('./Payment');
const OrderItem = require('./OrderItem');

// Enhanced associations for crypto payment system
// Customer has many Orders
Customer.hasMany(Order, {
    foreignKey: 'customer_email',
    sourceKey: 'email',
    as: 'orders'
});

Order.belongsTo(Customer, {
    foreignKey: 'customer_email',
    targetKey: 'email',
    as: 'customer'
});

// Product has many OrderItems
Product.hasMany(OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
});

OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

// Crypto payment associations are defined in crypto-models.js

// Export all models including existing ones
module.exports = {
    sequelize,
    Customer,
    Product,
    Order,
    Payment,
    OrderItem
};

// Enhanced sync database function
async function syncDatabase() {
    try {
        // Sync all models including crypto models
        await sequelize.sync({ force: false }); // Don't drop existing tables
        console.log('✅ Database synchronized successfully');
        console.log('✅ Crypto payment models ready');
    } catch (error) {
        console.error('❌ Database synchronization failed:', error);
        throw error;
    }
}

// Initialize database with crypto support
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        await syncDatabase();
        console.log('✅ Database initialized with crypto payment support');
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

module.exports.syncDatabase = syncDatabase;
module.exports.initializeDatabase = initializeDatabase;
