const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const SolanaPayService = require('../services/solanaPayService');

// Initialize Solana Pay service
const solanaPayService = new SolanaPayService();

// Crypto payment routes for Solana Pay integration
// Note: Variable names may reference various integration sources

// Generate payment request
router.post('/payment/create', async (req, res) => {
    try {
        const { amount, currency = 'SOL', productId, memo } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }
        
        // Generate unique payment ID and reference
        const paymentId = crypto.randomBytes(16).toString('hex');
        const reference = crypto.randomBytes(32).toString('hex');
        
        // Convert USD to SOL if needed
        let paymentAmount = amount;
        let conversionRate = null;
        
        if (currency === 'SOL') {
            const conversion = await solanaPayService.convertUSDToSOL(amount);
            if (conversion.success) {
                paymentAmount = conversion.solAmount;
                conversionRate = conversion.rate;
            }
        }
        
        // Generate Solana Pay URL
        const paymentURL = solanaPayService.generatePaymentURL(
            paymentAmount,
            currency,
            memo || `Payment for product ${productId}`,
            reference
        );
        
        if (!paymentURL.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate payment URL'
            });
        }
        
        // Create enhanced payment request
        const paymentRequest = {
            id: paymentId,
            reference,
            amount: paymentAmount,
            originalAmount: amount,
            currency,
            conversionRate,
            productId,
            memo: memo || `Payment for product ${productId}`,
            status: 'pending',
            created: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (30 * 60 * 1000)).toISOString(), // 30 minutes
            paymentUrl: paymentURL.url,
            qrCode: paymentURL.qrCode,
            merchantWallet: solanaPayService.merchantWallet
        };
        
        console.log('💰 Enhanced crypto payment request created:', paymentRequest);
        
        res.json({
            success: true,
            data: paymentRequest
        });
        
    } catch (error) {
        console.error('❌ Crypto payment creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment request'
        });
    }
});

// Check payment status
router.get('/payment/:paymentId/status', async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        // In production, check actual payment status on blockchain
        const paymentStatus = {
            id: paymentId,
            status: 'pending', // pending, confirmed, failed
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: paymentStatus
        });
        
    } catch (error) {
        console.error('❌ Payment status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check payment status'
        });
    }
});

// Confirm payment (webhook endpoint for actual implementation)
router.post('/payment/:paymentId/confirm', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { signature, amount } = req.body;
        
        console.log('✅ Payment confirmation received:', {
            paymentId,
            signature,
            amount
        });
        
        // In production, verify transaction on Solana blockchain
        res.json({
            success: true,
            data: {
                id: paymentId,
                status: 'confirmed',
                signature,
                confirmed: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm payment'
        });
    }
});

// Get supported currencies
router.get('/currencies', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                symbol: 'SOL',
                name: 'Solana',
                decimals: 9,
                supported: true,
                native: true
            },
            {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                supported: true,
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            },
            {
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                supported: true,
                mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
            }
        ]
    });
});

// Get SOL price
router.get('/price/sol', async (req, res) => {
    try {
        const priceData = await solanaPayService.getSOLPrice();
        res.json(priceData);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get SOL price'
        });
    }
});

// Convert USD to SOL
router.post('/convert/usd-to-sol', async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid USD amount is required'
            });
        }
        
        const conversion = await solanaPayService.convertUSDToSOL(amount);
        res.json(conversion);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to convert USD to SOL'
        });
    }
});

// Verify transaction
router.post('/transaction/verify', async (req, res) => {
    try {
        const { signature, expectedAmount, currency = 'SOL' } = req.body;
        
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Transaction signature is required'
            });
        }
        
        const verification = await solanaPayService.verifyTransaction(
            signature,
            expectedAmount,
            solanaPayService.merchantWallet,
            currency
        );
        
        res.json(verification);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify transaction'
        });
    }
});

// Monitor payment status
router.get('/payment/:reference/monitor', async (req, res) => {
    try {
        const { reference } = req.params;
        const { amount, currency = 'SOL' } = req.query;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                error: 'Payment reference is required'
            });
        }
        
        // Start monitoring (in production, this would use WebSockets)
        const monitoringResult = await solanaPayService.monitorPayment(
            reference,
            parseFloat(amount),
            currency,
            60000 // 1 minute timeout for demo
        );
        
        res.json(monitoringResult);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to monitor payment'
        });
    }
});

// Get wallet balance
router.get('/wallet/:address/balance', async (req, res) => {
    try {
        const { address } = req.params;
        const { currency = 'SOL' } = req.query;
        
        const balance = await solanaPayService.getBalance(address, currency);
        res.json(balance);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get wallet balance'
        });
    }
});

// Crypto Payment Integration Endpoints

// Create payment for orders
router.post('/create-payment', async (req, res) => {
    try {
        const { amount, token = 'SOL', source = 'shop', products } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }
        
        // Generate unique order ID
        const orderId = crypto.randomBytes(16).toString('hex');
        const reference = crypto.randomBytes(32).toString('hex');
        
        // Convert USD to selected token if needed
        let paymentAmount = amount;
        let conversionRate = null;
        
        if (token === 'SOL') {
            const conversion = await solanaPayService.convertUSDToSOL(amount);
            if (conversion.success) {
                paymentAmount = conversion.solAmount;
                conversionRate = conversion.rate;
            }
        }
        
        // Store order in memory (you might want to use database)
        global.fitprintOrders = global.fitprintOrders || new Map();
        global.fitprintOrders.set(orderId, {
            id: orderId,
            amount: amount,
            paymentAmount: paymentAmount,
            token: token,
            source: source,
            products: products,
            reference: reference,
            status: 'pending',
            createdAt: new Date(),
            conversionRate: conversionRate
        });
        
        res.json({
            success: true,
            id: orderId,
            amount: amount,
            paymentAmount: paymentAmount,
            token: token,
            reference: reference,
            conversionRate: conversionRate
        });
        
    } catch (error) {
        console.error('❌ Create payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment'
        });
    }
});

// Generate QR code for payment
router.post('/generate-qr', async (req, res) => {
    try {
        const { orderId, amount, token = 'SOL' } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }
        
        // Get order details
        const orders = global.fitprintOrders || new Map();
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Generate Solana Pay URL
        const paymentURL = solanaPayService.generatePaymentURL(
            order.paymentAmount,
            order.token,
            `FitPrint Order #${orderId}`,
            order.reference
        );
        
        if (!paymentURL.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate payment URL'
            });
        }
        
        // Generate QR code
        const QRCode = require('qrcode');
        const qrCodeDataURL = await QRCode.toDataURL(paymentURL.url, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        res.json({
            success: true,
            qrCodeUrl: qrCodeDataURL,
            paymentUrl: paymentURL.url,
            orderId: orderId,
            amount: order.paymentAmount,
            token: order.token
        });
        
    } catch (error) {
        console.error('❌ Generate QR error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code'
        });
    }
});

// Check payment status
router.get('/payment-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Get order details
        const orders = global.fitprintOrders || new Map();
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Check if payment has been confirmed
        // This would typically involve checking the blockchain
        const paymentStatus = await solanaPayService.verifyTransaction(order.reference);
        
        if (paymentStatus.success && paymentStatus.verified) {
            // Update order status
            order.status = 'paid';
            order.paidAt = new Date();
            order.transactionSignature = paymentStatus.signature;
            orders.set(orderId, order);
            
            res.json({
                success: true,
                paid: true,
                orderId: orderId,
                transactionSignature: paymentStatus.signature,
                order: order
            });
        } else {
            res.json({
                success: true,
                paid: false,
                orderId: orderId,
                status: order.status
            });
        }
        
    } catch (error) {
        console.error('❌ Payment status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check payment status'
        });
    }
});

module.exports = router;
