/**
 * Crypto Payment Widget - Universal JavaScript Widget for Solana Payments
 * Compatible with vanilla HTML, React, Vue, Angular, and other frameworks
 */

(function(global) {
    'use strict';

    // Widget configuration defaults
    const defaultConfig = {
        apiBaseUrl: 'http://localhost:3000/api/crypto',
        currency: 'SOL',
        onSuccess: (result) => console.log('Payment successful:', result),
        onError: (error) => console.error('Payment error:', error),
        onCancel: () => console.log('Payment cancelled'),
        theme: 'light',
        debug: false
    };

    // Crypto Payment Widget Class
    class CryptoPaymentWidget {
        constructor(config = {}) {
            this.config = { ...defaultConfig, ...config };
            this.isLoading = false;
            this.paymentModal = null;
            this.qrCodeElement = null;
            this.currentTransaction = null;
            
            if (this.config.debug) {
                console.log('CryptoPaymentWidget initialized with config:', this.config);
            }
            
            this.init();
        }

        init() {
            // Create CSS styles
            this.injectStyles();
            
            // Initialize widget
            this.setupEventListeners();
        }

        injectStyles() {
            if (document.getElementById('crypto-payment-widget-styles')) return;
            
            const styles = `
                .crypto-payment-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .crypto-payment-modal.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .crypto-payment-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                }
                
                .crypto-payment-modal.active .crypto-payment-content {
                    transform: translateY(0);
                }
                
                .crypto-payment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                }
                
                .crypto-payment-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                }
                
                .crypto-payment-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #999;
                    transition: color 0.2s ease;
                }
                
                .crypto-payment-close:hover {
                    color: #333;
                }
                
                .crypto-payment-amount {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                
                .crypto-payment-amount-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #9945ff;
                    margin: 0;
                }
                
                .crypto-payment-amount-currency {
                    font-size: 1rem;
                    color: #666;
                    margin-top: 0.5rem;
                }
                
                .crypto-payment-qr {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                
                .crypto-payment-qr canvas {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .crypto-payment-instructions {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                
                .crypto-payment-instructions h4 {
                    margin: 0 0 0.5rem 0;
                    color: #333;
                    font-size: 1rem;
                }
                
                .crypto-payment-instructions ol {
                    margin: 0;
                    padding-left: 1.2rem;
                    color: #666;
                }
                
                .crypto-payment-status {
                    text-align: center;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                
                .crypto-payment-status.pending {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                
                .crypto-payment-status.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .crypto-payment-status.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .crypto-payment-loading {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #9945ff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 0.5rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .crypto-payment-button {
                    background: #9945ff;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                    margin-top: 1rem;
                }
                
                .crypto-payment-button:hover {
                    background: #7c3aed;
                    transform: translateY(-1px);
                }
                
                .crypto-payment-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.id = 'crypto-payment-widget-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        setupEventListeners() {
            // Listen for payment button clicks
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('crypto-pay-btn') || 
                    e.target.closest('.crypto-pay-btn')) {
                    e.preventDefault();
                    const button = e.target.classList.contains('crypto-pay-btn') ? 
                        e.target : e.target.closest('.crypto-pay-btn');
                    this.handlePaymentClick(button);
                }
            });
        }

        async handlePaymentClick(button) {
            const productId = button.dataset.productId;
            const amount = button.dataset.amount;
            const description = button.dataset.description || 'Crypto Payment';

            if (!productId || !amount) {
                this.config.onError(new Error('Missing product ID or amount'));
                return;
            }

            try {
                await this.createPayment({
                    productId,
                    amount: parseFloat(amount),
                    description
                });
            } catch (error) {
                this.config.onError(error);
            }
        }

        async createPayment(paymentData) {
            if (this.isLoading) return;
            
            this.isLoading = true;
            this.showModal();
            this.updateStatus('Creating payment...', 'pending');

            try {
                const response = await fetch(`${this.config.apiBaseUrl}/create-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentData)
                });

                if (!response.ok) {
                    throw new Error(`Payment creation failed: ${response.statusText}`);
                }

                const result = await response.json();
                this.currentTransaction = result;
                
                this.displayPayment(result);
                this.startPaymentMonitoring(result.reference);
                
            } catch (error) {
                this.updateStatus('Payment creation failed', 'error');
                this.config.onError(error);
                setTimeout(() => this.hideModal(), 3000);
            } finally {
                this.isLoading = false;
            }
        }

        displayPayment(paymentData) {
            this.updateStatus('Scan QR code to pay', 'pending');
            
            // Update amount display
            const amountElement = this.paymentModal.querySelector('.crypto-payment-amount-value');
            const currencyElement = this.paymentModal.querySelector('.crypto-payment-amount-currency');
            
            if (amountElement) {
                amountElement.textContent = `${paymentData.amount} ${this.config.currency}`;
            }
            
            if (currencyElement) {
                currencyElement.textContent = `≈ $${paymentData.usdAmount?.toFixed(2) || '0.00'} USD`;
            }

            // Generate QR code
            this.generateQRCode(paymentData.paymentUrl);
        }

        generateQRCode(paymentUrl) {
            const qrContainer = this.paymentModal.querySelector('.crypto-payment-qr');
            qrContainer.innerHTML = '';

            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(paymentUrl, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (error, canvas) => {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        qrContainer.innerHTML = '<p>QR Code generation failed</p>';
                        return;
                    }
                    qrContainer.appendChild(canvas);
                });
            } else {
                // Fallback to QR code service
                const qrImage = document.createElement('img');
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(paymentUrl)}`;
                qrImage.alt = 'Payment QR Code';
                qrImage.style.width = '256px';
                qrImage.style.height = '256px';
                qrContainer.appendChild(qrImage);
            }
        }

        async startPaymentMonitoring(reference) {
            const checkPayment = async () => {
                try {
                    const response = await fetch(`${this.config.apiBaseUrl}/verify-payment/${reference}`);
                    const result = await response.json();

                    if (result.status === 'completed') {
                        this.updateStatus('Payment successful!', 'success');
                        this.config.onSuccess(result);
                        setTimeout(() => this.hideModal(), 3000);
                        return;
                    } else if (result.status === 'failed') {
                        this.updateStatus('Payment failed', 'error');
                        this.config.onError(new Error('Payment verification failed'));
                        setTimeout(() => this.hideModal(), 3000);
                        return;
                    }

                    // Continue monitoring
                    setTimeout(checkPayment, 2000);
                } catch (error) {
                    console.error('Payment monitoring error:', error);
                    setTimeout(checkPayment, 5000); // Retry after longer delay
                }
            };

            checkPayment();
        }

        showModal() {
            if (!this.paymentModal) {
                this.createModal();
            }
            
            document.body.appendChild(this.paymentModal);
            setTimeout(() => {
                this.paymentModal.classList.add('active');
            }, 10);
        }

        hideModal() {
            if (this.paymentModal) {
                this.paymentModal.classList.remove('active');
                setTimeout(() => {
                    if (this.paymentModal && this.paymentModal.parentNode) {
                        this.paymentModal.parentNode.removeChild(this.paymentModal);
                    }
                }, 300);
            }
            this.currentTransaction = null;
            this.isLoading = false;
        }

        createModal() {
            this.paymentModal = document.createElement('div');
            this.paymentModal.className = 'crypto-payment-modal';
            this.paymentModal.innerHTML = `
                <div class="crypto-payment-content">
                    <div class="crypto-payment-header">
                        <h3 class="crypto-payment-title">Crypto Payment</h3>
                        <button class="crypto-payment-close">&times;</button>
                    </div>
                    <div class="crypto-payment-amount">
                        <p class="crypto-payment-amount-value">0 SOL</p>
                        <p class="crypto-payment-amount-currency">≈ $0.00 USD</p>
                    </div>
                    <div class="crypto-payment-qr"></div>
                    <div class="crypto-payment-instructions">
                        <h4>How to pay:</h4>
                        <ol>
                            <li>Open your Solana wallet app</li>
                            <li>Scan the QR code above</li>
                            <li>Confirm the payment</li>
                            <li>Wait for confirmation</li>
                        </ol>
                    </div>
                    <div class="crypto-payment-status pending">
                        <span class="crypto-payment-loading"></span>
                        Waiting for payment...
                    </div>
                </div>
            `;

            // Add event listeners
            const closeBtn = this.paymentModal.querySelector('.crypto-payment-close');
            closeBtn.addEventListener('click', () => {
                this.config.onCancel();
                this.hideModal();
            });

            // Close on backdrop click
            this.paymentModal.addEventListener('click', (e) => {
                if (e.target === this.paymentModal) {
                    this.config.onCancel();
                    this.hideModal();
                }
            });
        }

        updateStatus(message, type) {
            if (!this.paymentModal) return;
            
            const statusElement = this.paymentModal.querySelector('.crypto-payment-status');
            statusElement.className = `crypto-payment-status ${type}`;
            
            if (type === 'pending') {
                statusElement.innerHTML = `<span class="crypto-payment-loading"></span>${message}`;
            } else {
                statusElement.textContent = message;
            }
        }

        // Public API methods
        pay(paymentData) {
            return this.createPayment(paymentData);
        }

        addCryptoPayButton(productElement, productData) {
            if (!productElement) {
                console.error('Product element not found');
                return;
            }

            // Create crypto pay button
            const cryptoButton = document.createElement('button');
            cryptoButton.className = 'crypto-pay-btn crypto-payment-button';
            cryptoButton.dataset.productId = productData.id;
            cryptoButton.dataset.amount = (productData.price / 200).toFixed(4); // Convert USD to approximate SOL
            cryptoButton.dataset.description = productData.title;
            cryptoButton.innerHTML = `
                <i class="fab fa-solana"></i>
                Pay with Crypto
            `;

            // Find existing button container or create one
            let buttonContainer = productElement.querySelector('.product-actions, .product-buttons, .btn-group');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'crypto-button-container';
                productElement.appendChild(buttonContainer);
            }

            buttonContainer.appendChild(cryptoButton);

            if (this.config.debug) {
                console.log('Added crypto pay button to product:', productData);
            }
        }

        close() {
            this.hideModal();
        }

        destroy() {
            this.hideModal();
            const styles = document.getElementById('crypto-payment-widget-styles');
            if (styles) {
                styles.remove();
            }
        }
    }

    // Auto-initialize if config is available
    let widgetInstance = null;
    
    function initializeCryptoWidget() {
        if (typeof window !== 'undefined' && window.cryptoPaymentConfig && !widgetInstance) {
            widgetInstance = new CryptoPaymentWidget(window.cryptoPaymentConfig);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCryptoWidget);
    } else {
        initializeCryptoWidget();
    }

    // Export for manual initialization
    global.CryptoPaymentWidget = CryptoPaymentWidget;
    global.initializeCryptoWidget = initializeCryptoWidget;

})(typeof window !== 'undefined' ? window : this);
