// routes/payments.js - Ask Copilot:
// "Create Solana payment validation endpoints with SQLite database integration
// Store payment references and track transaction status
// Handle order confirmation workflow with database persistence"

const express = require('express');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { Payment, Order, Customer } = require('../database/models');
const router = express.Router();

// Solana connection
const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
);

// Merchant wallet configuration
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_PUBLIC_KEY || 'AQH5LGJEVGPhdJf8PtHbVrpZKt6U1PW2PJb4yGj8BW6k';

// POST /api/payments/create-payment - Create payment request with database storage
router.post('/create-payment', async (req, res) => {
    try {
        const { 
            productId, 
            quantity = 1, 
            customerWallet, 
            paymentMethod = 'SOL',
            customerInfo,
            shippingAddress,
            amount,
            usdAmount,
            exchangeRate,
            memo = 'Crypto Dropship Order'
        } = req.body;
        
        // Validate input
        if (!customerWallet || (!amount && !usdAmount)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerWallet, amount'
            });
        }
        
        // Validate wallet addresses
        try {
            new PublicKey(customerWallet);
            new PublicKey(MERCHANT_WALLET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // Generate unique payment reference
        const reference = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate expiration (15 minutes from now)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        // Create payment record in database
        const payment = await Payment.create({
            payment_reference: reference,
            sender_wallet: customerWallet,
            recipient_wallet: MERCHANT_WALLET,
            amount: amount || (usdAmount / exchangeRate),
            currency: paymentMethod,
            usd_amount: usdAmount,
            exchange_rate: exchangeRate,
            status: 'pending',
            network: process.env.SOLANA_NETWORK || 'devnet',
            expires_at: expiresAt,
            memo: memo,
            payment_intent: {
                productId,
                quantity,
                customerInfo,
                shippingAddress
            }
        });
        
        // Create payment URL for Solana Pay
        const paymentUrl = new URL('solana:' + MERCHANT_WALLET);
        paymentUrl.searchParams.set('amount', payment.amount);
        if (paymentMethod === 'USDC') {
            paymentUrl.searchParams.set('spl-token', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mint on devnet
        }
        paymentUrl.searchParams.set('reference', reference);
        paymentUrl.searchParams.set('label', 'Crypto Dropship');
        paymentUrl.searchParams.set('message', memo);
        
        res.status(201).json({
            success: true,
            payment: {
                reference,
                recipient: MERCHANT_WALLET,
                amount: payment.amount,
                currency: paymentMethod,
                usd_amount: usdAmount,
                exchange_rate: exchangeRate,
                payment_url: paymentUrl.toString(),
                expires_at: expiresAt,
                status: 'pending',
                qr_code_data: {
                    recipient: MERCHANT_WALLET,
                    amount: payment.amount,
                    reference: reference,
                    label: 'Crypto Dropship',
                    message: memo,
                    memo: reference
                }
            },
            message: 'Payment request created successfully'
        });
        
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment request',
            details: error.message
        });
    }
});

// GET /api/payments/:reference/status - Check payment status
router.get('/:reference/status', async (req, res) => {
    try {
        const { reference } = req.params;
        
        const payment = await Payment.findByReference(reference);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        // Check if payment has expired
        if (payment.isExpired() && payment.status === 'pending') {
            await payment.markExpired();
        }
        
        res.json({
            success: true,
            payment: {
                reference: payment.payment_reference,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                transaction_signature: payment.transaction_signature,
                confirmed_at: payment.confirmed_at,
                expires_at: payment.expires_at,
                error_message: payment.error_message
            }
        });
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check payment status',
            details: error.message
        });
    }
});

// POST /api/payments/:reference/confirm - Manually confirm payment with transaction signature
router.post('/:reference/confirm', async (req, res) => {
    try {
        const { reference } = req.params;
        const { signature } = req.body;
        
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Transaction signature is required'
            });
        }
        
        const payment = await Payment.findByReference(reference);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Payment is already ${payment.status}`
            });
        }

        // Verify transaction on blockchain
        try {
            const transaction = await connection.getTransaction(signature, {
                commitment: 'confirmed'
            });
            
            if (!transaction) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction not found on blockchain'
                });
            }

            // Validate transaction details
            const { meta, transaction: tx } = transaction;
            if (meta.err) {
                await payment.markFailed('Transaction failed on blockchain');
                return res.status(400).json({
                    success: false,
                    error: 'Transaction failed on blockchain'
                });
            }

            // Mark payment as confirmed
            await payment.markConfirmed(signature, transaction.slot);
            
            res.json({
                success: true,
                payment: {
                    reference: payment.payment_reference,
                    status: payment.status,
                    transaction_signature: payment.transaction_signature,
                    confirmed_at: payment.confirmed_at,
                    block_height: payment.block_height
                },
                message: 'Payment confirmed successfully'
            });

        } catch (blockchainError) {
            console.error('Blockchain verification error:', blockchainError);
            await payment.markFailed('Failed to verify transaction on blockchain');
            
            res.status(400).json({
                success: false,
                error: 'Failed to verify transaction on blockchain',
                details: blockchainError.message
            });
        }
        
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm payment',
            details: error.message
        });
    }
});

// POST /api/payments/webhook - Webhook for automatic payment detection
router.post('/webhook', async (req, res) => {
    try {
        const { signature, reference } = req.body;
        
        if (!signature || !reference) {
            return res.status(400).json({
                success: false,
                error: 'Missing signature or reference'
            });
        }

        const payment = await Payment.findByReference(reference);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        if (payment.status !== 'pending') {
            return res.json({
                success: true,
                message: 'Payment already processed'
            });
        }

        // Verify and confirm payment
        try {
            const transaction = await connection.getTransaction(signature, {
                commitment: 'confirmed'
            });
            
            if (transaction && !transaction.meta.err) {
                await payment.markConfirmed(signature, transaction.slot);
                
                // Auto-create order if payment intent exists
                if (payment.payment_intent && payment.payment_intent.customerInfo) {
                    const orderData = payment.payment_intent;
                    // This would trigger order creation in the orders service
                    console.log('Auto-creating order for confirmed payment:', reference);
                }
            }
        } catch (error) {
            console.error('Webhook verification error:', error);
        }
        
        res.json({
            success: true,
            message: 'Webhook processed'
        });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});

// GET /api/payments/wallet/:address - Get payments by wallet address
router.get('/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        // Validate wallet address
        try {
            new PublicKey(address);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const payments = await Payment.findByWallet(address);
        
        res.json({
            success: true,
            payments: payments.slice(offset, offset + parseInt(limit)),
            total: payments.length
        });
        
    } catch (error) {
        console.error('Error fetching wallet payments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch wallet payments',
            details: error.message
        });
    }
});

// GET /api/payments/pending - Get all pending payments
router.get('/pending', async (req, res) => {
    try {
        const pendingPayments = await Payment.findPending();
        
        res.json({
            success: true,
            payments: pendingPayments,
            count: pendingPayments.length
        });
        
    } catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending payments',
            details: error.message
        });
    }
});

// POST /api/payments/cleanup-expired - Clean up expired payments
router.post('/cleanup-expired', async (req, res) => {
    try {
        const expiredPayments = await Payment.findExpired();
        
        let updatedCount = 0;
        for (const payment of expiredPayments) {
            await payment.markExpired();
            updatedCount++;
        }
        
        res.json({
            success: true,
            message: `Marked ${updatedCount} payments as expired`,
            count: updatedCount
        });
        
    } catch (error) {
        console.error('Error cleaning up expired payments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup expired payments',
            details: error.message
        });
    }
});

// GET /api/payments/analytics - Payment analytics
router.get('/analytics', async (req, res) => {
    try {
        const { sequelize } = require('../database/models');
        
        // Get payment counts by status
        const statusCounts = await Payment.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        // Get payment counts by currency
        const currencyCounts = await Payment.findAll({
            attributes: [
                'currency',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
            ],
            group: ['currency']
        });

        // Get total confirmed payments value
        const totalValue = await Payment.sum('usd_amount', {
            where: { status: 'confirmed' }
        });

        res.json({
            success: true,
            analytics: {
                statusCounts: statusCounts.reduce((acc, item) => {
                    acc[item.status] = parseInt(item.get('count'));
                    return acc;
                }, {}),
                currencyCounts: currencyCounts.reduce((acc, item) => {
                    acc[item.currency] = {
                        count: parseInt(item.get('count')),
                        total_amount: parseFloat(item.get('total_amount') || 0)
                    };
                    return acc;
                }, {}),
                totalValue: totalValue || 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching payment analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment analytics',
            details: error.message
        });
    }
});

module.exports = router;
