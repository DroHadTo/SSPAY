// database/models/Customer.js - Ask Copilot:
// "Create Customer model for user management
// Store customer information, shipping addresses, and preferences
// Include validation and relationships"

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 100]
        }
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 100]
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [10, 20]
        }
    },
    wallet_address: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [32, 44] // Solana wallet address length
        }
    },
    shipping_address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    billing_address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            newsletter: false,
            sms_notifications: false,
            order_updates: true
        }
    },
    total_orders: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_spent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    last_order_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'blocked'),
        defaultValue: 'active'
    }
}, {
    tableName: 'customers',
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            fields: ['wallet_address']
        },
        {
            fields: ['status']
        }
    ]
});

// Instance methods
Customer.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

Customer.prototype.updateOrderStats = async function(orderTotal) {
    this.total_orders += 1;
    this.total_spent = parseFloat(this.total_spent) + parseFloat(orderTotal);
    this.last_order_date = new Date();
    await this.save();
};

// Class methods
Customer.findByEmail = function(email) {
    return this.findOne({ where: { email } });
};

Customer.findByWallet = function(walletAddress) {
    return this.findOne({ where: { wallet_address: walletAddress } });
};

module.exports = Customer;
