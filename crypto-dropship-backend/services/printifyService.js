const axios = require('axios');
const rateLimit = require('express-rate-limit');

/**
 * Printify API Service
 * 
 * Official API Documentation: https://developers.printify.com/
 * Rate Limits:
 * - Global: 600 requests per minute
 * - Catalog: 100 requests per minute
 * - Product Publishing: 200 requests per 30 minutes
 * 
 * Compliance with Printify Terms:
 * - https://printify.com/terms-of-service/
 * - https://printify.com/API-terms/
 */
class PrintifyService {
    constructor() {
        this.baseURL = 'https://api.printify.com/v1';
        this.token = process.env.PRINTIFY_API_TOKEN;
        this.shopId = process.env.PRINTIFY_SHOP_ID || 'auto_detect';
        
        // Rate limiting tracking
        this.requestCount = 0;
        this.catalogRequestCount = 0;
        this.publishRequestCount = 0;
        this.lastMinuteReset = Date.now();
        this.lastPublishReset = Date.now();
        
        // Error tracking for 5% limit compliance
        this.totalRequests = 0;
        this.errorRequests = 0;
        
        if (!this.token) {
            throw new Error('PRINTIFY_API_TOKEN is required. Please check your .env file.');
        }

        // Create axios instance with proper configuration
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Crypto-Dropship-Store/1.0', // Required by Printify API
                'Accept': 'application/json'
            }
        });

        this.setupInterceptors();
    }

    /**
     * Setup request/response interceptors for rate limiting and error tracking
     */
    setupInterceptors() {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                this.checkRateLimit(config);
                console.log(`🔌 Printify API Request: ${config.method?.toUpperCase()} ${config.url}`);
                this.totalRequests++;
                return config;
            },
            (error) => {
                console.error('❌ Printify API Request Error:', error.message);
                this.errorRequests++;
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => {
                console.log(`✅ Printify API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.errorRequests++;
                
                // Check error rate compliance (must be < 5%)
                const errorRate = (this.errorRequests / this.totalRequests) * 100;
                if (errorRate >= 5) {
                    console.warn(`⚠️ Error rate too high: ${errorRate.toFixed(2)}% (limit: 5%)`);
                }

                console.error('❌ Printify API Error:', {
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message,
                    url: error.config?.url
                });

                // Handle specific error codes
                if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Check rate limits before making requests
     */
    checkRateLimit(config) {
        const now = Date.now();
        
        // Reset counters every minute
        if (now - this.lastMinuteReset > 60000) {
            this.requestCount = 0;
            this.catalogRequestCount = 0;
            this.lastMinuteReset = now;
        }

        // Reset publish counter every 30 minutes
        if (now - this.lastPublishReset > 1800000) { // 30 minutes
            this.publishRequestCount = 0;
            this.lastPublishReset = now;
        }

        // Check global rate limit (600 requests per minute)
        if (this.requestCount >= 600) {
            throw new Error('Global rate limit exceeded (600 requests/minute)');
        }

        // Check catalog rate limit (100 requests per minute)
        if (config.url.includes('/catalog/') && this.catalogRequestCount >= 100) {
            throw new Error('Catalog rate limit exceeded (100 requests/minute)');
        }

        // Check product publishing rate limit (200 requests per 30 minutes)
        if (config.url.includes('/products') && config.method === 'post' && this.publishRequestCount >= 200) {
            throw new Error('Product publishing rate limit exceeded (200 requests/30 minutes)');
        }

        // Increment counters
        this.requestCount++;
        if (config.url.includes('/catalog/')) {
            this.catalogRequestCount++;
        }
        if (config.url.includes('/products') && config.method === 'post') {
            this.publishRequestCount++;
        }
    }

    /**
     * Auto-detect shop ID if not provided
     */
    async autoDetectShopId() {
        if (this.shopId && this.shopId !== 'auto_detect') {
            return this.shopId;
        }

        try {
            const shops = await this.getShops();
            if (shops.length > 0) {
                this.shopId = shops[0].id;
                console.log(`✅ Auto-detected Printify shop ID: ${this.shopId}`);
                return this.shopId;
            } else {
                throw new Error('No shops found in your Printify account');
            }
        } catch (error) {
            throw new Error(`Failed to auto-detect shop ID: ${error.message}`);
        }
    }

    /**
     * Get all shops associated with the account
     */
    async getShops() {
        try {
            const response = await this.api.get('/shops.json');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch shops: ${error.message}`);
        }
    }

    /**
     * Get catalog blueprints
     */
    async getCatalogBlueprints() {
        try {
            const response = await this.api.get('/catalog/blueprints.json');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch catalog blueprints: ${error.message}`);
        }
    }

    /**
     * Get products from your Printify shop
     * @param {Object} options - Query options
     */
    async getProducts(options = {}) {
        try {
            await this.autoDetectShopId();
            
            const params = {
                page: options.page || 1,
                limit: Math.min(options.limit || 25, 100), // Max 100 per request
                ...options.filters
            };

            const response = await this.api.get(`/shops/${this.shopId}/products.json`, { params });
            
            return {
                products: response.data.data?.map(product => this.transformProduct(product)) || [],
                meta: {
                    total: response.data.total || 0,
                    page: response.data.current_page || params.page,
                    pages: response.data.last_page || 1,
                    per_page: response.data.per_page || params.limit
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch products: ${error.message}`);
        }
    }

    /**
     * Get a single product by ID
     */
    async getProduct(productId) {
        try {
            await this.autoDetectShopId();
            const response = await this.api.get(`/shops/${this.shopId}/products/${productId}.json`);
            return this.transformProduct(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch product ${productId}: ${error.message}`);
        }
    }

    /**
     * Create a new product
     * @param {Object} productData - Product data
     */
    async createProduct(productData) {
        try {
            await this.autoDetectShopId();
            const response = await this.api.post(`/shops/${this.shopId}/products.json`, productData);
            return this.transformProduct(response.data);
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    /**
     * Create an order
     * @param {Object} orderData - Order data
     */
    async createOrder(orderData) {
        try {
            await this.autoDetectShopId();
            const printifyOrder = this.transformOrderToPrintify(orderData);
            const response = await this.api.post(`/shops/${this.shopId}/orders.json`, printifyOrder);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    /**
     * Get orders from your shop
     */
    async getOrders(options = {}) {
        try {
            await this.autoDetectShopId();
            
            const params = {
                page: options.page || 1,
                limit: Math.min(options.limit || 25, 100),
                ...options.filters
            };

            const response = await this.api.get(`/shops/${this.shopId}/orders.json`, { params });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
    }

    /**
     * Transform Printify product to internal format
     */
    transformProduct(printifyProduct) {
        if (!printifyProduct) return null;

        return {
            id: printifyProduct.id,
            title: printifyProduct.title,
            description: printifyProduct.description || '',
            tags: printifyProduct.tags || [],
            images: printifyProduct.images?.map(img => img.src) || [],
            variants: printifyProduct.variants || [],
            is_available: printifyProduct.visible === true,
            is_published: printifyProduct.is_published === true,
            blueprint_id: printifyProduct.blueprint_id,
            print_provider_id: printifyProduct.print_provider_id,
            created_at: printifyProduct.created_at,
            updated_at: printifyProduct.updated_at,
            // Calculate pricing
            base_price: this.calculateBasePrice(printifyProduct.variants),
            selling_price: this.calculateSellingPrice(printifyProduct.variants),
            printify_data: printifyProduct // Store original data
        };
    }

    /**
     * Calculate base price from variants
     */
    calculateBasePrice(variants = []) {
        if (!variants.length) return 0;
        return Math.min(...variants.map(v => v.price || 0));
    }

    /**
     * Calculate selling price with markup
     */
    calculateSellingPrice(variants = []) {
        const basePrice = this.calculateBasePrice(variants);
        const markupPercentage = 50; // 50% markup by default
        return basePrice * (1 + markupPercentage / 100);
    }

    /**
     * Transform order data to Printify format
     */
    transformOrderToPrintify(orderData) {
        return {
            external_id: orderData.external_id || `order_${Date.now()}`,
            label: orderData.label || 'Crypto Dropship Order',
            line_items: orderData.items.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                print_areas: item.print_areas || {}
            })),
            shipping_method: orderData.shipping_method || 1,
            send_shipping_notification: orderData.send_notification !== false,
            address_to: {
                first_name: orderData.shipping_address.first_name,
                last_name: orderData.shipping_address.last_name,
                email: orderData.shipping_address.email,
                phone: orderData.shipping_address.phone || '',
                country: orderData.shipping_address.country,
                region: orderData.shipping_address.region || '',
                address1: orderData.shipping_address.address1,
                address2: orderData.shipping_address.address2 || '',
                city: orderData.shipping_address.city,
                zip: orderData.shipping_address.zip
            }
        };
    }

    /**
     * Get API usage statistics
     */
    getUsageStats() {
        const errorRate = this.totalRequests > 0 ? (this.errorRequests / this.totalRequests) * 100 : 0;
        
        return {
            total_requests: this.totalRequests,
            error_requests: this.errorRequests,
            error_rate: `${errorRate.toFixed(2)}%`,
            current_minute_requests: this.requestCount,
            catalog_requests: this.catalogRequestCount,
            publish_requests: this.publishRequestCount,
            limits: {
                global: '600/minute',
                catalog: '100/minute',
                publishing: '200/30min',
                error_rate: '< 5%'
            },
            compliance: {
                global: this.requestCount < 600,
                catalog: this.catalogRequestCount < 100,
                publishing: this.publishRequestCount < 200,
                error_rate: errorRate < 5
            }
        };
    }
}

module.exports = PrintifyService;
