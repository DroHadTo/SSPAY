// database/models/Payment.js - Ask Copilot:
// "Create Payment model for Solana Pay transactions
// Track payment status, blockchain references, and crypto amounts
// Include validation for wallet addresses and transaction signatures"

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    transaction_signature: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            len: [86, 88] // Solana transaction signature length
        }
    },
    sender_wallet: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [32, 44] // Solana wallet address length
        }
    },
    recipient_wallet: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [32, 44] // Solana wallet address length
        }
    },
    amount: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.ENUM('SOL', 'USDC'),
        allowNull: false,
        defaultValue: 'SOL'
    },
    usd_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    exchange_rate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
        comment: 'Crypto to USD exchange rate at time of payment'
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'expired', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
    },
    network: {
        type: DataTypes.ENUM('mainnet', 'devnet', 'testnet'),
        allowNull: false,
        defaultValue: 'devnet'
    },
    block_height: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    confirmation_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    fee_paid: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true,
        defaultValue: 0
    },
    memo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_intent: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    blockchain_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refunded_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refund_signature: {
        type: DataTypes.STRING,
        allowNull: true
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'payments',
    indexes: [
        {
            unique: true,
            fields: ['payment_reference']
        },
        {
            unique: true,
            fields: ['transaction_signature']
        },
        {
            fields: ['sender_wallet']
        },
        {
            fields: ['recipient_wallet']
        },
        {
            fields: ['status']
        },
        {
            fields: ['currency']
        },
        {
            fields: ['network']
        },
        {
            fields: ['confirmed_at']
        }
    ]
});

// Instance methods
Payment.prototype.markConfirmed = async function(transactionSignature, blockHeight) {
    this.status = 'confirmed';
    this.transaction_signature = transactionSignature;
    this.block_height = blockHeight;
    this.confirmed_at = new Date();
    this.confirmation_count = 1;
    await this.save();
};

Payment.prototype.markFailed = async function(errorMessage) {
    this.status = 'failed';
    this.error_message = errorMessage;
    this.failed_at = new Date();
    await this.save();
};

Payment.prototype.markExpired = async function() {
    this.status = 'expired';
    await this.save();
};

Payment.prototype.processRefund = async function(refundSignature) {
    this.status = 'refunded';
    this.refund_signature = refundSignature;
    this.refunded_at = new Date();
    await this.save();
};

Payment.prototype.isExpired = function() {
    return this.expires_at && new Date() > this.expires_at;
};

Payment.prototype.canBeRefunded = function() {
    return this.status === 'confirmed' && !this.refunded_at;
};

// Class methods
Payment.findByReference = function(paymentReference) {
    return this.findOne({ where: { payment_reference: paymentReference } });
};

Payment.findBySignature = function(transactionSignature) {
    return this.findOne({ where: { transaction_signature: transactionSignature } });
};

Payment.findByWallet = function(walletAddress) {
    return this.findAll({ 
        where: { 
            sender_wallet: walletAddress 
        },
        order: [['createdAt', 'DESC']]
    });
};

Payment.findPending = function() {
    return this.findAll({ 
        where: { 
            status: 'pending',
            expires_at: {
                [sequelize.Sequelize.Op.gt]: new Date()
            }
        }
    });
};

Payment.findExpired = function() {
    return this.findAll({ 
        where: { 
            status: 'pending',
            expires_at: {
                [sequelize.Sequelize.Op.lt]: new Date()
            }
        }
    });
};

module.exports = Payment;
