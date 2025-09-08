/**
 * Crypto Payment Service for Printify Integration
 * 
 * This service provides Solana Pay integration for your existing Printify dropshipping platform.
 * It handles real-time SOL pricing, payment processing, and order fulfillment.
 */

// cspell:ignore Keypair lamports
const { Connection, PublicKey, clusterApiUrl, Keypair } = require('@solana/web3.js');
const { encodeURL, createQR, findReference, validateTransfer } = require('@solana/pay');
const BigNumber = require('bignumber.js');
const { Payment, Order } = require('../database/models');
const PrintifyService = require('./printifyService');

class CryptoPaymentService {
    constructor() {
        this.solanaNetwork = process.env.SOLANA_NETWORK || 'devnet';
        this.merchantWallet = new PublicKey(process.env.MERCHANT_WALLET_PUBLIC_KEY || '11111111111111111111111111111112');
        this.connection = new Connection(clusterApiUrl(this.solanaNetwork), 'confirmed');
        this.printifyService = new PrintifyService();
        
        // Payment expiry time (30 minutes)
        this.paymentExpiryMs = 30 * 60 * 1000;
        
        console.log(`✅ Crypto Payment Service initialized`);
        console.log(`🔗 Solana Network: ${this.solanaNetwork}`);
        console.log(`💰 Merchant Wallet: ${this.merchantWallet.toString()}`);
    }

    /**
     * Get current SOL price from CoinGecko API
     */
    async getSolPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await response.json();
            const price = data.solana.usd;
            
            console.log(`💰 Current SOL price: $${price}`);
            return price;
        } catch (error) {
            console.error('❌ Error fetching SOL price:', error);
            return 100; // Fallback price
        }
    }

    /**
     * Get products with SOL pricing
     */
    async getProductsWithCryptoPricing() {
        try {
            const solPrice = await this.getSolPrice();
            
            // Get products from your existing database
            const { Product } = require('../database/models');
            const products = await Product.findAll({
                where: { 
                    is_published: true,
                    is_available: true 
                }
            });

            // Transform products to include crypto pricing
            const productsWithCrypto = products.map(product => {
                const priceUsd = parseFloat(product.selling_price || 0);
                const priceSol = (priceUsd / solPrice).toFixed(6);

                // Safe JSON parsing with fallbacks
                let images = [];
                let tags = [];
                let variants = [];

                try {
                    images = product.images ? JSON.parse(product.images) : [];
                } catch (e) {
                    images = [];
                }

                try {
                    tags = product.tags ? JSON.parse(product.tags) : [];
                } catch (e) {
                    tags = [];
                }

                try {
                    variants = product.variants ? JSON.parse(product.variants) : [];
                } catch (e) {
                    variants = [];
                }

                return {
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    category: product.category,
                    images: images,
                    tags: tags,
                    variants: variants,
                    printify_product_id: product.printify_product_id,
                    printify_blueprint_id: product.printify_blueprint_id,
                    inventory_count: product.inventory_count,
                    pricing: {
                        usd: priceUsd,
                        sol: parseFloat(priceSol),
                        sol_display: priceSol
                    },
                    is_available: product.is_available,
                    is_published: product.is_published
                };
            });

            return {
                products: productsWithCrypto,
                sol_price_usd: solPrice,
                total_count: productsWithCrypto.length
            };

        } catch (error) {
            console.error('❌ Error getting products with crypto pricing:', error);
            throw error;
        }
    }

    /**
     * Create a new crypto payment
     */
    async createPayment(paymentData) {
        try {
            const { 
                productId, 
                variant, 
                quantity = 1, 
                customerEmail,
                shippingAddress,
                customAmount = null 
            } = paymentData;

            // Validate required fields
            if (!productId || !customerEmail || !shippingAddress) {
                throw new Error('Missing required fields: productId, customerEmail, and shippingAddress are required');
            }

            // Generate unique payment reference
            const reference = Keypair.generate().publicKey;
            const solPrice = await this.getSolPrice();

            // Get product details
            const { Product } = require('../database/models');
            const product = await Product.findByPk(productId);
            
            if (!product) {
                throw new Error('Product not found');
            }

            // Calculate pricing
            const priceUsd = customAmount || (parseFloat(product.selling_price) * quantity);
            const priceSol = priceUsd / solPrice;
            const amount = new BigNumber(priceSol);

            // Create payment record in database using existing Payment model
            const payment = await Payment.create({
                payment_reference: reference.toString(),
                sender_wallet: null, // Will be filled when payment is received
                recipient_wallet: this.merchantWallet.toString(),
                amount: priceSol, // SOL amount
                currency: 'SOL',
                usd_amount: priceUsd, // Use existing usd_amount field
                status: 'pending',
                network: this.solanaNetwork,
                transaction_signature: null,
                customer_email: customerEmail, // Use existing customer_email field
                product_data: JSON.stringify({
                    productId,
                    productTitle: product.title,
                    variant,
                    quantity,
                    shippingAddress
                }),
                expires_at: new Date(Date.now() + this.paymentExpiryMs),
                amount_sol: priceSol, // Use existing amount_sol field
                amount_lamports: amount.multipliedBy(1e9).toString() // Use existing amount_lamports field
            });

            // Create Solana Pay URL
            const paymentUrl = encodeURL({
                recipient: this.merchantWallet,
                amount,
                reference,
                label: `${product.title}`,
                message: `Purchase ${product.title} with crypto`,
                memo: `order-${payment.id}`,
            });

            // Generate QR code
            const qrCode = createQR(paymentUrl);

            console.log(`✅ Payment created: ${reference.toString()}`);
            console.log(`💰 Amount: ${priceSol} SOL ($${priceUsd})`);

            return {
                payment_id: payment.id,
                reference: reference.toString(),
                payment_url: paymentUrl.toString(),
                qr_code: await this.qrCodeToDataURL(qrCode),
                amount: {
                    usd: priceUsd,
                    sol: priceSol,
                    lamports: amount.multipliedBy(1e9).toString()
                },
                product: {
                    id: product.id,
                    title: product.title,
                    quantity
                },
                expires_at: payment.expires_at,
                network: this.solanaNetwork
            };

        } catch (error) {
            console.error('❌ Error creating crypto payment:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(reference) {
        try {
            // Get payment from database
            const payment = await Payment.findOne({
                where: { payment_reference: reference }
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Check if expired
            if (new Date() > new Date(payment.expires_at)) {
                await payment.update({ status: 'expired' });
                return {
                    status: 'expired',
                    message: 'Payment has expired'
                };
            }

            // If already confirmed, return existing data
            if (payment.status === 'confirmed') {
                return {
                    status: 'confirmed',
                    transaction_signature: payment.transaction_signature,
                    confirmed_at: payment.confirmed_at,
                    order_id: payment.order_id
                };
            }

            try {
                // Search for transaction on Solana
                const referencePublicKey = new PublicKey(reference);
                const signatureInfo = await findReference(this.connection, referencePublicKey, {
                    finality: 'confirmed'
                });

                // Validate transaction amount and recipient
                const expectedAmount = new BigNumber(payment.amount_sol);
                await validateTransfer(this.connection, signatureInfo.signature, {
                    recipient: this.merchantWallet,
                    amount: expectedAmount,
                    reference: referencePublicKey
                });

                // Update payment status using existing fields
                await payment.update({
                    status: 'confirmed',
                    transaction_signature: signatureInfo.signature,
                    confirmed_at: new Date(),
                    sender_wallet: signatureInfo.signature // We'll extract this from the transaction later
                });

                // Create Printify order
                const order = await this.createPrintifyOrder(payment);

                console.log(`✅ Payment confirmed: ${reference}`);
                console.log(`📦 Order created: ${order.id}`);

                return {
                    status: 'confirmed',
                    transaction_signature: signatureInfo.signature,
                    confirmed_at: payment.confirmed_at,
                    order_id: order.id,
                    printify_order_id: order.printify_order_id
                };

            } catch (findError) {
                // Transaction not found or not confirmed yet
                return {
                    status: 'pending',
                    message: 'Waiting for blockchain confirmation',
                    expires_at: payment.expires_at
                };
            }

        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            throw error;
        }
    }

    /**
     * Create Printify order after payment confirmation
     */
    async createPrintifyOrder(payment) {
        try {
            const productData = JSON.parse(payment.product_data);
            const { productId, variant, quantity, shippingAddress } = productData;

            // Get product details
            const { Product } = require('../database/models');
            const product = await Product.findByPk(productId);

            if (!product || !product.printify_product_id) {
                throw new Error('Product not found or not linked to Printify');
            }

            // Prepare Printify order data
            const orderData = {
                external_id: `crypto-${payment.payment_reference.substring(0, 10)}`,
                label: `Crypto Order - ${payment.transaction_signature.substring(0, 8)}`,
                line_items: [
                    {
                        product_id: product.printify_product_id.toString(),
                        variant_id: variant?.id || null,
                        quantity: quantity || 1
                    }
                ],
                shipping_address: {
                    first_name: shippingAddress.firstName,
                    last_name: shippingAddress.lastName,
                    email: payment.customer_email,
                    phone: shippingAddress.phone || '',
                    country: shippingAddress.country,
                    region: shippingAddress.state || shippingAddress.region || '',
                    address1: shippingAddress.address1,
                    address2: shippingAddress.address2 || '',
                    city: shippingAddress.city,
                    zip: shippingAddress.zip || shippingAddress.zipCode
                }
            };

            // Create order in Printify
            const printifyOrder = await this.printifyService.createOrder(orderData);

            // Create order record in database using existing Order model
            const order = await Order.create({
                order_number: `CR-${Date.now()}`,
                customer_email: payment.customer_email,
                payment_id: payment.id,
                total_amount: payment.usd_amount || payment.amount_usd,
                currency: 'USD',
                crypto_amount: payment.amount_sol,
                status: 'processing',
                printify_order_id: printifyOrder.id,
                shipping_address: JSON.stringify(shippingAddress),
                notes: JSON.stringify([{
                    product_id: productId,
                    printify_product_id: product.printify_product_id,
                    quantity: quantity,
                    price: product.selling_price,
                    title: product.title
                }])
            });

            // Update payment with order ID
            await payment.update({ order_id: order.id });

            console.log(`📦 Order created successfully: ${order.id}`);
            return order;

        } catch (error) {
            console.error('❌ Error creating Printify order:', error);
            throw error;
        }
    }

    /**
     * Get payment status by reference
     */
    async getPaymentStatus(reference) {
        try {
            const payment = await Payment.findOne({
                where: { payment_reference: reference }
            });

            if (!payment) {
                return { status: 'not_found' };
            }

            return {
                status: payment.status,
                amount_usd: payment.usd_amount || payment.amount_usd,
                amount_sol: payment.amount_sol,
                transaction_signature: payment.transaction_signature,
                confirmed_at: payment.confirmed_at,
                expires_at: payment.expires_at,
                order: payment.order_id ? {
                    id: payment.order_id,
                    // We'll need to fetch order details separately if needed
                } : null
            };

        } catch (error) {
            console.error('❌ Error getting payment status:', error);
            throw error;
        }
    }

    /**
     * Convert QR code to data URL
     */
    async qrCodeToDataURL(qrCode) {
        try {
            // For now, return placeholder - in production, you'd convert canvas to data URL
            return qrCode.toString();
        } catch (error) {
            console.error('Error converting QR code:', error);
            return null;
        }
    }

    /**
     * Get payment statistics
     */
    async getPaymentStats() {
        try {
            const { Payment } = require('../database/models');
            const { Op } = require('sequelize');
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats = await Payment.findAll({
                attributes: [
                    'status',
                    [Payment.sequelize.fn('COUNT', Payment.sequelize.col('id')), 'count'],
                    [Payment.sequelize.fn('SUM', Payment.sequelize.col('usd_amount')), 'total_usd'],
                    [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount_sol')), 'total_sol']
                ],
                where: {
                    created_at: {
                        [Op.gte]: today
                    }
                },
                group: ['status'],
                raw: true
            });

            return stats;

        } catch (error) {
            console.error('❌ Error getting payment stats:', error);
            throw error;
        }
    }
}

module.exports = CryptoPaymentService;
