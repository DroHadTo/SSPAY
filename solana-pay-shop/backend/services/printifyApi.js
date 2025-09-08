const axios = require('axios');

class PrintifyApiService {
    constructor() {
        this.baseURL = 'https://api.printify.com/v1';
        this.token = process.env.PRINTIFY_TOKEN;
        this.shopId = process.env.PRINTIFY_SHOP_ID;
        
        // Create axios instance with default config
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Solana-Pay-Shop/1.0'
            },
            timeout: 30000 // 30 seconds timeout
        });

        // Add request/response interceptors for debugging
        this.api.interceptors.request.use(
            (config) => {
                console.log(`🔌 Printify API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Printify API Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response) => {
                console.log(`✅ Printify API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('❌ Printify API Response Error:', error.response?.status, error.response?.data);
                return Promise.reject(error);
            }
        );
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
     * Get products from the Printify store
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 100)
     */
    async getProducts(page = 1, limit = 100) {
        try {
            if (!this.shopId) {
                throw new Error('PRINTIFY_SHOP_ID not configured');
            }

            const response = await this.api.get(`/shops/${this.shopId}/products.json`, {
                params: { page, limit }
            });

            // Transform Printify products to our internal format
            const products = response.data.data?.map(product => this.transformProduct(product)) || [];
            
            return {
                products,
                total: response.data.total || 0,
                page: response.data.current_page || page,
                pages: response.data.last_page || 1
            };
        } catch (error) {
            console.error('Error fetching Printify products:', error);
            throw new Error(`Failed to fetch products: ${error.message}`);
        }
    }

    /**
     * Get a single product by ID
     * @param {string} productId - Printify product ID
     */
    async getProduct(productId) {
        try {
            if (!this.shopId) {
                throw new Error('PRINTIFY_SHOP_ID not configured');
            }

            const response = await this.api.get(`/shops/${this.shopId}/products/${productId}.json`);
            return this.transformProduct(response.data);
        } catch (error) {
            console.error(`Error fetching Printify product ${productId}:`, error);
            throw new Error(`Failed to fetch product: ${error.message}`);
        }
    }

    /**
     * Create an order in Printify
     * @param {Object} orderData - Order information
     */
    async createOrder(orderData) {
        try {
            if (!this.shopId) {
                throw new Error('PRINTIFY_SHOP_ID not configured');
            }

            const printifyOrder = this.transformOrderToPrintify(orderData);
            
            const response = await this.api.post(`/shops/${this.shopId}/orders.json`, printifyOrder);
            return response.data;
        } catch (error) {
            console.error('Error creating Printify order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    /**
     * Get order status from Printify
     * @param {string} orderId - Printify order ID
     */
    async getOrderStatus(orderId) {
        try {
            if (!this.shopId) {
                throw new Error('PRINTIFY_SHOP_ID not configured');
            }

            const response = await this.api.get(`/shops/${this.shopId}/orders/${orderId}.json`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching Printify order ${orderId}:`, error);
            throw new Error(`Failed to fetch order status: ${error.message}`);
        }
    }

    /**
     * Transform Printify product to our internal format
     * @param {Object} printifyProduct - Product from Printify API
     */
    transformProduct(printifyProduct) {
        const defaultVariant = printifyProduct.variants?.[0];
        const defaultImage = printifyProduct.images?.[0]?.src || 'https://via.placeholder.com/400x400?text=No+Image';
        
        return {
            id: printifyProduct.id.toString(),
            printifyId: printifyProduct.id,
            name: printifyProduct.title || 'Untitled Product',
            description: printifyProduct.description || 'No description available',
            price: defaultVariant ? (defaultVariant.price / 100) : 19.99, // Convert cents to dollars
            category: printifyProduct.tags?.[0] || 'General',
            image: defaultImage,
            images: printifyProduct.images?.map(img => img.src) || [defaultImage],
            variants: printifyProduct.variants?.map(variant => ({
                id: variant.id,
                title: variant.title,
                price: variant.price / 100, // Convert cents to dollars
                sku: variant.sku,
                available: variant.available || true
            })) || [],
            tags: printifyProduct.tags || [],
            blueprint_id: printifyProduct.blueprint_id,
            print_provider_id: printifyProduct.print_provider_id,
            published: printifyProduct.published || false,
            stock: 'in-stock', // Printify handles stock automatically
            rating: 4.5, // Default rating
            sales: Math.floor(Math.random() * 100) + 10 // Mock sales data
        };
    }

    /**
     * Transform our order format to Printify format
     * @param {Object} orderData - Internal order data
     */
    transformOrderToPrintify(orderData) {
        return {
            external_id: orderData.orderNumber || orderData.id,
            label: `Solana Pay Order - ${orderData.orderNumber || orderData.id}`,
            line_items: orderData.items.map(item => ({
                product_id: item.printifyId || item.id,
                variant_id: item.variantId || item.variants?.[0]?.id,
                quantity: item.quantity
            })),
            shipping_method: 1, // Standard shipping
            send_shipping_notification: true,
            address_to: {
                first_name: orderData.shippingAddress?.firstName || orderData.customerInfo?.name?.split(' ')[0] || 'Customer',
                last_name: orderData.shippingAddress?.lastName || orderData.customerInfo?.name?.split(' ')[1] || '',
                email: orderData.customerInfo?.email || 'customer@example.com',
                phone: orderData.shippingAddress?.phone || '',
                country: orderData.shippingAddress?.country || 'US',
                region: orderData.shippingAddress?.state || '',
                address1: orderData.shippingAddress?.address1 || orderData.shippingAddress?.street || '',
                address2: orderData.shippingAddress?.address2 || '',
                city: orderData.shippingAddress?.city || '',
                zip: orderData.shippingAddress?.zip || orderData.shippingAddress?.postalCode || ''
            }
        };
    }

    /**
     * Get product categories/tags
     */
    async getCategories() {
        try {
            const productsResponse = await this.getProducts(1, 100);
            const categories = new Set();
            
            productsResponse.products.forEach(product => {
                if (product.category) categories.add(product.category);
                if (product.tags) {
                    product.tags.forEach(tag => categories.add(tag));
                }
            });

            return Array.from(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            return ['All', 'T-Shirts', 'Hoodies', 'Accessories'];
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            await this.getShops();
            return { success: true, message: 'Printify API connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = PrintifyApiService;
