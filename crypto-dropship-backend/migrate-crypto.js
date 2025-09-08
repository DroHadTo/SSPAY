/**
 * Database Migration for Crypto Payment Integration
 * 
 * This script safely migrates the existing database to support the new crypto payment system
 * while preserving existing data.
 */

const { sequelize } = require('./database/config');
const { DataTypes } = require('sequelize');

async function migrateToCryptoPayments() {
    try {
        console.log('🔄 Starting crypto payment migration...');
        
        // Check if we need to migrate
        const tableInfo = await sequelize.getQueryInterface().describeTable('payments');
        const hasCustomerEmail = tableInfo.customer_email;
        
        if (hasCustomerEmail) {
            console.log('✅ Database already migrated to crypto payments');
            return true;
        }
        
        console.log('📝 Adding new columns for crypto payments...');
        
        // Add new columns to existing payments table
        await sequelize.getQueryInterface().addColumn('payments', 'customer_email', {
            type: DataTypes.STRING,
            allowNull: true, // Allow null for existing records
            validate: {
                isEmail: true
            }
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'amount_usd', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Allow null for existing records
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'amount_sol', {
            type: DataTypes.DECIMAL(15, 9),
            allowNull: true, // Allow null for existing records
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'amount_lamports', { // cspell:ignore lamports
            type: DataTypes.STRING,
            allowNull: true, // Allow null for existing records
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'product_data', {
            type: DataTypes.TEXT,
            allowNull: true, // Allow null for existing records
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'order_id', {
            type: DataTypes.INTEGER,
            allowNull: true, // Allow null for existing records
        });
        
        await sequelize.getQueryInterface().addColumn('payments', 'expires_at', {
            type: DataTypes.DATE,
            allowNull: true, // Allow null for existing records
        });
        
        // Create new tables for enhanced crypto functionality
        console.log('📋 Creating Orders table...');
        await sequelize.getQueryInterface().createTable('orders', {
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
                validate: {
                    isEmail: true
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
                defaultValue: 'pending'
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
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        });
        
        console.log('📋 Creating OrderItems table...');
        await sequelize.getQueryInterface().createTable('order_items', {
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
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        });
        
        console.log('📋 Creating PaymentWebhooks table...');
        await sequelize.getQueryInterface().createTable('payment_webhooks', {
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
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        });
        
        // Add indexes for better performance
        console.log('📊 Adding database indexes...');
        await sequelize.getQueryInterface().addIndex('payments', ['customer_email']);
        await sequelize.getQueryInterface().addIndex('payments', ['expires_at']);
        await sequelize.getQueryInterface().addIndex('orders', ['order_number']);
        await sequelize.getQueryInterface().addIndex('orders', ['customer_email']);
        await sequelize.getQueryInterface().addIndex('orders', ['status']);
        await sequelize.getQueryInterface().addIndex('orders', ['printify_order_id']);
        
        console.log('✅ Crypto payment migration completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateToCryptoPayments()
        .then((success) => {
            if (success) {
                console.log('🎉 Migration completed successfully!');
                process.exit(0);
            } else {
                console.log('💥 Migration failed!');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 Migration error:', error);
            process.exit(1);
        });
}

module.exports = { migrateToCryptoPayments };
