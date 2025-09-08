const express = require('express');
const { Product, OrderItem } = require('../database/models');
const PrintifyService = require('../services/printifyService');
const router = express.Router();

// Initialize Printify service
const printifyService = new PrintifyService();

// GET /api/products - Get all products with Printify integration
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
            price_max,
            sync_printify = false
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

        // If sync_printify is requested, sync products first
        if (sync_printify === 'true') {
            await syncPrintifyProducts();
        }

        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order.toUpperCase()]],
            distinct: true
        });

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        
        res.json({
            success: true,
            products: products.map(formatProductResponse),
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                per_page: parseInt(limit),
                total_items: count,
                has_next: page < totalPages,
                has_prev: page > 1
            },
            filters_applied: {
                category,
                search,
                is_published,
                is_available,
                price_range: { min: price_min, max: price_max }
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

// GET /api/products/sync - Sync products from Printify
router.get('/sync', async (req, res) => {
    try {
        const syncResults = await syncPrintifyProducts();
        
        res.json({
            success: true,
            message: 'Products synced successfully',
            results: syncResults,
            usage_stats: printifyService.getUsageStats()
        });

    } catch (error) {
        console.error('Error syncing products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync products from Printify',
            message: error.message
        });
    }
});

// GET /api/products/printify/shops - Get Printify shops
router.get('/printify/shops', async (req, res) => {
    try {
        const shops = await printifyService.getShops();
        
        res.json({
            success: true,
            shops,
            usage_stats: printifyService.getUsageStats()
        });

    } catch (error) {
        console.error('Error fetching Printify shops:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Printify shops',
            message: error.message
        });
    }
});

// GET /api/products/printify/catalog - Get Printify catalog
router.get('/printify/catalog', async (req, res) => {
    try {
        const catalog = await printifyService.getCatalogBlueprints();
        
        res.json({
            success: true,
            catalog,
            usage_stats: printifyService.getUsageStats()
        });

    } catch (error) {
        console.error('Error fetching Printify catalog:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Printify catalog',
            message: error.message
        });
    }
});

// GET /api/products/categories - Get unique product categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.findAll({
            attributes: ['category'],
            where: {
                category: { [Product.sequelize.Op.not]: null },
                is_published: true
            },
            group: ['category'],
            raw: true
        });

        const categoryList = categories.map(cat => cat.category).filter(Boolean);

        res.json({
            success: true,
            categories: categoryList
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { include_analytics = false } = req.query;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        let analytics = null;
        if (include_analytics === 'true') {
            // Get product analytics
            analytics = await getProductAnalytics(id);
        }

        res.json({
            success: true,
            product: formatProductResponse(product),
            analytics
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product',
            message: error.message
        });
    }
});

// POST /api/products - Create new product (from Printify or manual)
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        
        // If printify_product_id is provided, fetch from Printify
        if (productData.printify_product_id) {
            const printifyProduct = await printifyService.getProduct(productData.printify_product_id);
            if (!printifyProduct) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found in Printify'
                });
            }
            
            // Merge Printify data with provided data
            Object.assign(productData, printifyProduct);
        }

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            product: formatProductResponse(product),
            message: 'Product created successfully'
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to create product',
            message: error.message
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

        await product.update(updateData);

        res.json({
            success: true,
            product: formatProductResponse(product),
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to update product',
            message: error.message
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
            message: error.message
        });
    }
});

// GET /api/products/stats/usage - Get Printify API usage stats
router.get('/stats/usage', async (req, res) => {
    try {
        const usageStats = printifyService.getUsageStats();
        
        res.json({
            success: true,
            usage_stats: usageStats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching usage stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch usage stats',
            message: error.message
        });
    }
});

/**
 * Helper Functions
 */

// Sync products from Printify to local database
async function syncPrintifyProducts() {
    try {
        console.log('🔄 Starting Printify product sync...');
        
        let page = 1;
        let totalSynced = 0;
        let totalUpdated = 0;
        let totalCreated = 0;
        let hasMore = true;

        while (hasMore) {
            const printifyData = await printifyService.getProducts({ page, limit: 50 });
            
            if (!printifyData.products || printifyData.products.length === 0) {
                hasMore = false;
                break;
            }

            for (const printifyProduct of printifyData.products) {
                try {
                    const [product, created] = await Product.findOrCreate({
                        where: { printify_product_id: printifyProduct.id },
                        defaults: {
                            ...printifyProduct,
                            printify_product_id: printifyProduct.id,
                            printify_blueprint_id: printifyProduct.blueprint_id,
                            printify_status: 'active',
                            printify_updated_at: new Date()
                        }
                    });

                    if (!created) {
                        // Update existing product
                        await product.update({
                            ...printifyProduct,
                            printify_updated_at: new Date()
                        });
                        totalUpdated++;
                    } else {
                        totalCreated++;
                    }

                    totalSynced++;
                } catch (productError) {
                    console.error(`Error syncing product ${printifyProduct.id}:`, productError.message);
                }
            }

            // Check if there are more pages
            hasMore = page < printifyData.meta.pages;
            page++;
        }

        console.log(`✅ Printify sync completed: ${totalSynced} products (${totalCreated} created, ${totalUpdated} updated)`);
        
        return {
            total_synced: totalSynced,
            created: totalCreated,
            updated: totalUpdated
        };

    } catch (error) {
        console.error('Error in Printify sync:', error);
        throw error;
    }
}

// Format product for API response
function formatProductResponse(product) {
    const productData = product.toJSON ? product.toJSON() : product;
    
    return {
        id: productData.id,
        title: productData.title,
        description: productData.description,
        category: productData.category,
        base_price: parseFloat(productData.base_price || 0),
        selling_price: parseFloat(productData.selling_price || 0),
        markup_percentage: productData.markup_percentage,
        currency: productData.currency || 'USD',
        images: productData.images ? JSON.parse(productData.images) : [],
        tags: productData.tags ? JSON.parse(productData.tags) : [],
        variants: productData.variants ? JSON.parse(productData.variants) : [],
        is_available: productData.is_available,
        is_published: productData.is_published,
        inventory_count: productData.inventory_count,
        low_stock_threshold: productData.low_stock_threshold,
        printify_product_id: productData.printify_product_id,
        printify_blueprint_id: productData.printify_blueprint_id,
        created_at: productData.createdAt,
        updated_at: productData.updatedAt
    };
}

// Get product analytics
async function getProductAnalytics(productId) {
    try {
        const orderItems = await OrderItem.findAll({
            where: { product_id: productId },
            include: ['Order']
        });

        const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            total_orders: orderItems.length,
            total_sold: totalSold,
            total_revenue: parseFloat(totalRevenue.toFixed(2)),
            average_order_value: orderItems.length > 0 ? parseFloat((totalRevenue / orderItems.length).toFixed(2)) : 0
        };
    } catch (error) {
        console.error('Error calculating product analytics:', error);
        return null;
    }
}

module.exports = router;
