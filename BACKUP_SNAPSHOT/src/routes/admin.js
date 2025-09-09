const express = require('express');
const router = express.Router();
const { Product, Order, Payment, Customer } = require('../models');
const printifyService = require('../services/printifyService');

// GET /api/admin/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res, next) => {
    try {
        const stats = await Promise.all([
            Product.count(),
            Order.count(),
            Payment.count({ where: { status: 'confirmed' } }),
            Customer.count(),
            Order.sum('total_amount'),
            Payment.sum('usd_amount', { where: { status: 'confirmed' } })
        ]);

        const [
            totalProducts,
            totalOrders,
            confirmedPayments,
            totalCustomers,
            totalOrderValue,
            totalPaymentValue
        ] = stats;

        res.json({
            success: true,
            data: {
                products: {
                    total: totalProducts,
                    active: await Product.count({ where: { status: 'active' } })
                },
                orders: {
                    total: totalOrders,
                    pending: await Order.count({ where: { status: 'pending' } }),
                    processing: await Order.count({ where: { status: 'processing' } }),
                    completed: await Order.count({ where: { status: 'delivered' } })
                },
                payments: {
                    confirmed: confirmedPayments,
                    total_value: totalPaymentValue || 0
                },
                customers: {
                    total: totalCustomers
                },
                revenue: {
                    total_orders: totalOrderValue || 0,
                    total_payments: totalPaymentValue || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/recent-activity - Get recent activity
router.get('/recent-activity', async (req, res, next) => {
    try {
        const recentOrders = await Order.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            include: [{ model: Customer, as: 'customer' }]
        });

        const recentPayments = await Payment.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            include: [{ model: Order, as: 'order' }]
        });

        res.json({
            success: true,
            data: {
                recent_orders: recentOrders,
                recent_payments: recentPayments
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/sync-printify - Sync all Printify data
router.post('/sync-printify', async (req, res, next) => {
    try {
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
                results.errors.push({
                    product_id: printifyProduct.id,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Sync completed: ${results.created} created, ${results.updated} updated`
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/system-info - Get system information
router.get('/system-info', async (req, res, next) => {
    try {
        const config = require('../config');
        
        res.json({
            success: true,
            data: {
                environment: config.NODE_ENV,
                printify_configured: !!config.PRINTIFY.API_KEY,
                solana_network: config.SOLANA.NETWORK,
                merchant_wallet: config.SOLANA.MERCHANT_WALLET,
                server_time: new Date().toISOString(),
                uptime: process.uptime()
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/populate-products - Populate database with sample products
router.post('/populate-products', async (req, res, next) => {
    try {
        console.log('🔄 Starting product population via admin endpoint...');
        
        const sampleProducts = [
            {
                title: 'Solana T-Shirt',
                description: 'Premium Solana-themed t-shirt made from 100% organic cotton',
                price: 25.99,
                category: 'Apparel',
                inventory: 100,
                isActive: true,
                featured: true
            },
            {
                title: 'Crypto Hoodie',
                description: 'Comfortable hoodie with cryptocurrency design',
                price: 45.99,
                category: 'Apparel',
                inventory: 75,
                isActive: true,
                featured: true
            },
            {
                title: 'Blockchain Mug',
                description: 'Start your day with blockchain technology',
                price: 15.99,
                category: 'Accessories',
                inventory: 200,
                isActive: true,
                featured: false
            },
            {
                title: 'DeFi Sticker Pack',
                description: 'Collection of 10 DeFi protocol stickers',
                price: 9.99,
                category: 'Accessories',
                inventory: 500,
                isActive: true,
                featured: false
            },
            {
                title: 'NFT Art Canvas',
                description: 'High-quality canvas print of digital art',
                price: 79.99,
                category: 'Art',
                inventory: 25,
                isActive: true,
                featured: true
            }
        ];
        
        const results = [];
        
        for (const productData of sampleProducts) {
            try {
                const newProduct = await Product.create(productData);
                results.push({
                    success: true,
                    product: newProduct.toPublicJSON()
                });
                console.log(`✅ Created product: ${newProduct.title}`);
            } catch (error) {
                console.error(`❌ Error creating product ${productData.title}:`, error.message);
                results.push({
                    success: false,
                    title: productData.title,
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
            success: true,
            message: `Successfully created ${successCount} out of ${sampleProducts.length} products`,
            data: {
                created: successCount,
                total: sampleProducts.length,
                results
            }
        });
        
    } catch (error) {
        console.error('❌ Product population failed:', error);
        next(error);
    }
});

module.exports = router;
