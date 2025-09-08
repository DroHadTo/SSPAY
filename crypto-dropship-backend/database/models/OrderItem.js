// database/models/OrderItem.js - Ask Copilot:
// "Create OrderItem model for order line items
// Track individual products in orders with quantities and variants
// Include relationships to Order and Product models"

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

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
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    printify_product_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    printify_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    variant_title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_image: {
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
        allowNull: false,
        defaultValue: 0.00
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cost from Printify'
    },
    profit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Profit per item'
    },
    variant_details: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Size, color, material, etc.'
    },
    customization: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Custom text, images, etc.'
    },
    print_areas: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Areas where design is printed'
    },
    production_status: {
        type: DataTypes.ENUM(
            'pending',
            'in_production',
            'produced',
            'shipped',
            'delivered',
            'cancelled',
            'failed'
        ),
        allowNull: false,
        defaultValue: 'pending'
    },
    printify_line_item_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tracking_number: {
        type: DataTypes.STRING,
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
    production_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fulfillment_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'order_items',
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
            fields: ['printify_variant_id']
        },
        {
            fields: ['sku']
        },
        {
            fields: ['production_status']
        },
        {
            fields: ['tracking_number']
        }
    ]
});

// Instance methods
OrderItem.prototype.calculateTotal = function() {
    this.total_price = parseFloat(this.unit_price) * parseInt(this.quantity);
    return this.total_price;
};

OrderItem.prototype.calculateProfit = function() {
    if (this.cost_price) {
        const totalCost = parseFloat(this.cost_price) * parseInt(this.quantity);
        this.profit = parseFloat(this.total_price) - totalCost;
    }
    return this.profit;
};

OrderItem.prototype.updateProductionStatus = async function(status, additionalData = {}) {
    this.production_status = status;
    
    // Update timestamps based on status
    const now = new Date();
    switch (status) {
        case 'shipped':
            this.shipped_at = now;
            break;
        case 'delivered':
            this.delivered_at = now;
            break;
    }
    
    // Update additional data
    Object.assign(this, additionalData);
    
    await this.save();
};

OrderItem.prototype.addTracking = async function(trackingNumber) {
    this.tracking_number = trackingNumber;
    await this.save();
};

OrderItem.prototype.getVariantSummary = function() {
    const variant = this.variant_details || {};
    const parts = [];
    
    if (variant.size) parts.push(`Size: ${variant.size}`);
    if (variant.color) parts.push(`Color: ${variant.color}`);
    if (variant.material) parts.push(`Material: ${variant.material}`);
    
    return parts.join(', ') || 'No variant details';
};

OrderItem.prototype.hasCustomization = function() {
    return this.customization && Object.keys(this.customization).length > 0;
};

// Class methods
OrderItem.findByOrder = function(orderId) {
    return this.findAll({ 
        where: { order_id: orderId },
        order: [['id', 'ASC']]
    });
};

OrderItem.findByProduct = function(productId) {
    return this.findAll({ 
        where: { product_id: productId },
        order: [['createdAt', 'DESC']]
    });
};

OrderItem.findByPrintifyProduct = function(printifyProductId) {
    return this.findAll({ 
        where: { printify_product_id: printifyProductId },
        order: [['createdAt', 'DESC']]
    });
};

OrderItem.findByStatus = function(status) {
    return this.findAll({ 
        where: { production_status: status },
        order: [['createdAt', 'ASC']]
    });
};

OrderItem.findByTracking = function(trackingNumber) {
    return this.findAll({ 
        where: { tracking_number: trackingNumber }
    });
};

OrderItem.calculateTotalProfit = async function(orderId = null) {
    const whereClause = orderId ? { order_id: orderId } : {};
    const items = await this.findAll({ where: whereClause });
    
    return items.reduce((total, item) => {
        return total + (parseFloat(item.profit) || 0);
    }, 0);
};

module.exports = OrderItem;
