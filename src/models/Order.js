const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    customer_email: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'email'
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']]
        }
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']]
        }
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['solana', 'usdc', 'sol']]
        }
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
    crypto_amount: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    crypto_currency: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isIn: [['SOL', 'USDC']]
        }
    },
    transaction_signature: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    wallet_address: {
        type: DataTypes.STRING,
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
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    printify_order_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tracking_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
        {
            fields: ['order_number']
        },
        {
            fields: ['customer_email']
        },
        {
            fields: ['status']
        },
        {
            fields: ['payment_status']
        },
        {
            fields: ['transaction_signature']
        }
    ]
});

module.exports = Order;
