// FitPrin    init() {
        console.log('🔗 Initializing FitPrint Solana Pay Bridge (Simple)...');
        this.setupMessageListener();
        this.injectCryptoPaymentButton();
        this.monitorFitPrintActions();
    }a Pay Integration Bridge
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
        this.initializeCategorizedIframes();
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

    setupLayoutControls() {
        console.log('🎨 Setting up layout controls...');
        
        const layoutButtons = document.querySelectorAll('.layout-btn');
        
        layoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                layoutButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                e.currentTarget.classList.add('active');
                
                // Get layout parameters
                const layout = e.currentTarget.dataset.layout;
                const cols = e.currentTarget.dataset.cols;
                
                // Update the iframe URL
                this.updateFitPrintLayout(layout, cols);
                
                // Show feedback
                this.showLayoutChangeNotification(layout, cols);
            });
        });
    }

    updateFitPrintLayout(layout, cols) {
        const iframe = document.getElementById('fitPrintIframe');
        if (!iframe) return;

        // Build new URL with layout parameters
        const baseUrl = 'https://shop.fitprint.io/v2.html';
        const shopId = '6ceb7c18-de93-4f66-ad92-cd3da2217e2c';
        
        const params = new URLSearchParams({
            shop: shopId,
            layout: layout,
            cols: cols,
            theme: 'dark',
            category: 'all',
            sort: 'popular'
        });

        const newUrl = `${baseUrl}?${params.toString()}`;
        
        console.log(`🔄 Updating FitPrint layout: ${layout} (${cols} columns)`);
        console.log(`📍 New URL: ${newUrl}`);
        
        // Show loading state
        this.showLoadingState();
        
        // Update iframe source
        iframe.src = newUrl;
        
        // Hide loading state after delay
        setTimeout(() => {
            this.hideLoadingState();
        }, 2000);
    }

    showLoadingState() {
        const iframe = document.getElementById('fitPrintIframe');
        if (iframe) {
            iframe.style.opacity = '0.6';
            iframe.style.pointerEvents = 'none';
        }
        
        // Add loading overlay
        const container = iframe?.parentElement;
        if (container && !container.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 10px;
                    text-align: center;
                    z-index: 1000;
                ">
                    <div style="
                        width: 30px;
                        height: 30px;
                        border: 3px solid #9945FF;
                        border-top: 3px solid transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 10px;
                    "></div>
                    <div>Updating layout...</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999;
            `;
            
            container.style.position = 'relative';
            container.appendChild(overlay);
        }
    }

    hideLoadingState() {
        const iframe = document.getElementById('fitPrintIframe');
        if (iframe) {
            iframe.style.opacity = '1';
            iframe.style.pointerEvents = 'auto';
        }
        
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showLayoutChangeNotification(layout, cols) {
        const layoutNames = {
            'grid': `Grid View (${cols} columns)`,
            'list': 'List View'
        };
        
        const layoutName = layoutNames[layout] || `${layout} layout`;
        
        this.showSuccessNotification(`Layout updated to: ${layoutName}`);
    }

    setupCategoryControls() {
        console.log('📦 Setting up category controls...');
        
        const categorySelect = document.getElementById('categorySelect');
        const organizeBtn = document.getElementById('organizeBtn');
        
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
        
        if (organizeBtn) {
            organizeBtn.addEventListener('click', () => {
                this.openOrganizationModal();
            });
        }
    }

    filterByCategory(category) {
        console.log(`🔍 Filtering by category: ${category}`);
        
        const iframe = document.getElementById('fitPrintIframe');
        if (!iframe) return;

        // Update URL with category filter
        const baseUrl = 'https://shop.fitprint.io/v2.html';
        const shopId = '6ceb7c18-de93-4f66-ad92-cd3da2217e2c';
        
        const params = new URLSearchParams({
            shop: shopId,
            layout: 'grid',
            cols: '3',
            theme: 'dark',
            category: category,
            sort: 'popular'
        });

        iframe.src = `${baseUrl}?${params.toString()}`;
        
        this.showSuccessNotification(`Filtered to: ${this.getCategoryDisplayName(category)}`);
    }

    getCategoryDisplayName(category) {
        const categoryNames = {
            'all': 'All Products',
            'apparel': '👕 Apparel',
            'accessories': '📱 Phone Cases',
            'drinkware': '☕ Drinkware',
            'bags': '🎒 Bags',
            'homedecor': '🏠 Home Decor',
            'stickers': '🎨 Stickers',
            'custom': '⭐ Custom Group'
        };
        return categoryNames[category] || category;
    }

    setupProductOrganization() {
        console.log('🔧 Setting up product organization system...');
        
        // Store current product organization
        this.productCategories = {
            apparel: [],
            accessories: [],
            drinkware: [],
            bags: [],
            homedecor: [],
            stickers: []
        };
        
        // Load saved organization from localStorage
        this.loadSavedOrganization();
    }

    openOrganizationModal() {
        console.log('📦 Opening product organization modal...');
        
        const modal = document.getElementById('organizationModal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateProductCounts();
            this.setupDragAndDrop();
        }
    }

    updateProductCounts() {
        // Update product counts in each category
        Object.keys(this.productCategories).forEach(category => {
            const count = this.productCategories[category].length;
            const countElement = document.getElementById(`${category}Count`);
            if (countElement) {
                countElement.textContent = `${count} items`;
            }
        });
    }

    setupDragAndDrop() {
        console.log('🎯 Setting up drag and drop functionality...');
        
        const zones = document.querySelectorAll('.category-zone');
        
        zones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const category = zone.dataset.category;
                const productData = e.dataTransfer.getData('text/plain');
                
                this.moveProductToCategory(productData, category);
            });
        });
    }

    moveProductToCategory(productData, targetCategory) {
        try {
            const product = JSON.parse(productData);
            
            // Remove from current category
            Object.keys(this.productCategories).forEach(category => {
                this.productCategories[category] = this.productCategories[category].filter(
                    p => p.id !== product.id
                );
            });
            
            // Add to target category
            this.productCategories[targetCategory].push(product);
            
            this.updateProductCounts();
            this.saveOrganization();
            
            console.log(`📦 Moved product "${product.name}" to ${targetCategory}`);
            this.showSuccessNotification(`Product moved to ${this.getCategoryDisplayName(targetCategory)}`);
            
        } catch (error) {
            console.error('Error moving product:', error);
            this.showErrorNotification('Failed to move product');
        }
    }

    applyAutoSort() {
        console.log('🔮 Applying automatic product sorting...');
        
        // Simulate auto-sorting based on product keywords
        this.sendMessageToFitPrint({
            action: 'get_all_products',
            callback: 'autoSortProducts'
        });
        
        // For now, show a demo of auto-sorting
        this.showLoadingState();
        
        setTimeout(() => {
            this.hideLoadingState();
            this.showSuccessNotification('Products auto-sorted by category!');
            this.updateProductCounts();
            
            // Simulate some products in categories
            this.productCategories.apparel = [
                { id: 1, name: 'Custom T-Shirt', keywords: ['shirt', 'apparel'] },
                { id: 2, name: 'Hoodie Design', keywords: ['hoodie', 'clothing'] }
            ];
            this.productCategories.accessories = [
                { id: 3, name: 'Phone Case', keywords: ['case', 'phone'] }
            ];
            this.productCategories.drinkware = [
                { id: 4, name: 'Custom Mug', keywords: ['mug', 'cup'] }
            ];
            
            this.updateProductCounts();
            this.saveOrganization();
        }, 2000);
    }

    resetToDefault() {
        console.log('🔄 Resetting to default organization...');
        
        // Clear all categories
        Object.keys(this.productCategories).forEach(category => {
            this.productCategories[category] = [];
        });
        
        this.updateProductCounts();
        this.saveOrganization();
        
        // Reset FitPrint to show all products
        this.filterByCategory('all');
        
        this.showSuccessNotification('Organization reset to default');
    }

    applyOrganization() {
        console.log('✅ Applying product organization...');
        
        // Send organization data to FitPrint
        this.sendMessageToFitPrint({
            action: 'apply_organization',
            categories: this.productCategories
        });
        
        // Save the organization
        this.saveOrganization();
        
        // Close modal
        document.getElementById('organizationModal').style.display = 'none';
        
        this.showSuccessNotification('Product organization applied successfully!');
        
        // Refresh the iframe to show organized products
        this.showLoadingState();
        setTimeout(() => {
            this.hideLoadingState();
        }, 1500);
    }

    saveOrganization() {
        try {
            localStorage.setItem('fitprint_organization', JSON.stringify(this.productCategories));
            console.log('💾 Product organization saved');
        } catch (error) {
            console.error('Failed to save organization:', error);
        }
    }

    loadSavedOrganization() {
        try {
            const saved = localStorage.getItem('fitprint_organization');
            if (saved) {
                this.productCategories = JSON.parse(saved);
                console.log('📂 Loaded saved product organization');
            }
        } catch (error) {
            console.error('Failed to load saved organization:', error);
        }
    }

    savePreset() {
        const presetName = prompt('Enter a name for this organization preset:');
        if (!presetName) return;

        try {
            const presets = JSON.parse(localStorage.getItem('fitprint_presets') || '{}');
            presets[presetName] = {
                categories: { ...this.productCategories },
                created: new Date().toISOString(),
                name: presetName
            };
            
            localStorage.setItem('fitprint_presets', JSON.stringify(presets));
            
            this.showSuccessNotification(`Preset "${presetName}" saved successfully!`);
            console.log(`💾 Saved preset: ${presetName}`);
            
        } catch (error) {
            console.error('Failed to save preset:', error);
            this.showErrorNotification('Failed to save preset');
        }
    }

    loadPreset() {
        try {
            const presets = JSON.parse(localStorage.getItem('fitprint_presets') || '{}');
            const presetNames = Object.keys(presets);
            
            if (presetNames.length === 0) {
                this.showErrorNotification('No saved presets found');
                return;
            }
            
            const presetList = presetNames.map((name, index) => 
                `${index + 1}. ${name} (${new Date(presets[name].created).toLocaleDateString()})`
            ).join('\n');
            
            const selection = prompt(`Select a preset to load:\n\n${presetList}\n\nEnter the number or name:`);
            if (!selection) return;
            
            let selectedPreset = null;
            
            // Try to find by number first
            const num = parseInt(selection);
            if (num && num <= presetNames.length) {
                selectedPreset = presets[presetNames[num - 1]];
            } else {
                // Try to find by name
                selectedPreset = presets[selection] || presets[presetNames.find(name => 
                    name.toLowerCase().includes(selection.toLowerCase())
                )];
            }
            
            if (selectedPreset) {
                this.productCategories = { ...selectedPreset.categories };
                this.updateProductCounts();
                this.saveOrganization();
                
                this.showSuccessNotification(`Preset "${selectedPreset.name}" loaded successfully!`);
                console.log(`📂 Loaded preset: ${selectedPreset.name}`);
            } else {
                this.showErrorNotification('Preset not found');
            }
            
        } catch (error) {
            console.error('Failed to load preset:', error);
            this.showErrorNotification('Failed to load preset');
        }
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
