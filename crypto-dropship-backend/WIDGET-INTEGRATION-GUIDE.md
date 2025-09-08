# 🚀 Crypto Payment Widget - Complete Integration Guide

<!-- cspell:ignore rgba darkgold woocommerce addslashes gtag Magento Presta -->

## Overview

The Crypto Payment Widget is a powerful, plug-and-play JavaScript module that adds Solana cryptocurrency payment capabilities to any existing website or e-commerce platform. It provides a seamless integration experience while maintaining full compatibility with your existing checkout flow.

## 🌟 Key Features

- **🔌 Plug-and-Play Integration** - Add to any website with minimal code
- **📱 Mobile-Optimized** - Works perfectly on all devices and screen sizes  
- **🎨 Fully Customizable** - Match your brand's look and feel
- **🔒 Secure** - Built-in security best practices and validation
- **⚡ Real-Time** - Live SOL pricing and instant payment verification
- **📊 Analytics Ready** - Built-in event tracking and analytics integration
- **🌐 Cross-Platform** - Works with any web framework or CMS

## 📦 Quick Installation

### 🔧 Backend Setup (Required First)

Before using the widget, ensure your backend is configured with the crypto payment API:

#### 1. Environment Configuration
```env
# Required for crypto payments
PRINTIFY_API_TOKEN=your_printify_api_token_here
MERCHANT_WALLET_PUBLIC_KEY=your_solana_wallet_address_here
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Payment settings
PAYMENT_EXPIRY_MINUTES=30
SOLANA_PAY_LABEL=Your Store Name
SOLANA_PAY_MESSAGE=Purchase with SOL
```

#### 2. Backend Dependencies
```bash
npm install @solana/web3.js @solana/pay bignumber.js axios express-rate-limit
```

#### 3. Add Crypto Routes to Your Server
```javascript
// Add to your existing server.js
const cryptoPaymentRoutes = require('./routes/crypto-payments');
app.use('/api/crypto', cryptoPaymentRoutes);
```

**💡 For complete backend setup, see [Platform Integration Guide](./PLATFORM-INTEGRATION-GUIDE.md)**

---

### 🎨 Frontend Widget Installation

### 1. Include the Widget Script

Add the crypto payment widget to your website:

```html
<!-- Option 1: Direct include -->
<script src="/crypto-payment-widget.js"></script>

<!-- Option 2: From CDN (when available) -->
<script src="https://cdn.yoursite.com/crypto-payment-widget.js"></script>

<!-- Option 3: ES6 Module import -->
<script type="module">
  import CryptoPaymentWidget from './crypto-payment-widget.js';
  window.CryptoPaymentWidget = CryptoPaymentWidget;
</script>
```

### 2. Configure the Widget

Set up your configuration before the widget loads:

```html
<script>
window.cryptoPaymentConfig = {
    apiBaseUrl: '/api/crypto',  // Your backend API endpoint
    autoEnhance: true,          // Automatically add crypto buttons
    productSelector: '.product-card, .product', // CSS selector for products
    
    // Event handlers
    onSuccess: function(result) {
        console.log('Payment successful!', result);
        // Handle successful payment
    },
    onError: function(error) {
        console.error('Payment failed:', error);
        // Handle payment error
    },
    onStatusChange: function(status) {
        console.log('Payment status:', status);
        // Handle status updates
    }
};
</script>
```

### 3. Prepare Your Product Elements

Ensure your product elements have the required data attributes:

```html
<div class="product-card" data-product-id="123" data-price="29.99">
    <h3 class="product-title">Premium T-Shirt</h3>
    <p class="product-description">High-quality cotton t-shirt</p>
    <div class="price">$29.99</div>
    <button class="buy-button">Add to Cart</button>
    <!-- Crypto button will be added automatically here -->
</div>
```

## 🛠️ Integration Methods

### Method 1: Automatic Enhancement (Recommended)

The widget automatically finds and enhances existing product elements:

```javascript
// Widget auto-detects products and adds crypto payment buttons
window.cryptoPaymentConfig = {
    autoEnhance: true,
    productSelector: '.product-card, .product-item, [data-product-id]'
};
```

**Supported Product Structures:**
- **Product ID**: `data-product-id` attribute or `.product-id` element
- **Title**: `.product-title`, `.title`, `h3`, `h4` elements or `data-product-title`
- **Price**: `.price`, `.product-price`, `[data-price]` or `data-price` attribute

### Method 2: Manual Integration

For custom layouts or specific control:

```javascript
// Wait for widget to be ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.cryptoWidget) {
        // Add crypto button to specific product
        const productElement = document.querySelector('#my-product');
        const productData = {
            id: 123,
            title: 'Custom Product',
            price: 49.99,
            quantity: 1
        };
        
        window.cryptoWidget.addCryptoPayButton(productElement, productData);
    }
});
```

### Method 3: Checkout Page Integration

Add crypto payment option to your checkout flow:

```javascript
// Add to checkout page
const checkoutContainer = document.querySelector('#payment-options');
const orderData = {
    total: 89.97,
    productId: 456,  // Or use a special checkout product ID
    title: 'Order #12345',
    quantity: 3
};

window.cryptoWidget.addCryptoCheckoutOption(checkoutContainer, orderData);
```

## 🎨 Customization Options

### Styling Customization

Override default styles to match your brand:

```css
/* Custom button styling */
.crypto-pay-btn {
    background: linear-gradient(45deg, #your-primary, #your-secondary) !important;
    border-radius: 25px !important;
    font-family: 'Your Brand Font', sans-serif !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
}

/* Custom modal styling */
.crypto-payment-modal .crypto-payment-content {
    background: #your-bg-color !important;
    border: 2px solid #your-accent-color !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
}

/* Custom QR container */
.crypto-qr-container {
    border-color: #your-accent-color !important;
    background: linear-gradient(135deg, #your-light, #white) !important;
}

/* Brand-specific product enhancements */
.product-card[data-category="premium"] .crypto-pay-btn {
    background: linear-gradient(45deg, #gold, #darkgold) !important;
}

.product-card[data-featured="true"] .crypto-price-display {
    border: 2px solid #your-featured-color !important;
}
```

### Configuration Options

```javascript
window.cryptoPaymentConfig = {
    // API Configuration
    apiBaseUrl: '/api/crypto',           // Backend API endpoint
    
    // Auto-Enhancement
    autoEnhance: true,                   // Enable automatic product enhancement
    productSelector: '.product-card',    // CSS selector for products
    
    // UI Customization
    buttonText: 'Pay with SOL',          // Custom button text
    showPriceDisplay: true,              // Show real-time SOL pricing
    modalAnimation: 'fadeIn',            // Modal animation type
    
    // Behavior Options
    autoCloseDelay: 3000,               // Auto-close success modal (ms)
    paymentTimeout: 1800000,            // Payment timeout (30 minutes)
    checkInterval: 250,                 // Payment check interval (ms)
    
    // Event Handlers
    onSuccess: function(result) { },     // Payment success callback
    onError: function(error) { },       // Payment error callback
    onStatusChange: function(status) { }, // Status change callback
    onModalOpen: function() { },        // Modal open callback
    onModalClose: function() { },       // Modal close callback
    
    // Advanced Options
    debug: false,                       // Enable debug logging
    testMode: false,                    // Enable test mode
    customStyles: { },                  // Inject custom CSS
    walletConnectOptions: { }           // Wallet connection options
};
```

## 📱 Framework Integration Examples

### React Integration

```jsx
import React, { useEffect } from 'react';

const CryptoPaymentButton = ({ product }) => {
    useEffect(() => {
        // Load widget script dynamically
        const script = document.createElement('script');
        script.src = '/crypto-payment-widget.js';
        script.onload = () => {
            // Configure widget
            window.cryptoPaymentConfig = {
                apiBaseUrl: '/api/crypto',
                onSuccess: (result) => {
                    console.log('Payment successful!', result);
                    // Handle success in React
                }
            };
            
            // Initialize widget
            const widget = window.initCryptoPayments(window.cryptoPaymentConfig);
            
            // Add to product element
            const productElement = document.querySelector(`[data-product-id="${product.id}"]`);
            if (productElement) {
                widget.addCryptoPayButton(productElement, product);
            }
        };
        document.head.appendChild(script);
        
        return () => {
            // Cleanup
            document.head.removeChild(script);
        };
    }, [product]);

    return (
        <div className="product-card" data-product-id={product.id} data-price={product.price}>
            <h3 className="product-title">{product.title}</h3>
            <div className="price">${product.price}</div>
            <button className="buy-button">Add to Cart</button>
            {/* Crypto button will be added here */}
        </div>
    );
};
```

### Vue.js Integration

```vue
<template>
    <div class="product-card" 
         :data-product-id="product.id" 
         :data-price="product.price"
         ref="productElement">
        <h3 class="product-title">{{ product.title }}</h3>
        <div class="price">${{ product.price }}</div>
        <button class="buy-button">Add to Cart</button>
    </div>
</template>

<script>
export default {
    props: ['product'],
    mounted() {
        this.initCryptoPayments();
    },
    methods: {
        async initCryptoPayments() {
            // Load widget script
            await this.loadScript('/crypto-payment-widget.js');
            
            // Configure widget
            window.cryptoPaymentConfig = {
                apiBaseUrl: '/api/crypto',
                autoEnhance: false, // Manual control
                onSuccess: (result) => {
                    this.$emit('payment-success', result);
                }
            };
            
            // Initialize and add to this product
            const widget = window.initCryptoPayments(window.cryptoPaymentConfig);
            widget.addCryptoPayButton(this.$refs.productElement, this.product);
        },
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }
};
</script>
```

### WordPress Integration

```php
<?php
// Add to your theme's functions.php

function add_crypto_payment_widget() {
    // Only on product pages or shop pages
    if (is_product() || is_shop() || is_product_category()) {
        ?>
        <script src="<?php echo get_template_directory_uri(); ?>/js/crypto-payment-widget.js"></script>
        <script>
        window.cryptoPaymentConfig = {
            apiBaseUrl: '<?php echo home_url('/wp-json/crypto/v1'); ?>',
            autoEnhance: true,
            productSelector: '.woocommerce .product, .product-item',
            onSuccess: function(result) {
                console.log('Payment successful!', result);
                // Redirect to thank you page
                window.location.href = '<?php echo wc_get_checkout_url(); ?>?payment=crypto&tx=' + result.transaction;
            }
        };
        </script>
        <?php
    }
}
add_action('wp_footer', 'add_crypto_payment_widget');

// WooCommerce product enhancement
function enhance_woocommerce_products() {
    if (is_product()) {
        global $product;
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.cryptoWidget) {
                const productData = {
                    id: <?php echo $product->get_id(); ?>,
                    title: '<?php echo addslashes($product->get_name()); ?>',
                    price: <?php echo $product->get_price(); ?>,
                    quantity: 1
                };
                
                const productElement = document.querySelector('.single-product .product');
                window.cryptoWidget.addCryptoPayButton(productElement, productData);
            }
        });
        </script>
        <?php
    }
}
add_action('wp_footer', 'enhance_woocommerce_products');
?>
```

### Shopify Integration

```javascript
// Add to your Shopify theme's product template

// Liquid template variables
window.shopifyProductData = {
    id: {{ product.id }},
    title: "{{ product.title | escape }}",
    price: {{ product.price | divided_by: 100.0 }},
    variants: {{ product.variants | json }}
};

// Initialize crypto payments
document.addEventListener('DOMContentLoaded', function() {
    // Load widget
    const script = document.createElement('script');
    script.src = '{{ "crypto-payment-widget.js" | asset_url }}';
    script.onload = function() {
        // Configure for Shopify
        window.cryptoPaymentConfig = {
            apiBaseUrl: 'https://your-backend.herokuapp.com/api/crypto',
            autoEnhance: true,
            productSelector: '.product-form, .product-single',
            
            onSuccess: function(result) {
                // Handle successful crypto payment
                fetch('/cart/add.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: window.shopifyProductData.variants[0].id,
                        quantity: 1,
                        properties: {
                            'Crypto Payment': 'SOL',
                            'Transaction': result.transaction
                        }
                    })
                }).then(() => {
                    window.location.href = '/checkout';
                });
            }
        };
        
        // Initialize
        window.initCryptoPayments(window.cryptoPaymentConfig);
    };
    document.head.appendChild(script);
});
```

## 📊 Analytics & Tracking

### Google Analytics 4

```javascript
window.cryptoPaymentConfig = {
    onSuccess: function(result) {
        // Track purchase event
        gtag('event', 'purchase', {
            transaction_id: result.transaction,
            value: result.amount,
            currency: 'USD',
            payment_type: 'crypto_solana',
            items: [{
                item_id: result.product_id,
                item_name: result.product_title,
                category: 'crypto_purchase',
                quantity: result.quantity,
                price: result.amount
            }]
        });
        
        // Track conversion
        gtag('event', 'conversion', {
            send_to: 'AW-XXXXXXXXX/crypto_purchase'
        });
    },
    
    onError: function(error) {
        // Track payment failures
        gtag('event', 'exception', {
            description: 'crypto_payment_failed: ' + error,
            fatal: false
        });
    },
    
    onStatusChange: function(status) {
        // Track payment funnel
        if (status === 'Creating payment...') {
            gtag('event', 'begin_checkout', {
                currency: 'USD',
                payment_type: 'crypto'
            });
        }
    }
};
```

### Facebook Pixel

```javascript
window.cryptoPaymentConfig = {
    onSuccess: function(result) {
        // Track purchase
        fbq('track', 'Purchase', {
            value: result.amount,
            currency: 'USD',
            content_ids: [result.product_id],
            content_type: 'product',
            payment_method: 'crypto_solana'
        });
    },
    
    onStatusChange: function(status) {
        if (status === 'Creating payment...') {
            fbq('track', 'InitiateCheckout', {
                payment_method: 'crypto'
            });
        }
    }
};
```

### Custom Analytics

```javascript
window.cryptoPaymentConfig = {
    onSuccess: function(result) {
        // Send to your analytics service
        fetch('/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'crypto_payment_success',
                data: {
                    transaction_id: result.transaction,
                    amount: result.amount,
                    product_id: result.product_id,
                    payment_method: 'solana',
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    page_url: window.location.href
                }
            })
        });
    }
};
```

## 🔒 Security Best Practices

### Frontend Security

```javascript
// ✅ Good: Secure configuration
window.cryptoPaymentConfig = {
    apiBaseUrl: 'https://secure-api.yourdomain.com/api/crypto',
    
    onError: function(error) {
        // ✅ Don't expose sensitive error details to users
        console.error('Payment error occurred');
        showUserFriendlyError('Payment could not be processed. Please try again.');
        
        // ✅ Log errors securely for debugging
        if (window.Sentry) {
            Sentry.captureException(new Error('Crypto payment failed'), {
                extra: { error_type: 'payment_error' }
            });
        }
    }
};

// ❌ Bad: Exposing sensitive information
window.cryptoPaymentConfig = {
    apiKey: 'secret-key-12345', // ❌ Never expose API keys
    merchantWallet: 'private-wallet-key', // ❌ Never expose private keys
    
    onError: function(error) {
        alert('Error: ' + JSON.stringify(error)); // ❌ Don't show raw errors
    }
};
```

### Production Checklist

- [ ] **HTTPS Only**: Use HTTPS in production
- [ ] **API Validation**: Validate all payment data on backend
- [ ] **Rate Limiting**: Implement rate limiting on API endpoints
- [ ] **Error Handling**: Use generic error messages for users
- [ ] **CORS Policy**: Configure proper CORS headers
- [ ] **CSP Headers**: Implement Content Security Policy
- [ ] **Input Sanitization**: Sanitize all user inputs
- [ ] **Monitoring**: Set up error monitoring (Sentry, etc.)
- [ ] **Backup**: Have backup payment methods available

## 🧪 Testing & Development

### Test Mode Configuration

```javascript
window.cryptoPaymentConfig = {
    apiBaseUrl: '/api/crypto',
    testMode: true,  // Enable test mode
    debug: true,     // Enable debug logging
    
    // Test configuration
    mockPayments: true,  // Use mock payments for testing
    autoComplete: true,  // Auto-complete payments for demo
    
    onSuccess: function(result) {
        console.log('TEST: Payment successful', result);
        // Test success handling
    }
};
```

### Development Tools

```javascript
// Enable debug mode for development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    window.cryptoPaymentConfig.debug = true;
    window.cryptoPaymentConfig.testMode = true;
    
    // Add development helpers
    window.cryptoDebug = {
        simulateSuccess: function() {
            window.cryptoWidget.handlePaymentSuccess({
                transaction: 'test-tx-' + Date.now(),
                order_id: 'test-order-' + Date.now(),
                confirmed_at: new Date().toISOString()
            });
        },
        
        simulateError: function(error) {
            window.cryptoWidget.onError(error || 'Test error');
        },
        
        getPaymentStatus: function() {
            return window.cryptoWidget.currentPayment;
        }
    };
}
```

## 🚀 Performance Optimization

### Lazy Loading

```javascript
// Load widget only when needed
function loadCryptoWidget() {
    if (window.cryptoWidgetLoaded) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/crypto-payment-widget.js';
        script.onload = () => {
            window.cryptoWidgetLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load on first crypto button click
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('load-crypto-widget')) {
        e.preventDefault();
        
        try {
            await loadCryptoWidget();
            // Initialize and proceed with payment
            const widget = window.initCryptoPayments(window.cryptoPaymentConfig);
            widget.initiatePayment(productData);
        } catch (error) {
            console.error('Failed to load crypto widget:', error);
        }
    }
});
```

### Resource Optimization

```javascript
// Optimize for performance
window.cryptoPaymentConfig = {
    // Reduce API calls
    checkInterval: 500,      // Check payments less frequently
    cacheTimeout: 300000,    // Cache SOL price for 5 minutes
    
    // Optimize UI
    modalAnimation: 'none',  // Disable animations for better performance
    preloadAssets: false,    // Don't preload unless needed
    
    // Lazy load features
    lazyLoadQR: true,       // Generate QR codes on demand
    deferAnalytics: true    // Defer analytics calls
};
```

## 🌐 Multi-Platform Examples

### E-commerce Platforms

#### **Magento 2**
```xml
<!-- app/code/YourModule/CryptoPayment/view/frontend/layout/catalog_product_view.xml -->
<referenceContainer name="product.info.main">
    <block class="YourModule\CryptoPayment\Block\Product\Crypto" 
           name="product.crypto.payment" 
           template="YourModule_CryptoPayment::product/crypto-button.phtml" />
</referenceContainer>
```

#### **Drupal Commerce**
```php
<?php
// modules/custom/crypto_payment/crypto_payment.module

function crypto_payment_page_attachments(&$attachments) {
    if (\Drupal::routeMatch()->getRouteName() == 'entity.commerce_product.canonical') {
        $attachments['#attached']['library'][] = 'crypto_payment/widget';
    }
}
?>
```

#### **PrestaShop**
```smarty
{* themes/your-theme/templates/catalog/product.tpl *}

<script>
document.addEventListener('DOMContentLoaded', function() {
    window.cryptoPaymentConfig = {
        apiBaseUrl: '{$crypto_api_url}',
        autoEnhance: true,
        productSelector: '.product-container'
    };
    
    const productData = {
        id: {$product.id},
        title: '{$product.name|escape:'javascript'}',
        price: {$product.price},
        quantity: 1
    };
});
</script>
```

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Widget not loading**
```javascript
// Check if script loaded
if (typeof window.CryptoPaymentWidget === 'undefined') {
    console.error('Crypto payment widget failed to load');
    // Fallback to traditional payment methods
}

// Check configuration
if (!window.cryptoPaymentConfig) {
    console.error('Crypto payment configuration missing');
}
```

**Issue: Products not being enhanced**
```javascript
// Debug product detection
console.log('Products found:', document.querySelectorAll(window.cryptoPaymentConfig.productSelector));

// Manual enhancement for debugging
if (window.cryptoWidget) {
    window.cryptoWidget.autoEnhanceProducts('.your-product-selector');
}
```

**Issue: Payment not confirming**
```javascript
// Check API connectivity
fetch('/api/crypto/health')
    .then(response => response.json())
    .then(data => console.log('API Health:', data))
    .catch(error => console.error('API Error:', error));
```

### Debug Mode

```javascript
// Enable comprehensive debugging
window.cryptoPaymentConfig = {
    debug: true,
    onStatusChange: function(status) {
        console.log('🔄 Debug - Status:', status);
    },
    onError: function(error) {
        console.error('❌ Debug - Error:', error);
        console.trace(); // Show stack trace
    }
};
```

## 🎉 Conclusion

The Crypto Payment Widget provides a comprehensive solution for integrating Solana cryptocurrency payments into any website or e-commerce platform. With its flexible configuration options, extensive customization capabilities, and robust security features, you can offer your customers a modern, secure payment method while maintaining full control over the user experience.

### Next Steps

1. **Install the widget** on your website using the quick installation guide
2. **Test the integration** using the provided examples and test mode
3. **Customize the appearance** to match your brand
4. **Set up analytics** tracking for better insights
5. **Deploy to production** following the security checklist
6. **Monitor performance** and gather user feedback

For additional support, examples, or custom integration assistance, please refer to the API documentation or contact our development team.

**Happy coding! 🚀💰**
