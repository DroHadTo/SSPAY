const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    printify_product_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    variant_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    crypto_unit_price: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    crypto_total_price: {
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
    product_title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    variant_title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_options: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    personalization: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'printed', 'shipped', 'delivered', 'cancelled']]
        }
    },
    printify_line_item_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['product_id']
        },
        {
            fields: ['printify_product_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = OrderItem;
