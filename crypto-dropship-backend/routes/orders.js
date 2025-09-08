// routes/orders.js - Ask Copilot:
// "Create order management routes with SQLite database integration
// Handle order creation, tracking, status updates, and customer history
// Include relationships to Customer, Payment, Product, and OrderItem models"

const express = require('express');
const { Order, OrderItem, Customer, Payment, Product } = require('../database/models');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
    try {
        const {
            productId,
            quantity = 1,
            customerInfo,
            shippingAddress,
            billingAddress,
            paymentReference,
            items = []
        } = req.body;
        
        // Validate required fields
        if (!customerInfo || !shippingAddress || !paymentReference) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerInfo, shippingAddress, paymentReference'
            });
        }

        // Find or create customer
        let customer = await Customer.findByEmail(customerInfo.email);
        if (!customer) {
            customer = await Customer.create({
                email: customerInfo.email,
                first_name: customerInfo.firstName || customerInfo.name?.split(' ')[0] || '',
                last_name: customerInfo.lastName || customerInfo.name?.split(' ').slice(1).join(' ') || '',
                phone: customerInfo.phone,
                wallet_address: customerInfo.walletAddress,
                shipping_address: shippingAddress,
                billing_address: billingAddress || shippingAddress
            });
        }

        // Find payment by reference
        const payment = await Payment.findByReference(paymentReference);
        if (!payment) {
            return res.status(400).json({
                success: false,
                error: 'Payment reference not found'
            });
        }

        // Create order
        const order = await Order.create({
            customer_id: customer.id,
            payment_id: payment.id,
            customer_email: customerInfo.email,
            customer_phone: customerInfo.phone,
            shipping_address: shippingAddress,
            billing_address: billingAddress || shippingAddress,
            status: 'pending_payment',
            currency: payment.currency,
            crypto_amount: payment.amount,
            exchange_rate: payment.exchange_rate,
            customer_ip: req.ip,
            user_agent: req.get('User-Agent')
        });

        // Generate order number
        order.generateOrderNumber();
        await order.save();

        // Create order items
        let subtotal = 0;
        const orderItems = [];

        // Handle single product order (legacy support)
        if (productId && !items.length) {
            const product = await Product.findByPk(productId);
            if (product) {
                const orderItem = await OrderItem.create({
                    order_id: order.id,
                    product_id: product.id,
                    printify_product_id: product.printify_product_id,
                    product_title: product.title,
                    quantity: quantity,
                    unit_price: product.selling_price,
                    cost_price: product.base_price
                });
                orderItem.calculateTotal();
                orderItem.calculateProfit();
                await orderItem.save();
                
                orderItems.push(orderItem);
                subtotal += parseFloat(orderItem.total_price);
            }
        }

        // Handle multiple items
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (product) {
                const orderItem = await OrderItem.create({
                    order_id: order.id,
                    product_id: product.id,
                    printify_product_id: product.printify_product_id,
                    printify_variant_id: item.variantId,
                    product_title: product.title,
                    variant_title: item.variantTitle,
                    product_image: item.image || (product.images && product.images[0]),
                    quantity: item.quantity,
                    unit_price: item.price || product.selling_price,
                    cost_price: product.base_price,
                    variant_details: item.variantDetails || {},
                    customization: item.customization || {}
                });
                orderItem.calculateTotal();
                orderItem.calculateProfit();
                await orderItem.save();
                
                orderItems.push(orderItem);
                subtotal += parseFloat(orderItem.total_price);
            }
        }

        // Update order totals
        order.subtotal = subtotal;
        order.calculateTotal();
        await order.save();

        // Update customer stats
        await customer.updateOrderStats(order.total_amount);

        // Load order with associations for response
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                { model: Customer, as: 'customer' },
                { model: Payment, as: 'payment' },
                { model: OrderItem, as: 'items' }
            ]
        });

        res.status(201).json({
            success: true,
            order: completeOrder,
            message: 'Order created successfully'
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            details: error.message
        });
    }
});

// Get order by ID or order number
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Try to find by order number first, then by ID
        let order = await Order.findByOrderNumber(identifier);
        if (!order) {
            order = await Order.findByPk(identifier, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Payment, as: 'payment' },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
                ]
            });
        } else {
            // Load associations
            order = await Order.findByPk(order.id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Payment, as: 'payment' },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
                ]
            });
        }
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            order
        });
        
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            details: error.message
        });
    }
});

// Get all orders with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            customer_email,
            payment_status,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        // Apply filters
        if (status) whereClause.status = status;
        if (customer_email) whereClause.customer_email = customer_email;

        const { count, rows: orders } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                { model: Customer, as: 'customer' },
                { model: Payment, as: 'payment' },
                { model: OrderItem, as: 'items' }
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
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, tracking_number, carrier, notes } = req.body;
        
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Update order status
        const additionalData = {};
        if (tracking_number) additionalData.tracking_number = tracking_number;
        if (carrier) additionalData.carrier = carrier;
        if (notes) additionalData.notes = notes;

        await order.updateStatus(status, additionalData);

        // Update payment status if order is confirmed
        if (status === 'payment_confirmed' && order.payment_id) {
            const payment = await Payment.findByPk(order.payment_id);
            if (payment && payment.status === 'pending') {
                await payment.markConfirmed(payment.transaction_signature, payment.block_height);
            }
        }

        res.json({
            success: true,
            order: await Order.findByPk(order.id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Payment, as: 'payment' },
                    { model: OrderItem, as: 'items' }
                ]
            }),
            message: 'Order status updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            details: error.message
        });
    }
});

module.exports = router;
