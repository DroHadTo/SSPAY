const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    wallet_address: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
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
        defaultValue: {}
    },
    total_orders: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_spent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'customers',
    timestamps: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['wallet_address']
        }
    ]
});

module.exports = Customer;
