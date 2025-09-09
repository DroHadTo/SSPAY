const axios = require('axios');

class PrintifyService {
  constructor() {
    this.apiToken = process.env.PRINTIFY_API_TOKEN || process.env.PRINTIFY_API_KEY;
    this.shopId = process.env.PRINTIFY_SHOP_ID;
    this.baseURL = 'https://api.printify.com/v1';
    
    if (!this.apiToken) {
      throw new Error('PRINTIFY_API_TOKEN or PRINTIFY_API_KEY is required');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SSPAY/2.0.0 (Solana-Pay-Shop)'
      },
      timeout: 30000
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use((config) => {
      // Add delay between requests to respect rate limits
      return new Promise(resolve => {
        setTimeout(() => resolve(config), 100);
      });
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          console.error(`Printify API Error ${status}:`, data);
          
          if (status === 429) {
            // Rate limited - implement exponential backoff
            const retryAfter = error.response.headers['retry-after'] || 60;
            error.retryAfter = parseInt(retryAfter);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await this.client.get('/shops.json');
      return {
        success: true,
        shops: response.data,
        message: 'Successfully connected to Printify API'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to Printify API'
      };
    }
  }

  // Get shop information
  async getShopInfo() {
    try {
      if (!this.shopId) {
        const shops = await this.client.get('/shops.json');
        return shops.data;
      }
      
      const shop = await this.client.get(`/shops/${this.shopId}.json`);
      return shop.data;
    } catch (error) {
      throw new Error(`Failed to get shop info: ${error.message}`);
    }
  }

  // Get all products from Printify
  async getProducts(page = 1, limit = 100) {
    try {
      const response = await this.client.get(`/shops/${this.shopId}/products.json`, {
        params: { page, limit }
      });
      
      return {
        products: response.data.data || response.data,
        pagination: {
          current_page: response.data.current_page || page,
          total_pages: response.data.last_page || 1,
          per_page: response.data.per_page || limit,
          total: response.data.total || response.data.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  // Get single product details
  async getProduct(productId) {
    try {
      const response = await this.client.get(`/shops/${this.shopId}/products/${productId}.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch product ${productId}: ${error.message}`);
    }
  }

  // Transform Printify product to our format
  transformProduct(printifyProduct) {
    const variants = printifyProduct.variants?.map(variant => ({
      id: variant.id,
      title: variant.title,
      price: parseFloat(variant.price) / 100, // Convert cents to dollars
      is_enabled: variant.is_enabled,
      options: variant.options || {}
    })) || [];

    const images = printifyProduct.images?.map(img => ({
      src: img.src,
      alt: img.alt || printifyProduct.title,
      position: img.position || 0
    })) || [];

    return {
      printify_product_id: printifyProduct.id.toString(),
      title: printifyProduct.title,
      description: printifyProduct.description || '',
      base_price: this.calculatePrice(variants),
      image_url: images[0]?.src || null,
      images: images,
      variants: variants,
      category: this.determineCategory(printifyProduct),
      tags: printifyProduct.tags || [],
      status: printifyProduct.visible === undefined ? 'active' : (printifyProduct.visible ? 'active' : 'inactive'),
      metadata: {
        printify_data: printifyProduct,
        last_synced: new Date()
      }
    };
  }

  // Calculate base price from variants
  calculatePrice(variants) {
    if (!variants || variants.length === 0) return 0;
    
    const prices = variants
      .filter(v => v.is_enabled)
      .map(v => v.price);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  // Determine category from product data
  determineCategory(product) {
    const title = product.title?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const text = `${title} ${description}`;

    if (text.includes('shirt') || text.includes('tee') || text.includes('hoodie') || text.includes('sweatshirt')) {
      return 'apparel';
    }
    if (text.includes('mug') || text.includes('cup') || text.includes('bottle')) {
      return 'drinkware';
    }
    if (text.includes('phone case') || text.includes('case') || text.includes('cover')) {
      return 'accessories';
    }
    if (text.includes('poster') || text.includes('print') || text.includes('canvas')) {
      return 'wall-art';
    }
    if (text.includes('sticker') || text.includes('decal')) {
      return 'stickers';
    }
    
    return 'other';
  }

  // Create order on Printify
  async createOrder(orderData) {
    try {
      const printifyOrder = {
        line_items: orderData.items.map(item => ({
          product_id: item.printify_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        shipping_address: orderData.shipping_address,
        send_shipping_notification: true
      };

      const response = await this.client.post(
        `/shops/${this.shopId}/orders.json`,
        printifyOrder
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Printify order: ${error.message}`);
    }
  }

  // Submit order for production
  async submitOrder(orderId) {
    try {
      const response = await this.client.post(
        `/shops/${this.shopId}/orders/${orderId}/send_to_production.json`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit order to production: ${error.message}`);
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/shops/${this.shopId}/orders/${orderId}.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  // Calculate shipping cost
  async calculateShipping(orderData) {
    try {
      const response = await this.client.post(
        `/shops/${this.shopId}/orders/shipping.json`,
        {
          line_items: orderData.items.map(item => ({
            product_id: item.printify_id,
            variant_id: item.variant_id,
            quantity: item.quantity
          })),
          address_to: orderData.shipping_address
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to calculate shipping: ${error.message}`);
    }
  }

  // Legacy methods for backward compatibility
  async getShops() {
    return this.getShopInfo();
  }

  async getCatalog() {
    try {
      const response = await this.client.get('/catalog/blueprints.json');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch catalog: ${error.message}`);
    }
  }

  async getBlueprint(blueprintId) {
    try {
      const response = await this.client.get(`/catalog/blueprints/${blueprintId}.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch blueprint ${blueprintId}: ${error.message}`);
    }
  }

  async getPrintProviders(blueprintId) {
    try {
      const response = await this.client.get(`/catalog/blueprints/${blueprintId}/print_providers.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch print providers for blueprint ${blueprintId}: ${error.message}`);
    }
  }

  async getOrders(page = 1, limit = 100) {
    try {
      const response = await this.client.get(`/shops/${this.shopId}/orders.json`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getOrder(orderId) {
    return this.getOrderStatus(orderId);
  }

  // Legacy transform method for backward compatibility
  transformProductData(printifyProduct) {
    return this.transformProduct(printifyProduct);
  }

  calculateBasePrice(variants) {
    return this.calculatePrice(variants);
  }

  extractCategory(tags) {
    if (!tags || tags.length === 0) return 'other';
    return tags[0].toLowerCase().replace(/\s+/g, '-');
  }
}

module.exports = new PrintifyService();
