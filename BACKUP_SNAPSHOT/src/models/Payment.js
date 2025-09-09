const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    transaction_signature: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    wallet_address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['SOL', 'USDC']]
        }
    },
    usd_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'confirmed', 'failed', 'cancelled']]
        }
    },
    confirmation_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    block_height: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    network_fee: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    exchange_rate: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'solana_pay'
    },
    reference_key: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    memo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
        {
            fields: ['payment_id']
        },
        {
            fields: ['order_id']
        },
        {
            fields: ['transaction_signature']
        },
        {
            fields: ['wallet_address']
        },
        {
            fields: ['status']
        },
        {
            fields: ['reference_key']
        }
    ]
});

module.exports = Payment;
