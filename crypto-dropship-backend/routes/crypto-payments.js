/**
 * Crypto Payment Routes - Enhanced API endpoints for Solana Pay integration
 * 
 * These routes handle the complete crypto payment flow:
 * - Product pricing in SOL
 * - Payment creation and QR generation
 * - Payment verification and blockchain monitoring
 * - Automatic Printify order creation
 */

const express = require('express');
const router = express.Router();
const CryptoPaymentService = require('../services/cryptoPaymentService');

// Initialize crypto payment service
const cryptoService = new CryptoPaymentService();

/**
 * GET /api/crypto/products
 * Get all products with current SOL pricing
 */
router.get('/products', async (req, res) => {
    try {
        const result = await cryptoService.getProductsWithCryptoPricing();
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching crypto products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products with crypto pricing',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/sol-price
 * Get current SOL price in USD
 */
router.get('/sol-price', async (req, res) => {
    try {
        const solPrice = await cryptoService.getSolPrice();
        
        res.json({
            success: true,
            data: {
                sol_price_usd: solPrice,
                updated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching SOL price:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch SOL price',
            message: error.message
        });
    }
});

/**
 * POST /api/crypto/create-payment
 * Create a new crypto payment with QR code
 * 
 * Body: {
 *   productId: number,
 *   variant: object (optional),
 *   quantity: number (default: 1),
 *   customerEmail: string,
 *   shippingAddress: {
 *     firstName: string,
 *     lastName: string,
 *     address1: string,
 *     address2?: string,
 *     city: string,
 *     state: string,
 *     zipCode: string,
 *     country: string,
 *     phone?: string
 *   },
 *   customAmount?: number (for custom pricing)
 * }
 */
router.post('/create-payment', async (req, res) => {
    try {
        const paymentData = req.body;
        
        // Validate required fields
        const { productId, customerEmail, shippingAddress } = paymentData;
        
        if (!productId || !customerEmail || !shippingAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['productId', 'customerEmail', 'shippingAddress']
            });
        }

        // Validate shipping address
        const requiredAddressFields = ['firstName', 'lastName', 'address1', 'city', 'country'];
        const missingFields = requiredAddressFields.filter(field => !shippingAddress[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required shipping address fields',
                missing_fields: missingFields
            });
        }

        // Create payment
        const paymentResult = await cryptoService.createPayment(paymentData);
        
        res.json({
            success: true,
            data: paymentResult,
            message: 'Payment created successfully. Scan QR code to pay with SOL.'
        });

    } catch (error) {
        console.error('❌ Error creating crypto payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create crypto payment',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/verify-payment/:reference
 * Verify payment status and process if confirmed
 */
router.get('/verify-payment/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                error: 'Payment reference is required'
            });
        }

        const verificationResult = await cryptoService.verifyPayment(reference);
        
        res.json({
            success: true,
            data: verificationResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify payment',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/payment-status/:reference
 * Get detailed payment status without verification
 */
router.get('/payment-status/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        
        const status = await cryptoService.getPaymentStatus(reference);
        
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment status',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/stats
 * Get payment statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await cryptoService.getPaymentStats();
        
        res.json({
            success: true,
            data: {
                daily_stats: stats,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error getting payment stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment statistics',
            message: error.message
        });
    }
});

/**
 * POST /api/crypto/test-payment
 * Create a test payment for development
 */
router.post('/test-payment', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: 'Test payments not available in production'
            });
        }

        // Create test payment with minimal data
        const testPaymentData = {
            productId: 1, // Assuming first product exists
            customerEmail: 'test@example.com',
            quantity: 1,
            shippingAddress: {
                firstName: 'Test',
                lastName: 'Customer',
                address1: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'US'
            },
            ...req.body // Override with any provided data
        };

        const paymentResult = await cryptoService.createPayment(testPaymentData);
        
        res.json({
            success: true,
            data: paymentResult,
            message: 'Test payment created successfully',
            note: 'This is a test payment for development purposes'
        });

    } catch (error) {
        console.error('❌ Error creating test payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create test payment',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/health
 * Health check for crypto payment service
 */
router.get('/health', async (req, res) => {
    try {
        const solPrice = await cryptoService.getSolPrice();
        
        res.json({
            success: true,
            data: {
                service: 'Crypto Payment Service',
                status: 'healthy',
                solana_network: cryptoService.solanaNetwork,
                merchant_wallet: cryptoService.merchantWallet.toString(),
                sol_price_usd: solPrice,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Crypto service health check failed:', error);
        res.status(503).json({
            success: false,
            error: 'Crypto payment service unhealthy',
            message: error.message
        });
    }
});

module.exports = router;
