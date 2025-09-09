const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { Product } = require('../models');
const printifyService = require('../services/printifyService');

// GET /api/products - Get all products
router.get('/', async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            status = 'active',
            featured,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // Build filters
        if (category) {
            where.category = category;
        }

        if (status) {
            where.status = status;
        }

        if (featured !== undefined) {
            where.is_featured = featured === 'true';
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const products = await Product.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: products.rows,
            pagination: {
                total: products.count,
                page: parseInt(page),
                pages: Math.ceil(products.count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products - Create new product
router.post('/', async (req, res, next) => {
    try {
        const productData = req.body;
        
        const product = await Product.create(productData);
        
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.update(updateData);
        
        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.destroy();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products/sync - Sync products from Printify
router.post('/sync', async (req, res, next) => {
    try {
        console.log('Starting Printify product sync...');
        
        const printifyProducts = await printifyService.getProducts();
        
        if (!printifyProducts || !printifyProducts.data) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch products from Printify'
            });
        }

        const results = {
            created: 0,
            updated: 0,
            errors: []
        };

        for (const printifyProduct of printifyProducts.data) {
            try {
                const productData = printifyService.transformProductData(printifyProduct);
                
                const [product, created] = await Product.findOrCreate({
                    where: { printify_product_id: printifyProduct.id },
                    defaults: productData
                });

                if (!created) {
                    await product.update(productData);
                    results.updated++;
                } else {
                    results.created++;
                }
            } catch (error) {
                console.error(`Error syncing product ${printifyProduct.id}:`, error);
                results.errors.push({
                    product_id: printifyProduct.id,
                    error: error.message
                });
            }
        }

        console.log('Sync completed:', results);

        res.json({
            success: true,
            data: results,
            message: `Sync completed: ${results.created} created, ${results.updated} updated`
        });
    } catch (error) {
        console.error('Sync error:', error);
        next(error);
    }
});

// GET /api/products/categories - Get product categories
router.get('/meta/categories', async (req, res, next) => {
    try {
        const categories = await Product.findAll({
            attributes: ['category'],
            group: ['category'],
            where: {
                category: { [Op.not]: null }
            }
        });

        const categoryList = categories.map(p => p.category).filter(Boolean);

        res.json({
            success: true,
            data: categoryList
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
