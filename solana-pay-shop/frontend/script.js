// Solana Pay Shop Frontend JavaScript with Backend Integration

class SolanaPayShop {
    constructor() {
        this.cart = [];
        this.products = [];
        this.total = 0;
        this.currentPaymentRequest = null;
        this.walletAdapter = null;
        
        // Initialize API service and loading manager
        this.api = new ApiService('http://localhost:3000/api');
        this.loading = new LoadingManager();
        
        // Initialize Solana Pay connection to mainnet-beta
        this.connection = new solanaWeb3.Connection(
            solanaWeb3.clusterApiUrl('mainnet-beta'),
            'confirmed'
        );
        
        // SOL to USD conversion rate (mock - in production use real API)
        this.solPrice = 20; // $20 per SOL
        
        this.init();
    }

    async init() {
        // Generate or get session ID for analytics
        this.sessionId = this.getOrCreateSessionId();
        
        // Test API connection first
        await this.testApiConnection();
        // await this.loadProducts(); // Commented out - using FitPrint store instead
        this.setupEventListeners();
        this.updateCartDisplay();
        this.initializeWalletConnection();
        
        // Track session start
        await this.trackUserSession({
            event: 'session_start',
            pageView: window.location.pathname
        });
    }

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('shop_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('shop_session_id', sessionId);
        }
        return sessionId;
    }

    async trackUserSession(data) {
        try {
            await this.api.trackUserSession({
                sessionId: this.sessionId,
                ...data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.log('Analytics tracking failed (non-critical):', error.message);
        }
    }

    async trackProductView(product) {
        try {
            await this.api.trackProductView(product.id, product.name, this.sessionId);
            console.log(`📊 Tracked view for product: ${product.name}`);
        } catch (error) {
            console.log('Product view tracking failed (non-critical):', error.message);
        }
    }

    async testApiConnection() {
        try {
            this.loading.show('globalLoader', 'Connecting to server...');
            const result = await this.api.testConnection();
            
            if (result.success) {
                console.log('✅ API connection successful');
                this.showToast('Connected to server', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ API connection failed:', error);
            this.showToast('Server connection failed - using offline mode', 'warning');
            // Fall back to mock data if needed
        } finally {
            this.loading.hide('globalLoader');
        }
    }

    // Initialize Solana Pay connection to mainnet-beta
    initializeWalletConnection() {
        // Check if wallet is available
        if (window.solana && window.solana.isPhantom) {
            this.walletAdapter = window.solana;
            console.log('Phantom wallet detected');
        } else {
            console.log('Phantom wallet not detected');
        }
    }

    async connectWallet() {
        try {
            if (!this.walletAdapter) {
                this.showToast('Please install Phantom wallet', 'error');
                return false;
            }

            const response = await this.walletAdapter.connect();
            console.log('Wallet connected:', response.publicKey.toString());
            
            // Update UI
            const connectBtn = document.getElementById('connectWalletBtn');
            connectBtn.innerHTML = `
                <i class="fas fa-check-circle"></i>
                ${response.publicKey.toString().slice(0, 8)}...
            `;
            connectBtn.classList.add('connected');
            
            this.showToast('Wallet connected successfully!', 'success');
            this.closeWalletModal();
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showToast('Failed to connect wallet', 'error');
            return false;
        }
    }

    async loadProducts() {
        try {
            this.loading.show('productsLoader', 'Loading products...');
            
            // Fetch products from API
            const response = await this.api.getProducts();
            this.products = response.products || [];
            
            console.log(`Loaded ${this.products.length} products from API`);
            
            // If no products from API, fall back to mock data
            if (this.products.length === 0) {
                console.log('No products from API, using fallback data');
                this.products = this.getMockProducts();
            }
            
            this.displayProducts();
            
        } catch (error) {
            console.error('Failed to load products from API:', error);
            ErrorHandler.show(error);
            
            // Fall back to mock data
            console.log('Using mock products as fallback');
            this.products = this.getMockProducts();
            this.displayProducts();
            
        } finally {
            this.loading.hide('productsLoader');
        }
    }

    getMockProducts() {
        return [
            {
                id: '1',
                name: "Solana T-Shirt",
                price: 25.99,
                description: "Official Solana branded t-shirt made from premium cotton",
                category: "T-Shirts",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
                stock: "in-stock",
                rating: 4.8,
                sales: 156
            },
            {
                id: '2',
                name: "Crypto Hoodie",
                price: 45.99,
                description: "Comfortable hoodie perfect for crypto enthusiasts",
                category: "Hoodies",
                image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
                stock: "in-stock",
                rating: 4.6,
                sales: 89
            },
            {
                id: '3',
                name: "Blockchain Mug",
                price: 15.99,
                description: "Start your day with a cup of decentralization",
                category: "Mugs",
                image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
                stock: "in-stock",
                rating: 4.7,
                sales: 234
            }
        ];
    }

    displayProducts(filteredProducts = null) {
        const productGrid = document.getElementById('productsGrid');
        
        // Check if products grid exists (it won't in FitPrint-only mode)
        if (!productGrid) {
            console.log('Products grid not found - using FitPrint store instead');
            return;
        }
        
        const productsToShow = filteredProducts || this.products;
        
        // Remove loading skeleton
        const skeleton = productGrid.querySelector('.loading-skeleton');
        if (skeleton) skeleton.remove();
        
        productGrid.innerHTML = '';

        productsToShow.forEach(product => {
            const productCard = this.createProductCard(product);
            productGrid.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);
        
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" />
                <div class="product-overlay">
                    <button class="quick-view-btn" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                        Quick View
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-text">${product.rating} (${product.reviews})</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-cart-plus"></i>
                        Add to Cart
                    </button>
                </div>
                <div class="product-stock">
                    <i class="fas fa-check-circle"></i>
                    ${product.inventory} in stock
                </div>
            </div>
        `;

        return card;
    }

    setupEventListeners() {
        // Product interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const productId = parseInt(e.target.closest('.add-to-cart-btn').getAttribute('data-product-id'));
                this.addToCart(productId);
            }

            if (e.target.closest('.quick-view-btn')) {
                const productId = parseInt(e.target.closest('.quick-view-btn').getAttribute('data-product-id'));
                this.showQuickView(productId);
            }

            // Cart interactions
            if (e.target.closest('.quantity-btn')) {
                const action = e.target.closest('.quantity-btn').getAttribute('data-action');
                const productId = parseInt(e.target.closest('.quantity-btn').getAttribute('data-product-id'));
                this.updateQuantity(productId, action);
            }

            if (e.target.closest('.remove-item')) {
                const productId = parseInt(e.target.closest('.remove-item').getAttribute('data-product-id'));
                this.removeFromCart(productId);
            }

            // Wallet connections
            if (e.target.closest('#connectWalletBtn')) {
                this.openWalletModal();
            }

            if (e.target.closest('.wallet-option')) {
                const wallet = e.target.closest('.wallet-option').getAttribute('data-wallet');
                this.connectWallet(wallet);
            }

            // Cart toggle
            if (e.target.closest('#cartToggle')) {
                this.toggleCart();
            }

            if (e.target.closest('#cartCloseBtn')) {
                this.closeCart();
            }

            // Checkout
            if (e.target.closest('#checkoutBtn')) {
                this.initiatePayment();
            }

            // Modal controls
            if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Filter functionality - Commented out (using FitPrint store)
        /*
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterProducts(e.target.getAttribute('data-filter'));
            });
        });

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortProducts(e.target.value);
        });
        */

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            document.querySelector('.navbar').classList.toggle('mobile-open');
        });
    }

    async addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Track product view and add to cart event
        await this.trackProductView(product);
        await this.trackUserSession({
            event: 'add_to_cart',
            eventData: { 
                productId: product.id, 
                productName: product.name, 
                price: product.price 
            }
        });

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        this.showToast(`${product.name} added to cart!`, 'success');
        
        // Add animation to cart button
        const cartToggle = document.getElementById('cartToggle');
        cartToggle.classList.add('bounce');
        setTimeout(() => cartToggle.classList.remove('bounce'), 300);
    }

    updateQuantity(productId, action) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
        }

        this.updateCartDisplay();
    }

    removeFromCart(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.updateCartDisplay();
            this.showToast(`${item.name} removed from cart`, 'info');
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const cartCount = document.getElementById('cartCount');
        const emptyCart = document.getElementById('emptyCart');

        // Update cart count
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCount) cartCount.textContent = totalItems;

        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'flex';
            if (cartSummary) cartSummary.style.display = 'none';
            if (cartItems) cartItems.innerHTML = '';
            this.total = 0;
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'block';

        // Render cart items
        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || '/placeholder.jpg'}" alt="${item.name}" />
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-product-id="${item.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" data-action="increase" data-product-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                        <button class="remove-item" data-product-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Calculate totals with better error handling
        try {
            const subtotal = this.cart.reduce((sum, item) => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 0;
                return sum + (itemPrice * itemQuantity);
            }, 0);
            
            // Tax calculation (8%)
            const taxRate = 0.08;
            const tax = subtotal * taxRate;
            
            // Shipping calculation - Free shipping over $50, otherwise $9.99
            const freeShippingThreshold = 50;
            const standardShipping = 9.99;
            const shipping = subtotal >= freeShippingThreshold ? 0 : standardShipping;
            
            // Total calculation
            this.total = subtotal + tax + shipping;

            // Update display elements with error checking
            const subtotalElement = document.getElementById('subtotal');
            const taxElement = document.getElementById('tax');
            const shippingElement = document.getElementById('shipping');
            const totalElement = document.getElementById('total');

            if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
            if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
            if (shippingElement) {
                shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
            }
            if (totalElement) totalElement.textContent = `$${this.total.toFixed(2)}`;

            // Debug logging
            console.log('💰 Cart Calculation Update:', {
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                shipping: shipping.toFixed(2),
                total: this.total.toFixed(2),
                itemCount: this.cart.length
            });

        } catch (error) {
            console.error('❌ Error calculating cart totals:', error);
            // Set fallback values
            this.total = 0;
            const totalElement = document.getElementById('total');
            if (totalElement) totalElement.textContent = '$0.00';
        }
    }

    // Test cart calculation manually
    testCartCalculation() {
        console.log('🧪 Testing cart calculation...');
        
        // Add test items to cart
        this.addToCart({
            id: 'test-1',
            name: 'Test Product 1',
            price: 25.99,
            image: '/test-image.jpg'
        });
        
        this.addToCart({
            id: 'test-2', 
            name: 'Test Product 2',
            price: 35.00,
            image: '/test-image2.jpg'
        });
        
        console.log('Cart after test items:', this.cart);
    }

    // Integration with FitPrint cart updates
    handleFitPrintCartUpdate(cartData) {
        console.log('🛒 FitPrint cart update received:', cartData);
        
        try {
            // Clear existing cart
            this.cart = [];
            
            // Process FitPrint cart data
            if (cartData && cartData.items && Array.isArray(cartData.items)) {
                cartData.items.forEach(item => {
                    this.cart.push({
                        id: item.id || `fitprint-${Date.now()}-${Math.random()}`,
                        name: item.name || item.title || 'Custom Product',
                        price: parseFloat(item.price) || 0,
                        quantity: parseInt(item.quantity) || 1,
                        image: item.image || item.thumbnail || '/placeholder.jpg',
                        source: 'fitprint'
                    });
                });
            } else if (cartData && cartData.total) {
                // If we only have total, create a generic item
                this.cart.push({
                    id: `fitprint-order-${Date.now()}`,
                    name: 'FitPrint Custom Order',
                    price: parseFloat(cartData.total) || 0,
                    quantity: 1,
                    image: '/placeholder.jpg',
                    source: 'fitprint'
                });
            }
            
            // Update display
            this.updateCartDisplay();
            
            console.log('✅ Cart updated from FitPrint:', this.cart);
            
        } catch (error) {
            console.error('❌ Error processing FitPrint cart update:', error);
        }
    }

    // Create payment request with QR code generation
    async initiatePayment() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty', 'error');
            return;
        }

        try {
            // Track checkout initiation
            await this.trackUserSession({
                event: 'checkout_initiated',
                eventData: { 
                    cartItems: this.cart.length, 
                    cartTotal: this.total 
                }
            });

            this.openPaymentModal();
            this.showPaymentStep(1);
            
            // Show loading state
            document.getElementById('qrLoading').style.display = 'flex';
            document.getElementById('qrCode').style.display = 'none';

            // Create order first
            const orderData = await this.createOrder();
            if (!orderData.success) {
                throw new Error('Failed to create order');
            }

            this.currentOrderId = orderData.order.id;

            // Create payment request
            const paymentResponse = await this.createPaymentRequest();
            
            if (paymentResponse.success) {
                this.currentPaymentRequest = paymentResponse;
                
                // Generate QR code
                await this.generateQRCode(paymentResponse.url);
                
                // Update payment details
                document.getElementById('paymentAmount').textContent = `$${this.total.toFixed(2)}`;
                document.getElementById('solAmount').textContent = `${paymentResponse.amount.toFixed(4)} SOL`;
                
                // Hide loading, show QR
                document.getElementById('qrLoading').style.display = 'none';
                document.getElementById('qrCode').style.display = 'block';
                
                // Start monitoring transaction
                this.monitorTransaction(paymentResponse.paymentId);
            } else {
                throw new Error(paymentResponse.message || 'Failed to create payment request');
            }
            
        } catch (error) {
            console.error('Payment initiation failed:', error);
            this.showToast('Failed to initiate payment', 'error');
            this.closePaymentModal();
        }
    }

    async createOrder() {
        try {
            const orderData = {
                customerInfo: {
                    email: this.getCustomerEmail(),
                    name: this.getCustomerName() || 'Guest Customer'
                },
                items: this.cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                paymentToken: this.getSelectedPaymentToken() || 'SOL',
                sessionId: this.sessionId
            };

            const response = await this.api.createOrder(orderData);
            console.log('Order created:', response);
            return response;
        } catch (error) {
            console.error('Order creation failed:', error);
            return { success: false, message: error.message };
        }
    }

    getCustomerEmail() {
        // Try to get from form, localStorage, or use default
        return localStorage.getItem('customer_email') || 
               document.getElementById('customerEmail')?.value || 
               'guest@example.com';
    }

    getCustomerName() {
        return localStorage.getItem('customer_name') || 
               document.getElementById('customerName')?.value || 
               'Guest Customer';
    }

    getSelectedPaymentToken() {
        const selectedToken = document.querySelector('input[name="paymentToken"]:checked');
        return selectedToken ? selectedToken.value : 'SOL';
    }

    async createPaymentRequest() {
        try {
            this.loading.show('paymentLoader', 'Creating payment request...');
            
            const cartItems = this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                printifyId: item.printifyId || item.id // For Printify integration
            }));

            const paymentData = await this.api.createPayment(cartItems, this.total, 'USD');
            
            console.log('Payment request created:', paymentData);
            return { success: true, ...paymentData };
            
        } catch (error) {
            console.error('Error creating payment request:', error);
            ErrorHandler.show(error);
            return { success: false, message: error.message };
        } finally {
            this.loading.hide('paymentLoader');
        }
    }

    async generateQRCode(paymentUrl) {
        try {
            const qrContainer = document.getElementById('qrCode');
            
            // Clear previous QR code
            qrContainer.innerHTML = '';
            
            // Generate QR code using QRCode.js
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, paymentUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            qrContainer.appendChild(canvas);
            
        } catch (error) {
            console.error('QR code generation failed:', error);
            throw error;
        }
    }

    // Monitor transaction status with polling
    async monitorTransaction(paymentId) {
        this.showPaymentStep(2);
        
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/payment/status/${paymentId}`);
                const data = await response.json();
                
                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    this.handlePaymentSuccess(data);
                } else if (data.status === 'expired' || data.status === 'failed') {
                    clearInterval(pollInterval);
                    this.handlePaymentFailure(data);
                }
            } catch (error) {
                console.error('Error monitoring transaction:', error);
            }
        }, 2000); // Poll every 2 seconds
        
        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            this.handlePaymentTimeout();
        }, 300000);
    }

    handlePaymentSuccess(paymentData) {
        this.showPaymentStep(3);
        
        // Update success details
        document.getElementById('transactionId').textContent = paymentData.signature || 'N/A';
        document.getElementById('orderId').textContent = paymentData.paymentId.slice(0, 8).toUpperCase();
        
        // Clear cart
        this.cart = [];
        this.updateCartDisplay();
        
        this.showToast('Payment successful! Thank you for your purchase.', 'success');
    }

    handlePaymentFailure(paymentData) {
        this.showToast('Payment failed. Please try again.', 'error');
        this.closePaymentModal();
    }

    handlePaymentTimeout() {
        this.showToast('Payment timeout. Please try again.', 'error');
        this.closePaymentModal();
    }

    // UI Helper Methods
    filterProducts(filter) {
        if (filter === 'all') {
            this.displayProducts();
        } else {
            const filtered = this.products.filter(product => product.category === filter);
            this.displayProducts(filtered);
        }
    }

    sortProducts(sortType) {
        let sorted = [...this.products];
        
        switch (sortType) {
            case 'price-low':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }
        
        this.displayProducts(sorted);
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.toggle('open');
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.remove('open');
    }

    openPaymentModal() {
        document.getElementById('paymentModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentPaymentRequest = null;
    }

    openWalletModal() {
        document.getElementById('walletModal').classList.add('active');
    }

    closeWalletModal() {
        document.getElementById('walletModal').classList.remove('active');
    }

    closeAllModals() {
        this.closePaymentModal();
        this.closeWalletModal();
    }

    showPaymentStep(step) {
        document.querySelectorAll('.payment-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step${step}`).classList.add('active');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        }[type] || 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toastContainer.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shop = new SolanaPayShop();
    
    // Setup test buttons for debugging cart functionality
    setupTestButtons();
});

// Setup test buttons for debugging cart functionality
function setupTestButtons() {
    const testCartBtn = document.getElementById('testCartBtn');
    const testFitPrintBtn = document.getElementById('testFitPrintBtn');
    
    if (testCartBtn) {
        testCartBtn.addEventListener('click', () => {
            console.log('🧪 Testing cart with sample item ($25)...');
            // Add a test item to cart
            if (window.shop) {
                // Add a test product to cart
                const testProduct = {
                    id: 999,
                    name: 'Test Product',
                    price: 25.00,
                    category: 'test',
                    image: 'https://via.placeholder.com/150',
                    description: 'Test product for cart calculation'
                };
                
                window.shop.addToCart(testProduct);
                window.shop.testCartCalculation();
            }
        });
    }
    
    if (testFitPrintBtn) {
        testFitPrintBtn.addEventListener('click', () => {
            console.log('🧪 Testing FitPrint integration...');
            // Test FitPrint integration
            if (window.testFitPrintIntegration) {
                window.testFitPrintIntegration();
            } else {
                console.error('❌ FitPrint test function not available');
            }
        });
    }
}
