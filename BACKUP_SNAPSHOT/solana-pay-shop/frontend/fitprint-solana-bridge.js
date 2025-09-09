// FitPrint Solana Pay Integration Bridge
class FitPrintSolanaPayBridge {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3003/api';
        this.cryptoWidget = null;
        this.pendingOrders = new Map();
        this.orderQueue = [];
        this.init();
    }

    init() {
        console.log('🔗 Initializing FitPrint Solana Pay Bridge...');
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
        console.log('🛒 Cart Updated:', cart);
        const cryptoButton = document.getElementById('fitprint-crypto-checkout');
        const cryptoPrice = document.getElementById('cryptoPrice');
        
        if (cart && cart.total > 0) {
            cryptoButton.style.display = 'block';
            cryptoPrice.textContent = `$${cart.total.toFixed(2)}`;
            this.currentCartTotal = cart.total;
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

    showCryptoPaymentModal(orderData) {
        // Create modal for crypto payment
        const modal = document.createElement('div');
        modal.id = 'crypto-payment-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚀 Pay with Crypto</h3>
                        <button class="close-btn" onclick="this.closest('#crypto-payment-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="payment-details">
                            <p><strong>Amount:</strong> $${orderData.amount}</p>
                            <p><strong>Token:</strong> ${orderData.token}</p>
                            <p><strong>Store:</strong> FitPrint Custom Products</p>
                        </div>
                        <div id="qr-code-container">
                            <div class="loading">Generating payment QR code...</div>
                        </div>
                        <div class="payment-status" id="payment-status">
                            <span>⏳ Waiting for payment...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Style the modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        document.body.appendChild(modal);
        this.generateQRCode(orderData);
    }

    async generateQRCode(orderData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/crypto/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: orderData.id,
                    amount: orderData.amount,
                    token: orderData.token
                })
            });

            const qrData = await response.json();
            this.displayQRCode(qrData);
            this.monitorPayment(orderData.id);
            
        } catch (error) {
            console.error('❌ QR code generation failed:', error);
        }
    }

    displayQRCode(qrData) {
        const container = document.getElementById('qr-code-container');
        if (container) {
            container.innerHTML = `
                <div class="qr-code">
                    <img src="${qrData.qrCodeUrl}" alt="Payment QR Code" style="width: 200px; height: 200px;">
                </div>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    Scan with your Solana wallet
                </p>
            `;
        }
    }

    async monitorPayment(orderId) {
        const statusElement = document.getElementById('payment-status');
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes

        const checkPayment = async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/crypto/payment-status/${orderId}`);
                const status = await response.json();

                if (status.paid) {
                    statusElement.innerHTML = '✅ Payment successful!';
                    setTimeout(() => {
                        document.getElementById('crypto-payment-modal')?.remove();
                        this.handleSuccessfulPayment(status);
                    }, 2000);
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkPayment, 5000); // Check every 5 seconds
                } else {
                    statusElement.innerHTML = '⏰ Payment timeout. Please try again.';
                }
            } catch (error) {
                console.error('Payment monitoring error:', error);
            }
        };

        checkPayment();
    }

    handleSuccessfulPayment(paymentData) {
        console.log('🎉 Payment successful:', paymentData);
        
        // Show success notification
        this.showSuccessNotification('Payment successful! Processing your order...');
        
        // Send success message to FitPrint
        this.sendMessageToFitPrint({
            action: 'payment_completed',
            paymentData: paymentData,
            orderId: paymentData.orderId
        });

        // Hide crypto button
        const cryptoButton = document.getElementById('fitprint-crypto-checkout');
        if (cryptoButton) {
            cryptoButton.style.display = 'none';
        }
    }

    extractFitPrintCartData() {
        // Extract cart data from FitPrint store (limited by cross-origin)
        return {
            source: 'fitprint',
            timestamp: new Date().toISOString(),
            extractedAt: 'client-side'
        };
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ed573;
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 10002;
                font-family: 'Inter', sans-serif;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                ✅ ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff4757;
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 10002;
                font-family: 'Inter', sans-serif;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            ">
                ❌ ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the bridge when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 Starting FitPrint Solana Pay Bridge...');
    window.fitPrintBridge = new FitPrintSolanaPayBridge();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FitPrintSolanaPayBridge;
}
