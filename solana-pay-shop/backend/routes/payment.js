const express = require('express');
const router = express.Router();
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { encodeURL, createQR } = require('@solana/pay');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const PrintifyApiService = require('../services/printifyApi');
const SPLTokenService = require('../services/splTokenService');
const { validators } = require('../middleware/validation');

// Solana connection
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Initialize services
const printifyApi = new PrintifyApiService();
const splTokenService = new SPLTokenService();

// In-memory storage for payment requests (use database in production)
const paymentRequests = new Map();

/**
 * Get supported payment tokens
 * GET /api/payment/tokens
 */
router.get('/tokens', async (req, res) => {
    try {
        const supportedTokens = splTokenService.getSupportedTokens();
        const currentPrices = await splTokenService.getCurrentPrices();
        
        res.json({
            success: true,
            tokens: supportedTokens,
            prices: currentPrices
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({
            error: 'Failed to fetch supported tokens',
            message: error.message
        });
    }
});

/**
 * Calculate payment amount in specific token
 * POST /api/payment/calculate
 */
router.post('/calculate', async (req, res) => {
    try {
        const { usdAmount, tokenSymbol } = req.body;
        
        if (!usdAmount || !tokenSymbol) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'usdAmount and tokenSymbol are required'
            });
        }
        
        const calculation = splTokenService.calculateTokenAmount(usdAmount, tokenSymbol);
        
        res.json({
            success: true,
            ...calculation
        });
    } catch (error) {
        console.error('Error calculating payment amount:', error);
        res.status(400).json({
            error: 'Calculation failed',
            message: error.message
        });
    }
});

/**
 * Create a new payment request
 * POST /api/payment/create-payment
 */
router.post('/create-payment', validators.payment.createPayment, async (req, res) => {
    try {
        const { items, total, currency = 'USD', paymentToken = 'SOL' } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Invalid items',
                message: 'Items array is required and cannot be empty'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                error: 'Invalid total',
                message: 'Total must be greater than 0'
            });
        }

        // Generate unique payment ID and reference
        const paymentId = uuidv4();
        const reference = uuidv4();

        // Merchant wallet (replace with your actual wallet address)
        const recipient = new PublicKey(process.env.MERCHANT_WALLET || 'YourSolanaWalletAddressHere');

        // Calculate payment amount in the selected token
        const tokenCalculation = splTokenService.calculateTokenAmount(total, paymentToken);
        
        console.log(`💰 Payment calculation for ${paymentToken}:`, tokenCalculation);

        // Create payment URL with SPL token support
        const paymentUrl = splTokenService.createTokenPaymentURL(
            recipient.toString(),
            tokenCalculation.amount,
            paymentToken,
            reference,
            `Payment for order ${paymentId.slice(0, 8)}`
        );

        // Generate QR code
        const qrCode = await QRCode.toDataURL(paymentUrl);

        // Store payment request
        const paymentRequest = {
            id: paymentId,
            reference: reference,
            items,
            total,
            currency,
            paymentToken,
            tokenAmount: tokenCalculation.amount,
            tokenDisplayAmount: tokenCalculation.displayAmount,
            recipient: recipient.toString(),
            url: paymentUrl,
            qrCode,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        };

        paymentRequests.set(paymentId, paymentRequest);

        res.json({
            success: true,
            paymentId,
            reference,
            url: paymentUrl,
            qrCode,
            amount: tokenCalculation.displayAmount,
            tokenAmount: tokenCalculation.amount,
            paymentToken,
            currency: paymentToken,
            usdTotal: total,
            recipient: recipient.toString(),
            expiresAt: paymentRequest.expiresAt,
            status: 'pending',
            memo: `Payment for order ${paymentId.slice(0, 8)}`
        });

    } catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({
            error: 'Payment creation failed',
            message: error.message
        });
    }
});

/**
 * Create a new payment request (legacy endpoint)
 * POST /api/payment/create
 */
router.post('/create', async (req, res) => {
    try {
        const { items, total, currency = 'USD' } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Invalid items',
                message: 'Items array is required and cannot be empty'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                error: 'Invalid total',
                message: 'Total must be greater than 0'
            });
        }

        // Generate unique payment ID
        const paymentId = uuidv4();

        // Merchant wallet (replace with your actual wallet address)
        const recipient = new PublicKey(process.env.MERCHANT_WALLET || 'YourSolanaWalletAddressHere');

        // Convert USD to SOL (mock conversion rate - use real API in production)
        const solPrice = 20; // $20 per SOL (example rate)
        const amount = total / solPrice;

        // Create payment URL
        const url = encodeURL({
            recipient,
            amount,
            label: 'Solana Pay Shop',
            message: `Payment for order ${paymentId.slice(0, 8)}`,
            memo: paymentId,
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(url.toString());

        // Store payment request
        const paymentRequest = {
            id: paymentId,
            items,
            total,
            currency,
            amount,
            recipient: recipient.toString(),
            url: url.toString(),
            qrCode,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        };

        paymentRequests.set(paymentId, paymentRequest);

        res.json({
            paymentId,
            url: url.toString(),
            qrCode,
            amount,
            currency: 'SOL',
            expiresAt: paymentRequest.expiresAt,
            status: 'pending'
        });

    } catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({
            error: 'Payment creation failed',
            message: error.message
        });
    }
});

/**
 * Check order status
 * GET /api/payment/order-status/:paymentId
 */
router.get('/order-status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRequest = paymentRequests.get(paymentId);

        if (!paymentRequest) {
            return res.status(404).json({
                error: 'Order not found',
                message: 'Invalid payment/order ID'
            });
        }

        // Check if payment has expired
        if (new Date() > new Date(paymentRequest.expiresAt) && paymentRequest.status === 'pending') {
            paymentRequest.status = 'expired';
            paymentRequests.set(paymentId, paymentRequest);
        }

        // Determine order status based on payment status
        let orderStatus = 'pending';
        let orderMessage = 'Order is pending payment';

        switch (paymentRequest.status) {
            case 'pending':
                orderStatus = 'awaiting_payment';
                orderMessage = 'Waiting for payment confirmation';
                break;
            case 'completed':
                orderStatus = 'processing';
                orderMessage = 'Payment confirmed, order is being processed';
                break;
            case 'expired':
                orderStatus = 'expired';
                orderMessage = 'Payment expired, order cancelled';
                break;
            case 'cancelled':
                orderStatus = 'cancelled';
                orderMessage = 'Order has been cancelled';
                break;
        }

        // If we have a Printify order ID, we could check its status
        if (paymentRequest.printifyOrderId) {
            orderStatus = 'fulfillment';
            orderMessage = 'Order sent to fulfillment center';
        }

        res.json({
            paymentId,
            orderNumber: `SOL-${paymentId.slice(0, 8).toUpperCase()}`,
            orderStatus,
            orderMessage,
            paymentStatus: paymentRequest.status,
            items: paymentRequest.items,
            total: paymentRequest.total,
            amount: paymentRequest.amount,
            currency: 'SOL',
            createdAt: paymentRequest.createdAt,
            expiresAt: paymentRequest.expiresAt,
            completedAt: paymentRequest.completedAt || null,
            signature: paymentRequest.signature || null,
            printifyOrderId: paymentRequest.printifyOrderId || null
        });

    } catch (error) {
        console.error('Error checking order status:', error);
        res.status(500).json({
            error: 'Order status check failed',
            message: error.message
        });
    }
});

/**
 * Check payment status (legacy endpoint)
 * GET /api/payment/status/:paymentId
 */
router.get('/status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRequest = paymentRequests.get(paymentId);

        if (!paymentRequest) {
            return res.status(404).json({
                error: 'Payment not found',
                message: 'Invalid payment ID'
            });
        }

        // Check if payment has expired
        if (new Date() > new Date(paymentRequest.expiresAt)) {
            paymentRequest.status = 'expired';
            paymentRequests.set(paymentId, paymentRequest);
        }

        // In a real implementation, you would check the Solana blockchain
        // for the actual transaction status here
        // For now, we'll return the stored status

        res.json({
            paymentId,
            status: paymentRequest.status,
            amount: paymentRequest.amount,
            currency: 'SOL',
            createdAt: paymentRequest.createdAt,
            expiresAt: paymentRequest.expiresAt
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            error: 'Status check failed',
            message: error.message
        });
    }
});

/**
 * Verify payment (webhook endpoint for Solana Pay)
 * POST /api/payment/verify-payment
 */
router.post('/verify-payment', validators.payment.verifyPayment, async (req, res) => {
    try {
        const { paymentId, signature } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                error: 'Missing payment ID',
                message: 'Payment ID is required'
            });
        }

        const paymentRequest = paymentRequests.get(paymentId);

        if (!paymentRequest) {
            return res.status(404).json({
                error: 'Payment not found',
                message: 'Invalid payment ID'
            });
        }

        if (!signature) {
            return res.status(400).json({
                error: 'Missing signature',
                message: 'Transaction signature is required'
            });
        }

        // Verify the transaction on Solana blockchain
        try {
            const paymentToken = paymentRequest.paymentToken || 'SOL';
            const expectedAmount = paymentRequest.tokenAmount;
            const recipient = paymentRequest.recipient;

            console.log(`🔍 Verifying ${paymentToken} payment:`, {
                paymentId,
                signature,
                expectedAmount,
                recipient
            });

            // Use SPL token service for validation
            const validationResult = await splTokenService.validateTokenTransaction(
                signature,
                expectedAmount,
                paymentToken,
                recipient
            );

            if (validationResult.valid) {
                // Payment verified successfully
                paymentRequest.status = 'completed';
                paymentRequest.signature = signature;
                paymentRequest.completedAt = new Date().toISOString();
                paymentRequest.validationResult = validationResult;
                
                console.log(`✅ ${paymentToken} payment verified successfully`);
                
                // Create Printify order if payment is verified
                try {
                    console.log('🛍️  Creating Printify order for completed payment...');
                    
                    // Get associated order data (you'll need to link this with your order system)
                    const orderData = {
                        id: paymentId,
                        orderNumber: `SOL-${paymentId.slice(0, 8).toUpperCase()}`,
                        items: paymentRequest.items || [],
                        customerInfo: {
                            email: 'customer@example.com', // You'll need to collect this from frontend
                            name: 'Crypto Customer'
                        },
                        shippingAddress: {
                            firstName: 'Crypto',
                            lastName: 'Customer',
                            country: 'US',
                            address1: '123 Blockchain Ave',
                            city: 'Crypto City',
                            state: 'CA',
                            zip: '90210'
                        }
                    };
                    
                    // Commented out for now to avoid API calls during testing
                    // const printifyOrder = await printifyApi.createOrder(orderData);
                    // paymentRequest.printifyOrderId = printifyOrder.id;
                    
                    console.log('✅ Order processing initiated for payment:', paymentId);
                    
                } catch (printifyError) {
                    console.error('❌ Failed to create Printify order:', printifyError.message);
                    // Don't fail the payment verification, just log the error
                    paymentRequest.printifyError = printifyError.message;
                }
                
                paymentRequests.set(paymentId, paymentRequest);

                res.json({
                    paymentId,
                    status: 'completed',
                    signature,
                    message: 'Payment verified successfully',
                    printifyOrderId: paymentRequest.printifyOrderId || null
                });
            } else {
                res.status(400).json({
                    error: 'Transaction failed',
                    message: 'Transaction was not successful'
                });
            }
        } catch (verifyError) {
            console.error('Error verifying transaction:', verifyError);
            res.status(400).json({
                error: 'Verification failed',
                message: 'Could not verify transaction on blockchain'
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            error: 'Payment verification failed',
            message: error.message
        });
    }
});

/**
 * Verify payment (webhook endpoint for Solana Pay) - Legacy endpoint
 * POST /api/payment/verify/:paymentId
 */
router.post('/verify/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { signature } = req.body;

        const paymentRequest = paymentRequests.get(paymentId);

        if (!paymentRequest) {
            return res.status(404).json({
                error: 'Payment not found',
                message: 'Invalid payment ID'
            });
        }

        if (!signature) {
            return res.status(400).json({
                error: 'Missing signature',
                message: 'Transaction signature is required'
            });
        }

        // Verify the transaction on Solana blockchain
        try {
            const transaction = await connection.getTransaction(signature, {
                commitment: 'confirmed'
            });

            if (transaction && transaction.meta && !transaction.meta.err) {
                // Payment verified successfully
                paymentRequest.status = 'completed';
                paymentRequest.signature = signature;
                paymentRequest.completedAt = new Date().toISOString();
                
                // Create Printify order if payment is verified
                try {
                    console.log('🛍️  Creating Printify order for completed payment...');
                    
                    // Get associated order data (you'll need to link this with your order system)
                    const orderData = {
                        id: paymentId,
                        orderNumber: `SOL-${paymentId.slice(0, 8).toUpperCase()}`,
                        items: paymentRequest.items || [],
                        customerInfo: {
                            email: 'customer@example.com', // You'll need to collect this from frontend
                            name: 'Crypto Customer'
                        },
                        shippingAddress: {
                            firstName: 'Crypto',
                            lastName: 'Customer',
                            country: 'US',
                            address1: '123 Blockchain Ave',
                            city: 'Crypto City',
                            state: 'CA',
                            zip: '90210'
                        }
                    };
                    
                    const printifyOrder = await printifyApi.createOrder(orderData);
                    paymentRequest.printifyOrderId = printifyOrder.id;
                    
                    console.log('✅ Printify order created:', printifyOrder.id);
                    
                } catch (printifyError) {
                    console.error('❌ Failed to create Printify order:', printifyError.message);
                    // Don't fail the payment verification, just log the error
                    paymentRequest.printifyError = printifyError.message;
                }
                
                paymentRequests.set(paymentId, paymentRequest);

                res.json({
                    paymentId,
                    status: 'completed',
                    signature,
                    message: 'Payment verified successfully',
                    printifyOrderId: paymentRequest.printifyOrderId || null
                });
            } else {
                res.status(400).json({
                    error: 'Transaction failed',
                    message: 'Transaction was not successful'
                });
            }
        } catch (verifyError) {
            console.error('Error verifying transaction:', verifyError);
            res.status(400).json({
                error: 'Verification failed',
                message: 'Could not verify transaction on blockchain'
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            error: 'Payment verification failed',
            message: error.message
        });
    }
});

/**
 * Get all payment requests (for admin/debugging)
 * GET /api/payment/all
 */
router.get('/all', (req, res) => {
    const payments = Array.from(paymentRequests.values()).map(payment => ({
        id: payment.id,
        total: payment.total,
        currency: payment.currency,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt
    }));

    res.json({
        payments,
        count: payments.length
    });
});

/**
 * Cancel a payment request
 * POST /api/payment/cancel/:paymentId
 */
router.post('/cancel/:paymentId', (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRequest = paymentRequests.get(paymentId);

        if (!paymentRequest) {
            return res.status(404).json({
                error: 'Payment not found',
                message: 'Invalid payment ID'
            });
        }

        if (paymentRequest.status === 'completed') {
            return res.status(400).json({
                error: 'Cannot cancel',
                message: 'Payment has already been completed'
            });
        }

        paymentRequest.status = 'cancelled';
        paymentRequest.cancelledAt = new Date().toISOString();
        paymentRequests.set(paymentId, paymentRequest);

        res.json({
            paymentId,
            status: 'cancelled',
            message: 'Payment cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling payment:', error);
        res.status(500).json({
            error: 'Payment cancellation failed',
            message: error.message
        });
    }
});

module.exports = router;
