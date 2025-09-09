const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    printify_product_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      index: true
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
        notEmpty: true,
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
    pricing: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    crypto_price_sol: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    crypto_price_usdc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'draft']]
      }
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    inventory_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    // New fields for enhanced functionality
    sales_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    last_synced: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'products',
    indexes: [
      { fields: ['printify_product_id'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['is_featured'] },
      { fields: ['base_price'] },
      { fields: ['sales_count'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      beforeCreate: (product) => {
        product.last_synced = new Date();
      },
      beforeUpdate: (product) => {
        if (product.changed('metadata')) {
          product.last_synced = new Date();
        }
      }
    }
  });

  // Instance methods
  Product.prototype.toPublicJSON = function() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      base_price: parseFloat(this.base_price),
      crypto_price_sol: this.crypto_price_sol ? parseFloat(this.crypto_price_sol) : null,
      crypto_price_usdc: this.crypto_price_usdc ? parseFloat(this.crypto_price_usdc) : null,
      images: this.images || [],
      variants: this.variants || [],
      category: this.category,
      tags: this.tags || [],
      inventory_count: this.inventory_count,
      sales_count: this.sales_count || 0,
      status: this.status,
      is_featured: this.is_featured,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  };

  Product.prototype.updateSolPrice = function(solPrice) {
    this.crypto_price_sol = solPrice;
    return this.save();
  };

  Product.prototype.incrementSales = function() {
    this.sales_count += 1;
    return this.save();
  };

  Product.prototype.decrementInventory = function(quantity = 1) {
    if (this.inventory_count >= quantity) {
      this.inventory_count -= quantity;
      return this.save();
    }
    throw new Error('Insufficient inventory');
  };

  // Class methods
  Product.findActiveProducts = function(options = {}) {
    return this.findAll({
      where: {
        status: 'active',
        ...options.where
      },
      order: options.order || [['sales_count', 'DESC'], ['created_at', 'DESC']],
      limit: options.limit,
      offset: options.offset
    });
  };

  Product.findByCategory = function(category, options = {}) {
    return this.findActiveProducts({
      where: { category },
      ...options
    });
  };

  Product.searchProducts = function(searchTerm, options = {}) {
    const { Op } = require('sequelize');
    return this.findActiveProducts({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { category: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      ...options
    });
  };

  return Product;
};
