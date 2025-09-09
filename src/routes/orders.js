const express = require('express');
const router = express.Router();
const { Order, Customer, OrderItem, Product, Payment } = require('../models');

// GET /api/orders - Get all orders
router.get('/', async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            customer_email,
            payment_status
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        if (status) where.status = status;
        if (customer_email) where.customer_email = customer_email;
        if (payment_status) where.payment_status = payment_status;

        const orders = await Order.findAndCountAll({
            where,
            include: [
                { model: Customer, as: 'customer' },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                { model: Payment, as: 'payments' }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: orders.rows,
            pagination: {
                total: orders.count,
                page: parseInt(page),
                pages: Math.ceil(orders.count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/orders - Create new order
router.post('/', async (req, res, next) => {
    try {
        const {
            customer_email,
            items,
            shipping_address,
            billing_address,
            payment_method = 'solana'
        } = req.body;

        if (!customer_email || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer email and items are required'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.product_id);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.product_id} not found`
                });
            }

            const quantity = parseInt(item.quantity) || 1;
            const unitPrice = parseFloat(product.base_price);
            const totalPrice = unitPrice * quantity;
            
            subtotal += totalPrice;

            orderItems.push({
                product_id: product.id,
                printify_product_id: product.printify_product_id,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice,
                product_title: product.title,
                product_image: product.images && product.images.length > 0 ? product.images[0].src : null,
                variant_id: item.variant_id,
                variant_title: item.variant_title,
                product_options: item.options || {}
            });
        }

        const shippingCost = 0; // Calculate shipping
        const taxAmount = 0; // Calculate tax
        const totalAmount = subtotal + shippingCost + taxAmount;

        // Generate order number
        const orderNumber = `SSPAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create order
        const order = await Order.create({
            order_number: orderNumber,
            customer_email,
            payment_method,
            subtotal,
            shipping_cost: shippingCost,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            shipping_address: shipping_address || {},
            billing_address: billing_address || shipping_address || {},
            status: 'pending',
            payment_status: 'pending'
        });

        // Create order items
        for (const itemData of orderItems) {
            await OrderItem.create({
                ...itemData,
                order_id: order.id
            });
        }

        // Fetch complete order with associations
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                { model: Customer, as: 'customer' },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
            ]
        });

        res.status(201).json({
            success: true,
            data: completeOrder,
            message: 'Order created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findByPk(id, {
            include: [
                { model: Customer, as: 'customer' },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                { model: Payment, as: 'payments' }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, tracking_number, notes } = req.body;

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updateData = { status };
        if (tracking_number) updateData.tracking_number = tracking_number;
        if (notes) updateData.notes = notes;

        await order.update(updateData);

        res.json({
            success: true,
            data: order,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
