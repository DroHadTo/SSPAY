// FitPrint Solana Pay Integration Bridge - Simple Version
class FitPrintSolanaPayBridge {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.cryptoWidget = null;
        this.pendingOrders = new Map();
        this.orderQueue = [];
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
        
        if (cryptoBtn) {
            cryptoBtn.addEventListener('click', () => {
                const isVisible = cryptoOptions.style.display === 'block';
                cryptoOptions.style.display = isVisible ? 'none' : 'block';
            });
        }
        
        // Handle token selection
        const tokenOptions = document.querySelectorAll('#cryptoOptions .option');
        tokenOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const token = e.currentTarget.dataset.token;
                this.initiateCryptoPayment(token);
                cryptoOptions.style.display = 'none';
            });
        });
    }

    monitorFitPrintActions() {
        console.log('👀 Monitoring FitPrint actions...');
        
        // Monitor for checkout buttons and cart changes
        setInterval(() => {
            this.checkForFitPrintUpdates();
        }, 2000);
    }

    checkForFitPrintUpdates() {
        // This would normally check the iframe for cart updates
        // For now, we'll use a simplified approach
        const cryptoButton = document.getElementById('fitprint-crypto-checkout');
        
        // Show crypto button if there's activity (simplified detection)
        if (cryptoButton && this.currentCartTotal > 0) {
            cryptoButton.style.display = 'block';
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
            this.startPaymentMonitoring(orderData.id);

        } catch (error) {
            console.error('❌ QR code generation failed:', error);
            this.updatePaymentStatus('❌ Failed to generate payment QR code');
        }
    }

    displayQRCode(qrData) {
        const container = document.getElementById('qr-code-container');
        if (container && qrData.qrCode) {
            container.innerHTML = `
                <div class="qr-code">
                    <img src="${qrData.qrCode}" alt="Payment QR Code" style="max-width: 200px; height: auto;">
                    <p>Scan with your Solana wallet</p>
                </div>
            `;
        }
    }

    startPaymentMonitoring(orderId) {
        console.log(`👀 Monitoring payment for order: ${orderId}`);
        
        const checkPayment = async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/crypto/check-payment/${orderId}`);
                const result = await response.json();
                
                if (result.status === 'completed') {
                    this.handlePaymentSuccess(result);
                } else if (result.status === 'failed') {
                    this.handlePaymentFailure(result);
                } else {
                    // Continue monitoring
                    setTimeout(checkPayment, 3000);
                }
            } catch (error) {
                console.error('❌ Payment monitoring error:', error);
                setTimeout(checkPayment, 5000);
            }
        };
        
        checkPayment();
    }

    handlePaymentSuccess(result) {
        console.log('✅ Payment successful:', result);
        this.updatePaymentStatus('✅ Payment successful! Processing order...');
        
        setTimeout(() => {
            const modal = document.getElementById('crypto-payment-modal');
            if (modal) modal.remove();
            
            this.showSuccessNotification('🎉 Payment completed successfully!');
            this.processOrderCompletion(result);
        }, 2000);
    }

    handlePaymentFailure(result) {
        console.log('❌ Payment failed:', result);
        this.updatePaymentStatus('❌ Payment failed. Please try again.');
    }

    updatePaymentStatus(message) {
        const statusElement = document.getElementById('payment-status');
        if (statusElement) {
            statusElement.innerHTML = `<span>${message}</span>`;
        }
    }

    processOrderCompletion(paymentResult) {
        // Handle successful order completion
        console.log('📦 Processing order completion:', paymentResult);
        
        // Reset cart state
        this.currentCartTotal = 0;
        const cryptoButton = document.getElementById('fitprint-crypto-checkout');
        if (cryptoButton) {
            cryptoButton.style.display = 'none';
        }
        
        // Show success animation or redirect
        this.showOrderCompletionAnimation();
    }

    showOrderCompletionAnimation() {
        const animation = document.createElement('div');
        animation.innerHTML = `
            <div class="success-animation">
                <div class="checkmark">✅</div>
                <h3>Order Placed Successfully!</h3>
                <p>You'll receive a confirmation email shortly</p>
            </div>
        `;
        
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            color: var(--text-primary);
            z-index: 10002;
            animation: fadeIn 0.5s ease;
        `;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => animation.remove(), 500);
        }, 4000);
    }

    handleProductSelection(product) {
        console.log('🛍️ Product selected:', product);
        this.showProductNotification(product);
    }

    showProductNotification(product) {
        const notification = document.createElement('div');
        notification.className = 'product-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-shopping-bag"></i>
                <span>Product added to consideration</span>
            </div>
        `;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass-bg);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    interceptCheckout(orderData) {
        console.log('💳 Checkout intercepted:', orderData);
        
        // Set cart total from checkout data
        if (orderData.total) {
            this.currentCartTotal = orderData.total;
            this.handleCartUpdate({ total: orderData.total });
        }
        
        // Show crypto payment options
        this.showCryptoPaymentPrompt();
    }

    showCryptoPaymentPrompt() {
        const prompt = document.createElement('div');
        prompt.innerHTML = `
            <div class="crypto-prompt">
                <h4>💎 Pay with Crypto?</h4>
                <p>Use Solana Pay for instant, secure payments</p>
                <div class="prompt-buttons">
                    <button onclick="this.closest('.crypto-prompt').parentElement.remove()" class="btn-secondary">Continue with Fiat</button>
                    <button onclick="fitPrintBridge.showCryptoOptions(); this.closest('.crypto-prompt').parentElement.remove();" class="btn-primary">Pay with Crypto</button>
                </div>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 15px;
            padding: 30px;
            z-index: 10001;
            color: var(--text-primary);
            text-align: center;
        `;
        
        document.body.appendChild(prompt);
    }

    showCryptoOptions() {
        const cryptoOptions = document.getElementById('cryptoOptions');
        if (cryptoOptions) {
            cryptoOptions.style.display = 'block';
        }
    }

    extractFitPrintCartData() {
        // Extract cart data from FitPrint iframe if possible
        // This is a simplified version
        return [{
            source: 'fitprint',
            timestamp: new Date().toISOString(),
            amount: this.currentCartTotal
        }];
    }

    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
            </div>
        `;
        
        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            info: '#9945FF'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    updateCryptoPrice(price) {
        console.log('💰 Price updated:', price);
        
        if (price && price.total) {
            this.currentCartTotal = price.total;
            this.handleCartUpdate({ total: price.total });
        }
    }
}

// Initialize the bridge when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing FitPrint Solana Pay Bridge...');
    window.fitPrintBridge = new FitPrintSolanaPayBridge();
});

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);
