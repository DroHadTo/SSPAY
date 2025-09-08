// routes/admin.js - Ask Copilot:
// "Create admin dashboard API endpoints for order management
// Include analytics, system monitoring, and administrative functions
// Implement authentication and authorization for admin access"

const express = require('express');
const { Order, OrderItem, Customer, Payment, Product } = require('../database/models');
const emailService = require('../services/emailService');
const inventoryService = require('../services/inventoryService');
const printifyWebhookHandler = require('../webhooks/printifyWebhooks');
const router = express.Router();

// Basic authentication middleware (in production, use proper JWT/OAuth)
const adminAuth = (req, res, next) => {
    const { authorization } = req.headers;
    const adminToken = process.env.ADMIN_TOKEN || 'admin123';
    
    if (!authorization || authorization !== `Bearer ${adminToken}`) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Admin access required'
        });
    }
    
    next();
};

// Apply auth to all admin routes
router.use(adminAuth);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
    try {
        const { sequelize } = require('../database/models');
        
        // Get recent statistics
        const [orderStats, paymentStats, customerStats, productStats] = await Promise.all([
            // Order statistics
            Order.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
                ],
                group: ['status']
            }),
            
            // Payment statistics
            Payment.findAll({
                attributes: [
                    'status',
                    'currency',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
                ],
                group: ['status', 'currency']
            }),
            
            // Customer statistics
            Customer.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_customers'],
                    [sequelize.fn('SUM', sequelize.col('total_orders')), 'total_orders'],
                    [sequelize.fn('SUM', sequelize.col('total_spent')), 'total_spent']
                ]
            }),
            
            // Product statistics
            Product.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_products'],
                    [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_published = 1 THEN 1 END')), 'published_products'],
                    [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_available = 1 THEN 1 END')), 'available_products']
                ]
            })
        ]);

        // Recent orders
        const recentOrders = await Order.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Customer, as: 'customer', attributes: ['email', 'first_name', 'last_name'] },
                { model: Payment, as: 'payment', attributes: ['status', 'currency', 'amount'] }
            ]
        });

        // Recent payments
        const recentPayments = await Payment.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            dashboard: {
                orders: {
                    by_status: orderStats.reduce((acc, stat) => {
                        acc[stat.status] = {
                            count: parseInt(stat.get('count')),
                            total_value: parseFloat(stat.get('total_value') || 0)
                        };
                        return acc;
                    }, {}),
                    recent: recentOrders
                },
                payments: {
                    by_status_currency: paymentStats,
                    recent: recentPayments
                },
                customers: customerStats[0],
                products: productStats[0],
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching admin dashboard:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            details: error.message
        });
    }
});

// Order management
router.get('/orders', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            search,
            date_from,
            date_to,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        // Apply filters
        if (status) whereClause.status = status;
        if (search) {
            whereClause[Order.sequelize.Op.or] = [
                { order_number: { [Order.sequelize.Op.like]: `%${search}%` } },
                { customer_email: { [Order.sequelize.Op.like]: `%${search}%` } }
            ];
        }
        if (date_from || date_to) {
            whereClause.createdAt = {};
            if (date_from) whereClause.createdAt[Order.sequelize.Op.gte] = new Date(date_from);
            if (date_to) whereClause.createdAt[Order.sequelize.Op.lte] = new Date(date_to);
        }

        const { count, rows: orders } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                { model: Customer, as: 'customer' },
                { model: Payment, as: 'payment' },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
            ],
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            orders,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching admin orders:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

// Update order status (admin)
router.patch('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes, notify_customer = true } = req.body;
        
        const order = await Order.findByPk(orderId, {
            include: [{ model: Customer, as: 'customer' }]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const previousStatus = order.status;
        await order.updateStatus(status, { internal_notes: notes });

        // Send customer notification if requested
        if (notify_customer && order.customer) {
            await emailService.sendOrderStatusUpdate(
                order,
                order.customer,
                previousStatus,
                status
            );
        }

        res.json({
            success: true,
            order,
            message: 'Order status updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error updating order status:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            details: error.message
        });
    }
});

// Customer management
router.get('/customers', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Customer.sequelize.Op.or] = [
                { email: { [Customer.sequelize.Op.like]: `%${search}%` } },
                { first_name: { [Customer.sequelize.Op.like]: `%${search}%` } },
                { last_name: { [Customer.sequelize.Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: customers } = await Customer.findAndCountAll({
            where: whereClause,
            include: [
                { 
                    model: Order, 
                    as: 'orders',
                    limit: 5,
                    order: [['createdAt', 'DESC']]
                }
            ],
            order: [[sort, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            customers,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching customers:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customers',
            details: error.message
        });
    }
});

// Analytics endpoints
router.get('/analytics/sales', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const { sequelize } = require('../database/models');
        
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Daily sales
        const dailySales = await Order.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_sales']
            ],
            where: {
                createdAt: { [sequelize.Op.gte]: startDate },
                status: { [sequelize.Op.in]: ['payment_confirmed', 'processing', 'production', 'shipped', 'delivered'] }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        });

        // Top products
        const topProducts = await OrderItem.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_sold'],
                [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue']
            ],
            include: [{ model: Product, as: 'product', attributes: ['title', 'base_price', 'selling_price'] }],
            where: {
                createdAt: { [sequelize.Op.gte]: startDate }
            },
            group: ['product_id'],
            order: [[sequelize.literal('total_sold'), 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            analytics: {
                period_days: parseInt(days),
                daily_sales: dailySales,
                top_products: topProducts
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching sales analytics:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales analytics',
            details: error.message
        });
    }
});

// Inventory management
router.get('/inventory', async (req, res) => {
    try {
        const stats = await inventoryService.getInventoryStats();
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error fetching inventory stats:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory stats',
            details: error.message
        });
    }
});

// Sync inventory
router.post('/inventory/sync', async (req, res) => {
    try {
        const result = await inventoryService.syncAllProducts();
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error syncing inventory:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to sync inventory',
            details: error.message
        });
    }
});

// Adjust inventory
router.post('/inventory/:productId/adjust', async (req, res) => {
    try {
        const { productId } = req.params;
        const { adjustment, reason } = req.body;
        
        if (!adjustment || isNaN(adjustment)) {
            return res.status(400).json({
                success: false,
                error: 'Valid adjustment amount is required'
            });
        }

        const result = await inventoryService.adjustInventory(
            parseInt(productId),
            parseInt(adjustment),
            reason
        );
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error adjusting inventory:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to adjust inventory',
            details: error.message
        });
    }
});

// System health check
router.get('/system/health', async (req, res) => {
    try {
        const { sequelize } = require('../database/models');
        
        // Database health
        let dbHealth = false;
        try {
            await sequelize.authenticate();
            dbHealth = true;
        } catch (error) {
            console.error('Database health check failed:', error.message);
        }

        // Email service health
        const emailHealth = emailService.isConfigured;

        // Recent activity
        const recentOrders = await Order.count({
            where: {
                createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        const recentPayments = await Payment.count({
            where: {
                createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        res.json({
            success: true,
            health: {
                database: dbHealth,
                email_service: emailHealth,
                inventory_service: !inventoryService.isRunning,
                recent_activity: {
                    orders_24h: recentOrders,
                    payments_24h: recentPayments
                },
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error checking system health:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to check system health',
            details: error.message
        });
    }
});

// Send test email
router.post('/test/email', async (req, res) => {
    try {
        const { to, subject = 'Test Email', message = 'This is a test email from the admin panel.' } = req.body;
        
        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email is required'
            });
        }

        const result = await emailService.sendAdminNotification(
            subject,
            message,
            { test: true, sent_from: 'admin_panel' }
        );
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to send test email',
            details: error.message
        });
    }
});

// Webhook events summary
router.get('/webhooks/summary', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const summary = await printifyWebhookHandler.getWebhookEventsSummary(parseInt(days));
        
        res.json({
            success: true,
            summary
        });
        
    } catch (error) {
        console.error('❌ Error fetching webhook summary:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch webhook summary',
            details: error.message
        });
    }
});

module.exports = router;
