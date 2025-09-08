// API Service for Solana Pay Shop Frontend
class ApiService {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
        this.requestTimeout = 10000; // 10 seconds
        this.mockMode = false; // Will be set to true if server is unreachable
        this.mockData = {
            products: [
                {
                    id: 1,
                    name: "Custom T-Shirt Premium",
                    title: "Custom T-Shirt Premium", 
                    price: 29.99,
                    description: "High-quality cotton t-shirt with custom design print",
                    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"],
                    category: "Apparel",
                    tags: ["apparel", "shirts", "custom"],
                    is_available: true,
                    is_published: true,
                    inventory_count: 100,
                    base_price: 19.99,
                    markup_percentage: 50
                },
                {
                    id: 2,
                    name: "Ceramic Coffee Mug", 
                    title: "Ceramic Coffee Mug",
                    price: 14.99,
                    description: "Durable ceramic coffee mug with personalized artwork",
                    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop",
                    images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop"],
                    category: "Drinkware",
                    tags: ["accessories", "drinkware", "mugs"],
                    is_available: true,
                    is_published: true,
                    inventory_count: 50,
                    base_price: 9.99,
                    markup_percentage: 50
                },
                {
                    id: 3,
                    name: "Premium Phone Case",
                    title: "Premium Phone Case", 
                    price: 19.99,
                    description: "Protective phone case with custom artwork design",
                    image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop",
                    images: ["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop"],
                    category: "Accessories",
                    tags: ["accessories", "phone", "cases"],
                    is_available: true,
                    is_published: true,
                    inventory_count: 75,
                    base_price: 12.99,
                    markup_percentage: 54
                }
            ]
        };
    }

    async request(endpoint, options = {}) {
        // Check if we should use mock mode
        if (this.mockMode) {
            return this.handleMockRequest(endpoint, options);
        }

        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.requestTimeout,
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Response: ${response.status}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
            
            // Enable mock mode if server is unreachable
            if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                console.warn('🔄 Server unreachable, switching to mock mode');
                this.mockMode = true;
                return this.handleMockRequest(endpoint, options);
            }
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check your connection');
            }
            
            throw new Error(`Failed to ${options.method || 'fetch'} ${endpoint}: ${error.message}`);
        }
    }

    // Product endpoints
    async getProducts(page = 1, limit = 20, category = null) {
        let endpoint = `/products?page=${page}&limit=${limit}`;
        if (category && category !== 'All') {
            endpoint += `&category=${encodeURIComponent(category)}`;
        }
        const response = await this.request(endpoint);
        
        // Handle your backend's response structure
        if (response && response.success && response.products) {
            return {
                products: response.products.map(product => ({
                    id: product.id,
                    name: product.title, // Map title to name for frontend compatibility
                    title: product.title,
                    price: product.selling_price,
                    description: product.description,
                    image: product.images ? JSON.parse(product.images)[0] : 'https://via.placeholder.com/300x300/9945FF/FFFFFF?text=Product',
                    images: product.images ? JSON.parse(product.images) : [],
                    category: product.category,
                    tags: product.tags ? JSON.parse(product.tags) : [],
                    is_available: product.is_available,
                    is_published: product.is_published,
                    inventory_count: product.inventory_count,
                    base_price: product.base_price,
                    markup_percentage: product.markup_percentage,
                    printify_product_id: product.printify_product_id
                })),
                pagination: response.pagination,
                total: response.pagination?.total || response.products.length
            };
        }
        
        return response;
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async getCategories() {
        return this.request('/products/categories/list');
    }

    async searchProducts(query) {
        return this.request(`/products/search?q=${encodeURIComponent(query)}`);
    }

    // Payment endpoints
    async createPayment(items, total, currency = 'USD', paymentToken = 'SOL') {
        return this.request('/payment/create-payment', {
            method: 'POST',
            body: JSON.stringify({ items, total, currency, paymentToken })
        });
    }

    async verifyPayment(paymentId, signature) {
        return this.request('/payment/verify-payment', {
            method: 'POST',
            body: JSON.stringify({ paymentId, signature })
        });
    }

    async getOrderStatus(paymentId) {
        return this.request(`/payment/order-status/${paymentId}`);
    }

    // SPL Token endpoints
    async getSupportedTokens() {
        return this.request('/payment/tokens');
    }

    async calculateTokenAmount(usdAmount, tokenSymbol) {
        return this.request('/payment/calculate', {
            method: 'POST',
            body: JSON.stringify({ usdAmount, tokenSymbol })
        });
    }

    async getTokenPrices() {
        return this.request('/payment/tokens');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Connection test
    async testConnection() {
        try {
            await this.healthCheck();
            return { success: true, message: 'API connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Add mock request handler to ApiService
ApiService.prototype.handleMockRequest = function(endpoint, options = {}) {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            console.log(`🎭 Mock API Request: ${options.method || 'GET'} ${endpoint}`);
            
            if (endpoint === '/products' || endpoint === '/products/') {
                resolve({
                    success: true,
                    products: this.mockData.products
                });
            } else if (endpoint.startsWith('/payment/create')) {
                const requestBody = options.body ? JSON.parse(options.body) : {};
                const paymentToken = requestBody.paymentToken || 'SOL';
                const total = requestBody.total || 25.99;
                
                resolve({
                    success: true,
                    paymentId: 'mock_payment_' + Date.now(),
                    reference: 'mock_ref_' + Date.now(),
                    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                    amount: paymentToken === 'SOL' ? (total / 20).toFixed(9) : total.toFixed(6),
                    tokenAmount: paymentToken === 'SOL' ? Math.ceil(total / 20 * 1e9) : Math.ceil(total * 1e6),
                    paymentToken,
                    currency: paymentToken,
                    usdTotal: total,
                    recipient: 'mockRecipient123',
                    memo: 'Mock payment for testing'
                });
            } else if (endpoint === '/payment/tokens') {
                resolve({
                    success: true,
                    tokens: [
                        {
                            symbol: 'SOL',
                            name: 'Solana',
                            decimals: 9,
                            icon: '⚡',
                            isNative: true,
                            currentPrice: 20.00
                        },
                        {
                            symbol: 'USDC',
                            name: 'USD Coin',
                            decimals: 6,
                            icon: '💵',
                            isNative: false,
                            currentPrice: 1.00
                        },
                        {
                            symbol: 'USDT',
                            name: 'Tether USD',
                            decimals: 6,
                            icon: '💰',
                            isNative: false,
                            currentPrice: 1.00
                        }
                    ],
                    prices: {
                        SOL: 20.00,
                        USDC: 1.00,
                        USDT: 1.00,
                        lastUpdated: new Date().toISOString()
                    }
                });
            } else if (endpoint.startsWith('/payment/calculate')) {
                const requestBody = options.body ? JSON.parse(options.body) : {};
                const usdAmount = requestBody.usdAmount || 25.99;
                const tokenSymbol = requestBody.tokenSymbol || 'SOL';
                const prices = { SOL: 20.00, USDC: 1.00, USDT: 1.00 };
                const decimals = { SOL: 9, USDC: 6, USDT: 6 };
                
                const tokenAmount = usdAmount / prices[tokenSymbol];
                const amountWithDecimals = Math.ceil(tokenAmount * Math.pow(10, decimals[tokenSymbol]));
                
                resolve({
                    success: true,
                    amount: amountWithDecimals,
                    displayAmount: tokenAmount.toFixed(decimals[tokenSymbol]),
                    decimals: decimals[tokenSymbol],
                    token: {
                        symbol: tokenSymbol,
                        name: tokenSymbol === 'SOL' ? 'Solana' : tokenSymbol === 'USDC' ? 'USD Coin' : 'Tether USD',
                        decimals: decimals[tokenSymbol]
                    }
                });
            } else if (endpoint.startsWith('/payment/verify')) {
                resolve({
                    success: true,
                    status: 'confirmed',
                    signature: 'mockSignature123',
                    timestamp: new Date().toISOString()
                });
            } else if (endpoint.startsWith('/orders/')) {
                resolve({
                    success: true,
                    order: {
                        id: 'mock_order_123',
                        status: 'processing',
                        items: this.mockData.products.slice(0, 1),
                        total: 25.99,
                        timestamp: new Date().toISOString()
                    }
                });
            } else if (endpoint.startsWith('/analytics/')) {
                resolve({
                    success: true,
                    data: this.getMockAnalyticsData(endpoint)
                });
            } else {
                resolve({
                    success: true,
                    message: 'Mock API response',
                    data: {}
                });
            }
        }, 500 + Math.random() * 1000); // Random delay 500-1500ms
        });
    };

ApiService.prototype.getMockAnalyticsData = function(endpoint) {
    if (endpoint.includes('dashboard')) {
        return {
            overview: {
                totalRevenue: 15847.32,
                totalOrders: 127,
                averageOrderValue: 124.78,
                paymentSuccessRate: 94.5,
                totalPaymentAttempts: 142
            },
            paymentMetrics: {
                successRate: 94.5,
                tokenBreakdown: {
                    SOL: { successRate: 96.2, attempts: 85, successes: 82 },
                    USDC: { successRate: 92.1, attempts: 38, successes: 35 },
                    USDT: { successRate: 89.5, attempts: 19, successes: 17 }
                }
            }
        };
    }
    return {};
}

// Order Management Methods
ApiService.prototype.createOrder = async function(orderData) {
    return this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
};

ApiService.prototype.getOrder = async function(orderId) {
    return this.request(`/orders/${orderId}`);
};

ApiService.prototype.updateOrderStatus = async function(orderId, status, notes = '') {
    return this.request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
    });
};

ApiService.prototype.getCustomerOrders = async function(email, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/orders/customer/${email}?${params}`);
};

ApiService.prototype.searchOrders = async function(criteria, options = {}) {
    const params = new URLSearchParams({ ...criteria, ...options });
    return this.request(`/orders/search?${params}`);
};

ApiService.prototype.processOrderPayment = async function(orderId, paymentData) {
    return this.request(`/orders/${orderId}/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
    });
};

// Analytics Methods
ApiService.prototype.getAnalyticsDashboard = async function(timeframe = '30d') {
    return this.request(`/analytics/dashboard?timeframe=${timeframe}`);
};

ApiService.prototype.getPaymentSuccessRate = async function(timeframe = '30d') {
    return this.request(`/analytics/payment-success-rate?timeframe=${timeframe}`);
};

ApiService.prototype.getPopularProducts = async function(timeframe = '30d', limit = 10) {
    return this.request(`/analytics/popular-products?timeframe=${timeframe}&limit=${limit}`);
};

ApiService.prototype.getRevenueTracking = async function(timeframe = '30d', groupBy = 'day') {
    return this.request(`/analytics/revenue?timeframe=${timeframe}&groupBy=${groupBy}`);
};

ApiService.prototype.getConversionFunnel = async function(timeframe = '30d') {
    return this.request(`/analytics/conversion-funnel?timeframe=${timeframe}`);
};

ApiService.prototype.trackProductView = async function(productId, productName, sessionId = 'anonymous') {
    return this.request(`/analytics/track/product-view?productId=${productId}&productName=${encodeURIComponent(productName)}&sessionId=${sessionId}`, {
        method: 'POST'
    });
};

ApiService.prototype.trackUserSession = async function(sessionData) {
    return this.request('/analytics/track/session', {
        method: 'POST',
        body: JSON.stringify(sessionData)
    });
};

// Loading state manager
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    show(loaderId, message = 'Loading...') {
        this.activeLoaders.add(loaderId);
        this.updateUI(loaderId, true, message);
        this.updateGlobalLoader();
    }

    hide(loaderId) {
        this.activeLoaders.delete(loaderId);
        this.updateUI(loaderId, false);
        this.updateGlobalLoader();
    }

    updateUI(loaderId, isLoading, message = '') {
        const element = document.getElementById(loaderId);
        if (element) {
            if (isLoading) {
                element.classList.add('loading');
                element.disabled = true;
                
                // Add loading spinner if it's a button
                if (element.tagName === 'BUTTON') {
                    const originalContent = element.innerHTML;
                    element.dataset.originalContent = originalContent;
                    element.innerHTML = `
                        <i class="fas fa-spinner fa-spin"></i>
                        ${message}
                    `;
                }
            } else {
                element.classList.remove('loading');
                element.disabled = false;
                
                // Restore original content for buttons
                if (element.tagName === 'BUTTON' && element.dataset.originalContent) {
                    element.innerHTML = element.dataset.originalContent;
                    delete element.dataset.originalContent;
                }
            }
        }
    }

    updateGlobalLoader() {
        const globalLoader = document.getElementById('globalLoader');
        if (globalLoader) {
            if (this.activeLoaders.size > 0) {
                globalLoader.style.display = 'flex';
            } else {
                globalLoader.style.display = 'none';
            }
        }
    }

    isLoading(loaderId = null) {
        if (loaderId) {
            return this.activeLoaders.has(loaderId);
        }
        return this.activeLoaders.size > 0;
    }
}

// Error handler
class ErrorHandler {
    static show(error, duration = 5000) {
        console.error('Error:', error);
        
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) {
            console.error('Error container not found');
            return;
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message fade-in';
        errorElement.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${error.message || error}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        errorContainer.appendChild(errorElement);

        // Auto-remove after duration
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.classList.add('fade-out');
                setTimeout(() => {
                    if (errorElement.parentNode) {
                        errorElement.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    static clear() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }
}

// Add mock request handler to ApiService
ApiService.prototype.handleMockRequest = function(endpoint, options = {}) {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            console.log(`🎭 Mock API Request: ${options.method || 'GET'} ${endpoint}`);
            
            if (endpoint === '/products' || endpoint === '/products/') {
                resolve({
                    success: true,
                    products: this.mockData.products
                });
            } else if (endpoint.startsWith('/payment/create')) {
                const requestBody = options.body ? JSON.parse(options.body) : {};
                const paymentToken = requestBody.paymentToken || 'SOL';
                const total = requestBody.total || 25.99;
                
                resolve({
                    success: true,
                    paymentId: 'mock_payment_' + Date.now(),
                    reference: 'mock_ref_' + Date.now(),
                    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                    amount: paymentToken === 'SOL' ? (total / 20).toFixed(9) : total.toFixed(6),
                    tokenAmount: paymentToken === 'SOL' ? Math.ceil(total / 20 * 1e9) : Math.ceil(total * 1e6),
                    paymentToken,
                    currency: paymentToken,
                    usdTotal: total,
                    recipient: 'mockRecipient123',
                    memo: 'Mock payment for testing'
                });
            } else if (endpoint === '/payment/tokens') {
                resolve({
                    success: true,
                    tokens: [
                        {
                            symbol: 'SOL',
                            name: 'Solana',
                            decimals: 9,
                            icon: '⚡',
                            isNative: true,
                            currentPrice: 20.00
                        },
                        {
                            symbol: 'USDC',
                            name: 'USD Coin',
                            decimals: 6,
                            icon: '💵',
                            isNative: false,
                            currentPrice: 1.00
                        },
                        {
                            symbol: 'USDT',
                            name: 'Tether USD',
                            decimals: 6,
                            icon: '💰',
                            isNative: false,
                            currentPrice: 1.00
                        }
                    ],
                    prices: {
                        SOL: 20.00,
                        USDC: 1.00,
                        USDT: 1.00,
                        lastUpdated: new Date().toISOString()
                    }
                });
            } else if (endpoint.startsWith('/payment/calculate')) {
                const requestBody = options.body ? JSON.parse(options.body) : {};
                const usdAmount = requestBody.usdAmount || 25.99;
                const tokenSymbol = requestBody.tokenSymbol || 'SOL';
                const prices = { SOL: 20.00, USDC: 1.00, USDT: 1.00 };
                const decimals = { SOL: 9, USDC: 6, USDT: 6 };
                
                const tokenAmount = usdAmount / prices[tokenSymbol];
                const amountWithDecimals = Math.ceil(tokenAmount * Math.pow(10, decimals[tokenSymbol]));
                
                resolve({
                    success: true,
                    amount: amountWithDecimals,
                    displayAmount: tokenAmount.toFixed(decimals[tokenSymbol]),
                    decimals: decimals[tokenSymbol],
                    token: {
                        symbol: tokenSymbol,
                        name: tokenSymbol === 'SOL' ? 'Solana' : tokenSymbol === 'USDC' ? 'USD Coin' : 'Tether USD',
                        decimals: decimals[tokenSymbol]
                    }
                });
            } else if (endpoint.startsWith('/payment/verify')) {
                resolve({
                    success: true,
                    status: 'confirmed',
                    signature: 'mockSignature123',
                    timestamp: new Date().toISOString()
                });
            } else if (endpoint.startsWith('/orders/')) {
                resolve({
                    success: true,
                    order: {
                        id: 'mock_order_123',
                        status: 'processing',
                        items: this.mockData.products.slice(0, 1),
                        total: 25.99,
                        timestamp: new Date().toISOString()
                    }
                });
            } else if (endpoint.startsWith('/analytics/')) {
                resolve({
                    success: true,
                    data: this.getMockAnalyticsData(endpoint)
                });
            } else {
                resolve({
                    success: true,
                    message: 'Mock API response',
                    data: {}
                });
            }
        }, 500 + Math.random() * 1000); // Random delay 500-1500ms
        });
    };
    
    ApiService.prototype.getMockAnalyticsData = function(endpoint) {
        if (endpoint.includes('dashboard')) {
            return {
                overview: {
                    totalRevenue: 15847.32,
                    totalOrders: 127,
                    averageOrderValue: 124.78,
                    paymentSuccessRate: 94.5,
                    totalPaymentAttempts: 142
                },
                paymentMetrics: {
                    successRate: 94.5,
                    tokenBreakdown: {
                        SOL: { successRate: 96.2, attempts: 85, successes: 82 },
                        USDC: { successRate: 92.1, attempts: 38, successes: 35 },
                        USDT: { successRate: 89.5, attempts: 19, successes: 17 }
                    }
                }
            };
        }
        return {};
    };

    // Order Management Methods
    ApiService.prototype.createOrder = async function(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    };

    ApiService.prototype.getOrder = async function(orderId) {
        return this.request(`/orders/${orderId}`);
    };

    ApiService.prototype.updateOrderStatus = async function(orderId, status, notes = '') {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    };

    ApiService.prototype.getCustomerOrders = async function(email, options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/orders/customer/${email}?${params}`);
    };

    ApiService.prototype.searchOrders = async function(criteria, options = {}) {
        const params = new URLSearchParams({ ...criteria, ...options });
        return this.request(`/orders/search?${params}`);
    };

    ApiService.prototype.processOrderPayment = async function(orderId, paymentData) {
        return this.request(`/orders/${orderId}/payment`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    };

    // Analytics Methods
    ApiService.prototype.getAnalyticsDashboard = async function(timeframe = '30d') {
        return this.request(`/analytics/dashboard?timeframe=${timeframe}`);
    };

    ApiService.prototype.getPaymentSuccessRate = async function(timeframe = '30d') {
        return this.request(`/analytics/payment-success-rate?timeframe=${timeframe}`);
    };

    ApiService.prototype.getPopularProducts = async function(timeframe = '30d', limit = 10) {
        return this.request(`/analytics/popular-products?timeframe=${timeframe}&limit=${limit}`);
    };

    ApiService.prototype.getRevenueTracking = async function(timeframe = '30d', groupBy = 'day') {
        return this.request(`/analytics/revenue?timeframe=${timeframe}&groupBy=${groupBy}`);
    };

    ApiService.prototype.getConversionFunnel = async function(timeframe = '30d') {
        return this.request(`/analytics/conversion-funnel?timeframe=${timeframe}`);
    };

    ApiService.prototype.trackProductView = async function(productId, productName, sessionId = 'anonymous') {
        return this.request(`/analytics/track/product-view?productId=${productId}&productName=${encodeURIComponent(productName)}&sessionId=${sessionId}`, {
            method: 'POST'
        });
    };

    ApiService.prototype.trackUserSession = async function(sessionData) {
        return this.request('/analytics/track/session', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    };

// Export for use in main script
window.ApiService = ApiService;
window.LoadingManager = LoadingManager;
window.ErrorHandler = ErrorHandler;
