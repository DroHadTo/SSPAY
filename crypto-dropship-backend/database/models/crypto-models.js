/**
 * Enhanced Payment and Order Models for Crypto Integration
 * 
 * These models support crypto payments, order tracking, and Printify integration
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Enhanced Payment model for crypto transactions
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        payment_reference: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            index: true
        },
        amount_usd: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        amount_sol: {
            type: DataTypes.DECIMAL(15, 9),
            allowNull: false
        },
        amount_lamports: { // cspell:ignore lamports
            type: DataTypes.STRING,
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'SOL'
        },
        sender_wallet: {
            type: DataTypes.STRING,
            allowNull: true
        },
        recipient_wallet: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'expired'),
            defaultValue: 'pending',
            index: true
        },
        network: {
            type: DataTypes.STRING,
            defaultValue: 'devnet'
        },
        transaction_signature: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        customer_email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        product_data: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Orders',
                key: 'id'
            }
        },
        confirmed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
            index: true
        }
    }, {
        tableName: 'payments',
        timestamps: true,
        indexes: [
            {
                fields: ['payment_reference']
            },
            {
                fields: ['status']
            },
            {
                fields: ['expires_at']
            },
            {
                fields: ['customer_email']
            }
        ]
    });

    // Enhanced Order model for dropshipping
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            index: true
        },
        customer_email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        payment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Payments',
                key: 'id'
            }
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'USD'
        },
        crypto_amount: {
            type: DataTypes.DECIMAL(15, 9),
            allowNull: true
        },
        crypto_currency: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'processing', 
                'shipped', 
                'delivered', 
                'cancelled', 
                'refunded',
                'failed'
            ),
            defaultValue: 'pending',
            index: true
        },
        printify_order_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        printify_status: {
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
        shipping_address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        order_items: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        shipped_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        delivered_at: {
            type: DataTypes.DATE,
            allowNull: true
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
                fields: ['printify_order_id']
            }
        ]
    });

    // Order Items model for detailed tracking
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
                model: 'Orders',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Products',
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
            defaultValue: 1
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        product_title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        variant_title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'order_items',
        timestamps: true
    });

    // Payment Webhooks model for tracking Printify updates
    const PaymentWebhook = sequelize.define('PaymentWebhook', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        webhook_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        event_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        resource_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        resource_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        payload: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        processed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        processed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'payment_webhooks',
        timestamps: true,
        indexes: [
            {
                fields: ['webhook_id']
            },
            {
                fields: ['event_type']
            },
            {
                fields: ['processed']
            }
        ]
    });

    // Define associations
    Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });
    Order.hasOne(Payment, { foreignKey: 'order_id', as: 'Payment' });
    
    Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'Items' });
    OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });

    return {
        Payment,
        Order,
        OrderItem,
        PaymentWebhook
    };
};
