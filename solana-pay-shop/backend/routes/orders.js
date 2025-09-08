/**
 * Order Management API Routes
 * Handles order creation, tracking, and management
 */

const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const OrderManagementService = require('../services/orderManagement');
const EmailService = require('../services/emailService');
const InventoryService = require('../services/inventoryService');
const AnalyticsService = require('../services/analyticsService');

const router = express.Router();

// Initialize services
const orderService = new OrderManagementService();
const emailService = new EmailService();
const inventoryService = new InventoryService();
const analyticsService = new AnalyticsService();

/**
 * Create a new order
 * POST /api/orders
 */
router.post('/',
    [
        body('customerInfo.email').isEmail().withMessage('Valid email is required'),
        body('customerInfo.name').notEmpty().withMessage('Customer name is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.id').notEmpty().withMessage('Item ID is required'),
        body('items.*.name').notEmpty().withMessage('Item name is required'),
        body('items.*.price').isFloat({ min: 0 }).withMessage('Valid item price is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid item quantity is required'),
        body('paymentToken').optional().isIn(['SOL', 'USDC', 'USDT']).withMessage('Invalid payment token'),
        body('shippingAddress').optional().isObject()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const orderData = req.body;
            
            // Check inventory availability
            const inventoryCheck = await inventoryService.checkAvailability(orderData.items);
            if (!inventoryCheck.available) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient inventory',
                    unavailableItems: inventoryCheck.unavailableItems
                });
            }

            // Reserve inventory
            const reservationId = await inventoryService.reserveStock(orderData.items);
            
            // Create order
            const order = await orderService.createOrder({
                ...orderData,
                reservationId,
                sessionId: req.sessionID || req.headers['x-session-id']
            });

            // Track analytics
            await analyticsService.trackUserSession(order.sessionId || 'anonymous', {
                event: 'order_created',
                eventData: { orderId: order.id, amount: order.total }
            });

            // Send order confirmation email
            await emailService.sendOrderConfirmation(order);

            res.status(201).json({
                success: true,
                order: {
                    id: order.id,
                    status: order.status,
                    total: order.total,
                    currency: order.currency,
                    paymentToken: order.paymentToken,
                    estimatedDelivery: order.estimatedDelivery,
                    trackingNumber: order.trackingNumber
                }
            });

        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
router.get('/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: 'Invalid order ID'
            });
        }

        res.json(order);

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            error: 'Failed to fetch order',
            message: error.message
        });
    }
});

/**
 * Get order by order number
 * GET /api/orders/lookup/:orderNumber
 */
router.get('/lookup/:orderNumber', (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = Array.from(orders.values()).find(o => 
            o.orderNumber.toLowerCase() === orderNumber.toLowerCase()
        );

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: 'Invalid order number'
            });
        }

        res.json(order);

    } catch (error) {
        console.error('Error looking up order:', error);
        res.status(500).json({
            error: 'Failed to lookup order',
            message: error.message
        });
    }
});

/**
 * Update order status
 * PUT /api/orders/:orderId/status
 */
router.put('/:orderId/status', (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus, shippingStatus, notes } = req.body;

        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: 'Invalid order ID'
            });
        }

        // Valid status values
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        const validShippingStatuses = ['not_shipped', 'processing', 'shipped', 'delivered'];

        // Update status fields if provided and valid
        if (status && validStatuses.includes(status)) {
            order.status = status;
        }

        if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
            order.paymentStatus = paymentStatus;
        }

        if (shippingStatus && validShippingStatuses.includes(shippingStatus)) {
            order.shippingStatus = shippingStatus;
        }

        if (notes) {
            if (!order.notes) order.notes = [];
            order.notes.push({
                note: notes,
                timestamp: new Date().toISOString()
            });
        }

        order.updatedAt = new Date().toISOString();

        // Store updated order
        orders.set(orderId, order);

        res.json({
            orderId,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            shippingStatus: order.shippingStatus,
            updatedAt: order.updatedAt,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            error: 'Failed to update order status',
            message: error.message
        });
    }
});

/**
 * Get all orders (with pagination and filtering)
 * GET /api/orders
 */
router.get('/', (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            paymentStatus, 
            customerEmail,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let allOrders = Array.from(orders.values());

        // Apply filters
        if (status) {
            allOrders = allOrders.filter(order => order.status === status);
        }

        if (paymentStatus) {
            allOrders = allOrders.filter(order => order.paymentStatus === paymentStatus);
        }

        if (customerEmail) {
            allOrders = allOrders.filter(order => 
                order.customerInfo.email.toLowerCase().includes(customerEmail.toLowerCase())
            );
        }

        // Sort orders
        allOrders.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedOrders = allOrders.slice(startIndex, endIndex);

        // Remove sensitive customer info for list view
        const publicOrders = paginatedOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            shippingStatus: order.shippingStatus,
            pricing: order.pricing,
            itemCount: order.items.length,
            customerEmail: order.customerInfo.email,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        res.json({
            orders: publicOrders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allOrders.length,
                totalPages: Math.ceil(allOrders.length / limit),
                hasNext: endIndex < allOrders.length,
                hasPrev: startIndex > 0
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

/**
 * Cancel an order
 * POST /api/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found',
                message: 'Invalid order ID'
            });
        }

        // Check if order can be cancelled
        if (order.status === 'delivered') {
            return res.status(400).json({
                error: 'Cannot cancel order',
                message: 'Order has already been delivered'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                error: 'Order already cancelled',
                message: 'This order has already been cancelled'
            });
        }

        // Cancel the order
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        order.cancellationReason = reason || 'Customer request';
        order.updatedAt = new Date().toISOString();

        // Add cancellation note
        if (!order.notes) order.notes = [];
        order.notes.push({
            note: `Order cancelled: ${order.cancellationReason}`,
            timestamp: order.cancelledAt
        });

        orders.set(orderId, order);

        res.json({
            orderId,
            orderNumber: order.orderNumber,
            status: order.status,
            cancelledAt: order.cancelledAt,
            reason: order.cancellationReason,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            error: 'Failed to cancel order',
            message: error.message
        });
    }
});

/**
 * Get order statistics
 * GET /api/orders/stats/summary
 */
router.get('/stats/summary', (req, res) => {
    try {
        const allOrders = Array.from(orders.values());

        const stats = {
            totalOrders: allOrders.length,
            pendingOrders: allOrders.filter(o => o.status === 'pending').length,
            confirmedOrders: allOrders.filter(o => o.status === 'confirmed').length,
            shippedOrders: allOrders.filter(o => o.status === 'shipped').length,
            deliveredOrders: allOrders.filter(o => o.status === 'delivered').length,
            cancelledOrders: allOrders.filter(o => o.status === 'cancelled').length,
            totalRevenue: allOrders
                .filter(o => o.paymentStatus === 'paid')
                .reduce((sum, o) => sum + o.pricing.total, 0),
            averageOrderValue: allOrders.length > 0 
                ? allOrders.reduce((sum, o) => sum + o.pricing.total, 0) / allOrders.length 
                : 0
        };

        // Round monetary values
        stats.totalRevenue = Number(stats.totalRevenue.toFixed(2));
        stats.averageOrderValue = Number(stats.averageOrderValue.toFixed(2));

        res.json(stats);

    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            error: 'Failed to fetch order statistics',
            message: error.message
        });
    }
});

module.exports = router;
