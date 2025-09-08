// routes/products.js - Ask Copilot:
// "Create product management routes with SQLite database integration
// Handle product catalog from Printify, pricing, and inventory management
// Include product search, filtering, and analytics"

const express = require('express');
const { Product, OrderItem } = require('../database/models');
const router = express.Router();

// GET /api/products - Get all products with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            search,
            is_published = true,
            is_available = true,
            sort = 'createdAt',
            order = 'DESC',
            price_min,
            price_max
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        // Apply filters
        if (category) whereClause.category = category;
        if (is_published !== undefined) whereClause.is_published = is_published === 'true';
        if (is_available !== undefined) whereClause.is_available = is_available === 'true';

        // Price range filtering
        if (price_min || price_max) {
            whereClause.selling_price = {};
            if (price_min) whereClause.selling_price[Product.sequelize.Op.gte] = parseFloat(price_min);
            if (price_max) whereClause.selling_price[Product.sequelize.Op.lte] = parseFloat(price_max);
        }

        // Search functionality
        if (search) {
            whereClause[Product.sequelize.Op.or] = [
                { title: { [Product.sequelize.Op.like]: `%${search}%` } },
                { description: { [Product.sequelize.Op.like]: `%${search}%` } },
                { category: { [Product.sequelize.Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            products,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            details: error.message
        });
    }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product',
            details: error.message
        });
    }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
    try {
        const {
            printify_product_id,
            printify_blueprint_id,
            printify_print_provider_id,
            title,
            description,
            tags = [],
            images = [],
            variants = [],
            base_price,
            markup_percentage = 50,
            category,
            weight,
            dimensions = {},
            is_published = false,
            metadata = {}
        } = req.body;

        // Validate required fields
        if (!title || !base_price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, base_price'
            });
        }

        // Create product
        const product = await Product.create({
            printify_product_id,
            printify_blueprint_id,
            printify_print_provider_id,
            title,
            description,
            tags,
            images,
            variants,
            base_price,
            markup_percentage,
            category,
            weight,
            dimensions,
            is_published,
            metadata
        });

        // Calculate selling price
        product.calculateSellingPrice();
        await product.save();

        res.status(201).json({
            success: true,
            product,
            message: 'Product created successfully'
        });
        
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product',
            details: error.message
        });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Update product
        await product.update(updateData);

        // Recalculate selling price if base price or markup changed
        if (updateData.base_price || updateData.markup_percentage) {
            product.calculateSellingPrice();
            await product.save();
        }

        res.json({
            success: true,
            product,
            message: 'Product updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product',
            details: error.message
        });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check if product has orders
        const orderItems = await OrderItem.findByProduct(id);
        if (orderItems.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete product with existing orders'
            });
        }

        await product.destroy();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product',
            details: error.message
        });
    }
});

// PATCH /api/products/:id/publish - Publish/unpublish product
router.patch('/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        product.is_published = is_published;
        await product.save();

        res.json({
            success: true,
            product,
            message: `Product ${is_published ? 'published' : 'unpublished'} successfully`
        });
        
    } catch (error) {
        console.error('Error updating product publish status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product publish status',
            details: error.message
        });
    }
});

// POST /api/products/:id/update-prices - Update crypto prices
router.post('/:id/update-prices', async (req, res) => {
    try {
        const { id } = req.params;
        const { sol_price, usdc_price } = req.body;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        product.updateCryptoPrices(sol_price, usdc_price);
        await product.save();

        res.json({
            success: true,
            product,
            message: 'Crypto prices updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating crypto prices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update crypto prices',
            details: error.message
        });
    }
});

// GET /api/products/categories - Get all categories
router.get('/meta/categories', async (req, res) => {
    try {
        const { sequelize } = require('../database/models');
        
        const categories = await Product.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                category: { [sequelize.Op.not]: null },
                is_published: true
            },
            group: ['category'],
            order: [[sequelize.literal('count'), 'DESC']]
        });

        res.json({
            success: true,
            categories: categories.map(cat => ({
                name: cat.category,
                count: parseInt(cat.get('count'))
            }))
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            details: error.message
        });
    }
});

// GET /api/products/analytics/overview - Product analytics
router.get('/analytics/overview', async (req, res) => {
    try {
        const { sequelize } = require('../database/models');
        
        // Total products
        const totalProducts = await Product.count();
        
        // Published products
        const publishedProducts = await Product.count({
            where: { is_published: true }
        });
        
        // Products by category
        const categoryStats = await Product.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['category']
        });

        // Best selling products
        const bestSellers = await Product.findAll({
            order: [['sales_count', 'DESC']],
            limit: 10
        });

        // Average prices
        const avgPrices = await Product.findAll({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('base_price')), 'avg_base_price'],
                [sequelize.fn('AVG', sequelize.col('selling_price')), 'avg_selling_price']
            ]
        });

        res.json({
            success: true,
            analytics: {
                totalProducts,
                publishedProducts,
                unpublishedProducts: totalProducts - publishedProducts,
                categoryStats: categoryStats.reduce((acc, stat) => {
                    acc[stat.category || 'Uncategorized'] = parseInt(stat.get('count'));
                    return acc;
                }, {}),
                bestSellers,
                averagePrices: {
                    base_price: parseFloat(avgPrices[0]?.get('avg_base_price') || 0),
                    selling_price: parseFloat(avgPrices[0]?.get('avg_selling_price') || 0)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching product analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product analytics',
            details: error.message
        });
    }
});

// POST /api/products/sync-printify - Sync products from Printify (if needed)
router.post('/sync-printify', async (req, res) => {
    try {
        // This endpoint would integrate with Printify API to sync products
        // For now, return success message
        
        res.json({
            success: true,
            message: 'Printify sync functionality would be implemented here',
            note: 'This would fetch products from Printify API and update the database'
        });
        
    } catch (error) {
        console.error('Error syncing with Printify:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync with Printify',
            details: error.message
        });
    }
});

module.exports = router;
