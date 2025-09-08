# 🔧 Platform-Specific Integration Guide

## Step 4: Integration Instructions by Platform

This guide provides detailed instructions for integrating the crypto payment system into various platforms and frameworks.

## 🛠️ Platform-Specific Integration

### 🟢 Express.js/Node.js Backend

#### Prerequisites
- Node.js 16+ installed
- Your Printify API token
- Your Solana wallet address

#### 1. Environment Configuration

Add these environment variables to your `.env` file:

```env
# Printify API Configuration
PRINTIFY_API_TOKEN=your_printify_api_token_here

# Solana Payment Configuration
SOLANA_NETWORK=devnet  # Use 'mainnet-beta' for production
MERCHANT_WALLET_PUBLIC_KEY=your_solana_wallet_address_here
SOLANA_RPC_URL=https://api.devnet.solana.com

# Payment Settings
PAYMENT_EXPIRY_MINUTES=30
SOLANA_PAY_LABEL=Your Store Name
SOLANA_PAY_MESSAGE=Purchase products with SOL
```

#### 2. Install Dependencies

```bash
npm install @solana/web3.js @solana/pay bignumber.js axios express-rate-limit
```

#### 3. Add to your existing server.js:

```javascript
// Add to your imports
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import crypto payment routes
const cryptoPaymentRoutes = require('./routes/crypto-payments');
const { initializeCryptoPayments } = require('./services/cryptoPaymentService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize crypto payment service
initializeCryptoPayments();

// Add crypto payment routes
app.use('/api/crypto', cryptoPaymentRoutes);

// Your existing routes...
app.listen(3000, () => {
    console.log('🚀 Server running on port 3000');
    console.log('💰 Crypto payments enabled');
});
```

#### 4. Create crypto-payments route file:

**Create `routes/crypto-payments.js`:**

```javascript
const express = require('express');
const router = express.Router();
const CryptoPaymentService = require('../services/cryptoPaymentService');
const rateLimit = require('express-rate-limit');

// Rate limiting
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 payment requests per windowMs
    message: 'Too many payment requests, please try again later.'
});

// Initialize service
const cryptoService = new CryptoPaymentService();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: ['solana-pay', 'printify-api'],
        network: process.env.SOLANA_NETWORK,
        wallet: process.env.MERCHANT_WALLET_PUBLIC_KEY
    });
});

// Get SOL price
router.get('/sol-price', async (req, res) => {
    try {
        const price = await cryptoService.getCurrentSOLPrice();
        res.json({ price });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch SOL price' });
    }
});

// Get products with crypto pricing
router.get('/products', async (req, res) => {
    try {
        const products = await cryptoService.getProductsWithCryptoPricing();
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create crypto payment
router.post('/payments', paymentLimiter, async (req, res) => {
    try {
        const { productId, quantity = 1, customerInfo } = req.body;
        const payment = await cryptoService.createPayment(productId, quantity, customerInfo);
        res.json(payment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Verify payment
router.get('/payments/:reference/verify', async (req, res) => {
    try {
        const { reference } = req.params;
        const result = await cryptoService.verifyPayment(reference);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
```

---

### 🔵 React.js Frontend Integration

#### 1. Install Dependencies

```bash
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-base
```

#### 2. Create Crypto Payment Component:

**Create `components/CryptoPayment.jsx`:**

```jsx
import React, { useState, useEffect } from 'react';

const CryptoPayment = ({ product }) => {
    const [solPrice, setSolPrice] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSOLPrice();
    }, []);

    const fetchSOLPrice = async () => {
        try {
            const response = await fetch('/api/crypto/sol-price');
            const data = await response.json();
            setSolPrice(data.price);
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
        }
    };

    const createPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/crypto/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1,
                    customerInfo: {
                        email: 'customer@example.com' // Get from form
                    }
                })
            });
            const data = await response.json();
            setPayment(data);
        } catch (error) {
            console.error('Payment creation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const cryptoPrice = solPrice ? (product.selling_price / solPrice).toFixed(6) : '...';

    return (
        <div className="crypto-payment">
            <div className="product-info">
                <h3>{product.title}</h3>
                <p>${product.selling_price} USD</p>
                <p>≈ {cryptoPrice} SOL</p>
            </div>
            
            <button 
                onClick={createPayment} 
                disabled={loading}
                className="crypto-pay-btn"
            >
                {loading ? 'Creating Payment...' : 'Pay with SOL'}
            </button>

            {payment && (
                <div className="payment-modal">
                    <h4>Scan QR Code to Pay</h4>
                    <img src={payment.qr_code} alt="Payment QR Code" />
                    <p>Amount: {payment.amount_sol} SOL</p>
                    <p>Reference: {payment.reference}</p>
                </div>
            )}
        </div>
    );
};

export default CryptoPayment;
```

---

### 🟠 WordPress/WooCommerce Integration

#### 1. Create Plugin Structure

Create folder: `wp-content/plugins/crypto-payments/`

**Create `crypto-payments.php`:**

```php
<?php
/**
 * Plugin Name: Crypto Payments for WooCommerce
 * Description: Accept Solana payments with Printify integration
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

class CryptoPaymentsPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('woocommerce_single_product_summary', array($this, 'add_crypto_button'), 25);
    }

    public function init() {
        // Add REST API endpoints
        add_action('rest_api_init', array($this, 'register_api_routes'));
    }

    public function enqueue_scripts() {
        if (is_product()) {
            wp_enqueue_script('crypto-widget', plugin_dir_url(__FILE__) . 'crypto-widget.js', array('jquery'), '1.0.0', true);
            
            wp_localize_script('crypto-widget', 'cryptoConfig', array(
                'apiUrl' => home_url('/wp-json/crypto/v1/'),
                'merchantWallet' => get_option('crypto_merchant_wallet', ''),
                'printifyApiKey' => get_option('crypto_printify_api_key', '')
            ));
        }
    }

    public function add_crypto_button() {
        global $product;
        ?>
        <div class="crypto-payment-section">
            <button id="crypto-pay-btn" class="button alt" data-product-id="<?php echo $product->get_id(); ?>">
                Pay with SOL
            </button>
            <div id="crypto-payment-modal" style="display:none;"></div>
        </div>
        <?php
    }

    public function register_api_routes() {
        register_rest_route('crypto/v1', '/payments', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_payment'),
            'permission_callback' => '__return_true'
        ));
    }

    public function create_payment($request) {
        $product_id = $request->get_param('product_id');
        $product = wc_get_product($product_id);
        
        if (!$product) {
            return new WP_Error('invalid_product', 'Product not found', array('status' => 404));
        }

        // Call your crypto payment API
        $api_url = 'http://localhost:3000/api/crypto/payments';
        $response = wp_remote_post($api_url, array(
            'body' => json_encode(array(
                'productId' => $product_id,
                'quantity' => 1,
                'customerInfo' => array(
                    'email' => wp_get_current_user()->user_email
                )
            )),
            'headers' => array('Content-Type' => 'application/json')
        ));

        if (is_wp_error($response)) {
            return new WP_Error('api_error', 'Payment creation failed', array('status' => 500));
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }
}

new CryptoPaymentsPlugin();

// Admin settings
add_action('admin_menu', function() {
    add_options_page('Crypto Payments', 'Crypto Payments', 'manage_options', 'crypto-payments', 'crypto_payments_admin_page');
});

function crypto_payments_admin_page() {
    if (isset($_POST['submit'])) {
        update_option('crypto_merchant_wallet', sanitize_text_field($_POST['merchant_wallet']));
        update_option('crypto_printify_api_key', sanitize_text_field($_POST['printify_api_key']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $merchant_wallet = get_option('crypto_merchant_wallet', '');
    $printify_api_key = get_option('crypto_printify_api_key', '');
    ?>
    <div class="wrap">
        <h1>Crypto Payments Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th scope="row">Merchant Wallet Address</th>
                    <td>
                        <input type="text" name="merchant_wallet" value="<?php echo esc_attr($merchant_wallet); ?>" class="regular-text" />
                        <p class="description">Your Solana wallet address for receiving payments</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Printify API Key</th>
                    <td>
                        <input type="text" name="printify_api_key" value="<?php echo esc_attr($printify_api_key); ?>" class="regular-text" />
                        <p class="description">Your Printify API token</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
?>
```

---

### 🟣 Shopify App Integration

#### 1. Create Shopify App Structure

**Create `shopify-crypto-app/app.js`:**

```javascript
const express = require('express');
const { Shopify } = require('@shopify/shopify-api');
const CryptoPaymentService = require('./crypto-payment-service');

const app = express();

// Shopify configuration
Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: ['read_products', 'write_orders'],
    HOST_NAME: process.env.HOST,
    IS_EMBEDDED_APP: true,
});

// Initialize crypto service
const cryptoService = new CryptoPaymentService({
    merchantWallet: process.env.MERCHANT_WALLET_PUBLIC_KEY,
    printifyApiKey: process.env.PRINTIFY_API_TOKEN,
    solanaNetwork: process.env.SOLANA_NETWORK || 'devnet'
});

// Webhook for crypto payments
app.post('/webhooks/crypto/payment-confirmed', async (req, res) => {
    try {
        const { reference, transaction, order_data } = req.body;
        
        // Create Shopify order
        const session = await Shopify.Utils.loadCurrentSession(req, res);
        const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
        
        const order = await client.post({
            path: 'orders',
            data: {
                order: {
                    email: order_data.customer_email,
                    financial_status: 'paid',
                    line_items: [{
                        title: order_data.product_title,
                        price: order_data.amount,
                        quantity: order_data.quantity
                    }],
                    note: `Crypto payment - TX: ${transaction}`,
                    tags: 'crypto-payment, solana'
                }
            }
        });
        
        res.json({ success: true, shopify_order_id: order.body.order.id });
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ error: 'Order creation failed' });
    }
});

app.listen(8080, () => {
    console.log('🛍️ Shopify Crypto App running on port 8080');
});
```

---

### 🔴 Next.js Integration

#### 1. API Routes

**Create `pages/api/crypto/payments.js`:**

```javascript
import CryptoPaymentService from '../../../lib/crypto-payment-service';

const cryptoService = new CryptoPaymentService();

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { productId, quantity, customerInfo } = req.body;
            const payment = await cryptoService.createPayment(productId, quantity, customerInfo);
            res.status(200).json(payment);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
```

#### 2. React Component

**Create `components/CryptoCheckout.js`:**

```jsx
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function CryptoCheckout({ product }) {
    const { publicKey, connected } = useWallet();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(false);

    const createPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/crypto/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1,
                    customerInfo: {
                        wallet: publicKey?.toString(),
                        email: 'customer@example.com'
                    }
                })
            });
            
            const data = await response.json();
            setPayment(data);
        } catch (error) {
            console.error('Payment creation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="crypto-checkout">
            <button 
                onClick={createPayment}
                disabled={!connected || loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
                {loading ? 'Creating Payment...' : 'Pay with SOL'}
            </button>
            
            {payment && (
                <div className="mt-4 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold">Payment Created</h3>
                    <img src={payment.qr_code} alt="Payment QR" className="mt-2" />
                    <p>Amount: {payment.amount_sol} SOL</p>
                </div>
            )}
        </div>
    );
}
```

---

## 🔧 Configuration Summary

### Required Environment Variables for All Platforms:

```env
# Printify Integration
PRINTIFY_API_TOKEN=your_printify_api_token_here

# Solana Configuration  
MERCHANT_WALLET_PUBLIC_KEY=your_solana_wallet_address_here
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Payment Settings
PAYMENT_EXPIRY_MINUTES=30
SOLANA_PAY_LABEL=Your Store Name
SOLANA_PAY_MESSAGE=Purchase with SOL
```

### 🔑 How to Get Your Keys:

#### Printify API Token:
1. Log into your Printify account
2. Go to Settings → API
3. Generate a new API token
4. Copy the token to your `.env` file

#### Solana Wallet Address:
1. Install Phantom, Solflare, or another Solana wallet
2. Create or import your wallet
3. Copy your public key (wallet address)
4. Add to `.env` as `MERCHANT_WALLET_PUBLIC_KEY`

#### Production Checklist:
- [ ] Change `SOLANA_NETWORK` to `mainnet-beta`
- [ ] Update RPC URL to mainnet
- [ ] Use production Printify API credentials
- [ ] Set up proper SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test all payment flows thoroughly

---

**🎉 You're now ready to accept crypto payments across any platform!**

Need help with a specific platform integration? Check the individual documentation files or reach out for support.
