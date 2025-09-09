const express = require('express');
const router = express.Router();
const { Order, Payment, OrderItem, Product, Customer } = require('../models');
const solanaService = require('../services/solanaService');

// GET /api/payments - Get all payments
router.get('/', async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            currency,
            order_id
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        if (status) where.status = status;
        if (currency) where.currency = currency;
        if (order_id) where.order_id = order_id;

        const payments = await Payment.findAndCountAll({
            where,
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        { model: Customer, as: 'customer' }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: payments.rows,
            pagination: {
                total: payments.count,
                page: parseInt(page),
                pages: Math.ceil(payments.count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/payments/create - Create payment request
router.post('/create', async (req, res, next) => {
    try {
        const { order_id, amount, currency = 'SOL' } = req.body;

        if (!order_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and amount are required'
            });
        }

        // Find the order
        const order = await Order.findByPk(order_id, {
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Generate unique reference
        const reference = solanaService.generateReference();
        
        // Create payment record
        const payment = await Payment.create({
            payment_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order_id: order.id,
            amount: amount,
            currency: currency.toUpperCase(),
            usd_amount: order.total_amount,
            status: 'pending',
            reference_key: reference,
            wallet_address: order.wallet_address,
            metadata: {
                created_via: 'api',
                order_number: order.order_number
            }
        });

        // Create Solana Pay URL
        const paymentRequest = await solanaService.createPaymentRequest(
            amount,
            reference,
            `SSPAY Order #${order.order_number}`,
            `Payment for order ${order.order_number}`
        );

        res.json({
            success: true,
            data: {
                payment,
                payment_url: paymentRequest.url,
                qr_code: paymentRequest.qrCode,
                reference: reference,
                expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/payments/verify - Verify payment
router.post('/verify', async (req, res, next) => {
    try {
        const { payment_id, transaction_signature } = req.body;

        if (!payment_id || !transaction_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID and transaction signature are required'
            });
        }

        // Find the payment
        const payment = await Payment.findOne({
            where: { payment_id },
            include: [{ model: Order, as: 'order' }]
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify the transaction on Solana
        const verification = await solanaService.validateTransaction(transaction_signature);

        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction',
                details: verification.error
            });
        }

        // Update payment status
        await payment.update({
            transaction_signature,
            status: 'confirmed',
            confirmation_count: 1,
            block_height: verification.transaction.slot,
            metadata: {
                ...payment.metadata,
                verified_at: new Date().toISOString(),
                block_time: verification.transaction.blockTime
            }
        });

        // Update order status
        await payment.order.update({
            payment_status: 'completed',
            status: 'processing',
            transaction_signature
        });

        res.json({
            success: true,
            data: payment,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/payments/:id - Get payment details
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const payment = await Payment.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        { model: Customer, as: 'customer' },
                        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
                    ]
                }
            ]
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/payments/:id/refund - Process refund
router.post('/:id/refund', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const payment = await Payment.findByPk(id, {
            include: [{ model: Order, as: 'order' }]
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Can only refund confirmed payments'
            });
        }

        // Update payment and order status
        await payment.update({
            status: 'refunded',
            metadata: {
                ...payment.metadata,
                refunded_at: new Date().toISOString(),
                refund_reason: reason
            }
        });

        await payment.order.update({
            payment_status: 'refunded',
            status: 'cancelled'
        });

        res.json({
            success: true,
            data: payment,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/payments/transaction/:signature - Get payment by transaction signature
router.get('/transaction/:signature', async (req, res, next) => {
    try {
        const { signature } = req.params;
        
        const payment = await Payment.findOne({
            where: { transaction_signature: signature },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{ model: Customer, as: 'customer' }]
                }
            ]
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Get transaction details from Solana
        try {
            const transactionDetails = await solanaService.getTransactionDetails(signature);
            
            res.json({
                success: true,
                data: {
                    payment,
                    transaction: transactionDetails
                }
            });
        } catch (error) {
            res.json({
                success: true,
                data: payment,
                warning: 'Could not fetch transaction details from blockchain'
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
