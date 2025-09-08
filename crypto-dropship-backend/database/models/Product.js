// database/models/Product.js - Ask Copilot:
// "Create Product model for Printify catalog integration
// Store product information, variants, pricing, and inventory
// Include Printify blueprint and print provider details"

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    printify_product_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    printify_blueprint_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    printify_print_provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 255]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    variants: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    markup_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50.00 // 50% markup by default
    },
    selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    crypto_price_sol: {
        type: DataTypes.DECIMAL(18, 9),
        allowNull: true
    },
    crypto_price_usdc: {
        type: DataTypes.DECIMAL(18, 6),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Weight in grams'
    },
    dimensions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    inventory_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sales_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_synced: {
        type: DataTypes.DATE,
        allowNull: true
    },
    printify_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'products',
    indexes: [
        {
            unique: true,
            fields: ['printify_product_id']
        },
        {
            fields: ['printify_blueprint_id']
        },
        {
            fields: ['category']
        },
        {
            fields: ['is_available']
        },
        {
            fields: ['is_published']
        }
    ]
});

// Instance methods
Product.prototype.calculateSellingPrice = function() {
    const basePrice = parseFloat(this.base_price);
    const markup = parseFloat(this.markup_percentage);
    this.selling_price = basePrice * (1 + markup / 100);
    return this.selling_price;
};

Product.prototype.updateCryptoPrices = function(solPrice, usdcPrice) {
    this.crypto_price_sol = solPrice;
    this.crypto_price_usdc = usdcPrice;
};

Product.prototype.incrementSales = async function() {
    this.sales_count += 1;
    await this.save();
};

Product.prototype.updateInventory = async function(count) {
    this.inventory_count = count;
    await this.save();
};

// Class methods
Product.findByPrintifyId = function(printifyId) {
    return this.findOne({ where: { printify_product_id: printifyId } });
};

Product.findPublished = function() {
    return this.findAll({ 
        where: { 
            is_published: true,
            is_available: true
        }
    });
};

Product.findByCategory = function(category) {
    return this.findAll({ 
        where: { 
            category,
            is_published: true,
            is_available: true
        }
    });
};

module.exports = Product;
