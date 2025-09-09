// FitPrint Solana Pay Integration Bridge (Simplified & Fixed)
class FitPrintSolanaPayBridge {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentCartTotal = 0;
        this.init();
    }

    init() {
        console.log('🔗 Initializing FitPrint Solana Pay Bridge (Simple)...');
        this.setupMessageListener();
        this.injectCryptoPaymentButton();
        this.monitorFitPrintActions();
    }

    setupMessageListener() {
        // Listen for messages from the FitPrint iframe
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://shop.fitprint.io') return;
            
            try {
                const data = JSON.parse(event.data);
                this.handleFitPrintMessage(data);
            } catch (error) {
                console.log('FitPrint message (non-JSON):', event.data);
            }
        });
    }

    handleFitPrintMessage(data) {
        console.log('📨 FitPrint Message:', data);
        
        switch (data.action) {
            case 'cart_updated':
                this.handleCartUpdate(data.cart);
                break;
            case 'checkout_initiated':
                this.interceptCheckout(data.orderData);
                break;
            case 'product_selected':
                this.handleProductSelection(data.product);
                break;
            case 'price_calculated':
                this.updateCryptoPrice(data.price);
                break;
        }
    }

    injectCryptoPaymentButton() {
        // Inject a floating crypto payment button
        const cryptoButton = document.createElement('div');
        cryptoButton.id = 'fitprint-crypto-checkout';
        cryptoButton.innerHTML = `
            <div class="crypto-checkout-btn" id="cryptoCheckoutBtn">
                <i class="fab fa-solana"></i>
                <span>Pay with Crypto</span>
                <div class="crypto-price" id="cryptoPrice">$0.00</div>
            </div>
            <div class="crypto-options" id="cryptoOptions" style="display: none;">
                <div class="option" data-token="SOL">
                    <span>🪙 Pay with SOL</span>
                </div>
                <div class="option" data-token="USDC">
                    <span>💵 Pay with USDC</span>
                </div>
                <div class="option" data-token="USDT">
                    <span>💰 Pay with USDT</span>
                </div>
            </div>
        `;
        
        // Style the button
        cryptoButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #9945FF, #14F195);
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(153, 69, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            display: none;
        `;
        
        document.body.appendChild(cryptoButton);
        this.setupCryptoButtonEvents();
    }

    setupCryptoButtonEvents() {
        const cryptoBtn = document.getElementById('cryptoCheckoutBtn');
        const cryptoOptions = document.getElementById('cryptoOptions');
        
        cryptoBtn?.addEventListener('click', () => {
            const isVisible = cryptoOptions.style.display !== 'none';
            cryptoOptions.style.display = isVisible ? 'none' : 'block';
        });

        // Handle crypto payment selection
        cryptoOptions?.addEventListener('click', (e) => {
            const option = e.target.closest('[data-token]');
            if (option) {
                const token = option.dataset.token;
                this.initiateCryptoPayment(token);
            }
        });
    }

    monitorFitPrintActions() {
        // Monitor FitPrint iframe for checkout actions
        setInterval(() => {
            this.checkForCheckoutIntent();
        }, 1000);
    }

    checkForCheckoutIntent() {
        const iframe = document.getElementById('fitPrintIframe');
        if (!iframe) return;

        try {
            // Check if there's cart content to enable crypto payment
            this.sendMessageToFitPrint({
                action: 'get_cart_total',
                requestId: Date.now()
            });
        } catch (error) {
            // Cross-origin restrictions expected
        }
    }

    sendMessageToFitPrint(message) {
        const iframe = document.getElementById('fitPrintIframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify(message), 'https://shop.fitprint.io');
        }
    }

    handleCartUpdate(cart) {
        console.log('🛒 Cart updated:', cart);
        
        const cryptoButton = document.getElementById('fitprint-crypto-checkout');
        const cryptoPrice = document.getElementById('cryptoPrice');
        
        if (cart && cart.total > 0) {
            cryptoButton.style.display = 'block';
            cryptoPrice.textContent = `$${cart.total.toFixed(2)}`;
            this.currentCartTotal = cart.total;
            
            // Update main shop cart if available
            if (window.shop && typeof window.shop.handleFitPrintCartUpdate === 'function') {
                window.shop.handleFitPrintCartUpdate(cart);
            }
        } else {
            cryptoButton.style.display = 'none';
            this.currentCartTotal = 0;
        }
    }

    async initiateCryptoPayment(token) {
        console.log(`💰 Initiating ${token} payment for $${this.currentCartTotal}`);
        
        try {
            // Create order in our system
            const orderData = await this.createSolanaOrder({
                amount: this.currentCartTotal,
                token: token,
                source: 'fitprint',
                products: this.extractFitPrintCartData()
            });

            // Initialize crypto payment widget
            this.showCryptoPaymentModal(orderData);
            
        } catch (error) {
            console.error('❌ Crypto payment initiation failed:', error);
            this.showErrorNotification('Failed to initiate crypto payment');
        }
    }

    async createSolanaOrder(orderData) {
        const response = await fetch(`${this.apiBaseUrl}/crypto/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to create Solana order');
        }

        return await response.json();
    }

    extractFitPrintCartData() {
        // Try to extract cart data from FitPrint iframe
        return {
            items: [],
            total: this.currentCartTotal,
            timestamp: Date.now()
        };
    }

    showCryptoPaymentModal(orderData) {
        // Create modal for crypto payment
        const modal = document.createElement('div');
        modal.className = 'crypto-payment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💰 Crypto Payment</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="payment-details">
                        <p>Amount: $${orderData.amount}</p>
                        <p>Token: ${orderData.token}</p>
                        <div class="qr-code" id="cryptoQR">
                            <!-- QR code will be generated here -->
                        </div>
                        <p class="payment-address">Send to: <code>${orderData.address}</code></p>
                        <button class="copy-btn" onclick="navigator.clipboard.writeText('${orderData.address}')">
                            Copy Address
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        modal.querySelector('.close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Generate QR code
        this.generateQRCode(orderData.address, 'cryptoQR');
    }

    generateQRCode(address, containerId) {
        // Simple QR code generation (you might want to use a library like qrcode.js)
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <p>Scan QR Code (requires QR library)</p>
                    <p style="font-size: 12px; word-break: break-all;">${address}</p>
                </div>
            `;
        }
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 15000;
            box-shadow: 0 5px 15px rgba(255, 68, 68, 0.3);
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    // Additional methods for handling different scenarios
    handleProductSelection(product) {
        console.log('🎯 Product selected:', product);
    }

    updateCryptoPrice(price) {
        console.log('💲 Price updated:', price);
        const cryptoPrice = document.getElementById('cryptoPrice');
        if (cryptoPrice) {
            cryptoPrice.textContent = `$${price.toFixed(2)}`;
            this.currentCartTotal = price;
        }
    }

    interceptCheckout(orderData) {
        console.log('🛒 Checkout initiated:', orderData);
        // Show crypto payment options instead of regular checkout
        this.showCryptoPaymentModal(orderData);
    }
}

// Initialize the bridge when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.fitprintBridge = new FitPrintSolanaPayBridge();
});

// Global test function
window.testFitPrintIntegration = function() {
    console.log('🧪 Testing FitPrint Integration...');
    
    // Simulate cart update
    if (window.fitprintBridge) {
        window.fitprintBridge.handleCartUpdate({
            total: 29.99,
            items: [
                { name: 'Test Product', price: 29.99, quantity: 1 }
            ]
        });
        console.log('✅ Cart update test completed');
    } else {
        console.error('❌ FitPrint bridge not found');
    }
};
