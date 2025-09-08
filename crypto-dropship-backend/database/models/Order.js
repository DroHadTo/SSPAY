// database/models/Order.js - Ask Copilot:
// "Create Order model for dropshipping order management
// Track order status, shipping info, and Printify integration
// Include relationships to Customer, Payment, and OrderItems"

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    printify_order_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'payments',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM(
            'pending_payment',
            'payment_confirmed', 
            'processing',
            'production',
            'shipped',
            'delivered',
            'cancelled',
            'refunded',
            'failed'
        ),
        allowNull: false,
        defaultValue: 'pending_payment'
    },
    printify_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    shipping_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    currency: {
        type: DataTypes.ENUM('SOL', 'USDC', 'USD'),
        allowNull: false,
        defaultValue: 'SOL'
    },
    crypto_amount: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    exchange_rate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true
    },
    shipping_address: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    },
    billing_address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    customer_email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    customer_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    shipping_method: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tracking_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tracking_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    carrier: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estimated_delivery: {
        type: DataTypes.DATE,
        allowNull: true
    },
    shipped_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    printify_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    fulfillment_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    customer_ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'crypto-dropship'
    }
}, {
    tableName: 'orders',
    indexes: [
        {
            unique: true,
            fields: ['order_number']
        },
        {
            unique: true,
            fields: ['printify_order_id']
        },
        {
            fields: ['customer_id']
        },
        {
            fields: ['payment_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['customer_email']
        },
        {
            fields: ['tracking_number']
        },
        {
            fields: ['shipped_at']
        },
        {
            fields: ['created_at']
        }
    ]
});

// Instance methods
Order.prototype.calculateTotal = function() {
    const subtotal = parseFloat(this.subtotal);
    const shipping = parseFloat(this.shipping_cost);
    const tax = parseFloat(this.tax_amount);
    this.total_amount = subtotal + shipping + tax;
    return this.total_amount;
};

Order.prototype.updateStatus = async function(status, additionalData = {}) {
    this.status = status;
    
    // Update timestamps based on status
    const now = new Date();
    switch (status) {
        case 'shipped':
            this.shipped_at = now;
            break;
        case 'delivered':
            this.delivered_at = now;
            break;
        case 'cancelled':
            this.cancelled_at = now;
            break;
    }
    
    // Update additional data
    Object.assign(this, additionalData);
    
    await this.save();
};

Order.prototype.addTracking = async function(trackingNumber, carrier, trackingUrl = null) {
    this.tracking_number = trackingNumber;
    this.carrier = carrier;
    this.tracking_url = trackingUrl;
    await this.save();
};

Order.prototype.generateOrderNumber = function() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.order_number = `CD-${timestamp.slice(-6)}-${random}`;
    return this.order_number;
};

Order.prototype.canBeCancelled = function() {
    return ['pending_payment', 'payment_confirmed', 'processing'].includes(this.status);
};

Order.prototype.canBeRefunded = function() {
    return ['payment_confirmed', 'processing', 'production'].includes(this.status);
};

// Class methods
Order.findByOrderNumber = function(orderNumber) {
    return this.findOne({ where: { order_number: orderNumber } });
};

Order.findByPrintifyId = function(printifyOrderId) {
    return this.findOne({ where: { printify_order_id: printifyOrderId } });
};

Order.findByCustomer = function(customerId) {
    return this.findAll({ 
        where: { customer_id: customerId },
        order: [['createdAt', 'DESC']]
    });
};

Order.findByEmail = function(email) {
    return this.findAll({ 
        where: { customer_email: email },
        order: [['createdAt', 'DESC']]
    });
};

Order.findByStatus = function(status) {
    return this.findAll({ 
        where: { status },
        order: [['createdAt', 'DESC']]
    });
};

Order.findPendingPayment = function() {
    return this.findAll({ 
        where: { status: 'pending_payment' },
        order: [['createdAt', 'ASC']]
    });
};

Order.findRecentOrders = function(limit = 50) {
    return this.findAll({ 
        order: [['createdAt', 'DESC']],
        limit
    });
};

module.exports = Order;
