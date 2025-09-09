const { sequelize } = require('../config/database');

// Import all models
const Customer = require('./Customer');
const Product = require('./Product')(sequelize);
const Order = require('./Order');
const Payment = require('./Payment');
const OrderItem = require('./OrderItem');

// Define associations
// Customer associations
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

// Order associations
Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    as: 'items'
});

OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
});

Order.hasMany(Payment, {
    foreignKey: 'order_id',
    as: 'payments'
});

Payment.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
});

// Product associations
Product.hasMany(OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
});

OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

// Database sync functions
async function syncDatabase() {
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database synchronization failed:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        await syncDatabase();
        console.log('✅ Database initialized successfully');
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    Customer,
    Product,
    Order,
    Payment,
    OrderItem,
    syncDatabase,
    initializeDatabase
};
