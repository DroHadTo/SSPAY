// routes/printify.js - Ask Copilot:
// "Create Printify API wrapper with error handling
// Proxy product fetching and order creation
// Add request logging and rate limiting"

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Printify API configuration
const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

// Axios instance with default configuration
const printifyAPI = axios.create({
    baseURL: PRINTIFY_API_BASE,
    headers: {
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoDropship/1.0'
    },
    timeout: 30000 // 30 seconds timeout
});

// Request interceptor for logging
printifyAPI.interceptors.request.use(
    (config) => {
        console.log(`Printify API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Printify API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
printifyAPI.interceptors.response.use(
    (response) => {
        console.log(`Printify API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('Printify API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

// Middleware to check if Printify API token is configured
router.use((req, res, next) => {
    if (!PRINTIFY_API_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'Printify API token not configured'
        });
    }
    next();
});

// GET /api/printify/shops - Get all shops
router.get('/shops', async (req, res) => {
    try {
        const response = await printifyAPI.get('/shops.json');
        res.json({
            success: true,
            shops: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch shops');
    }
});

// GET /api/printify/catalog/blueprints - Get all available product blueprints
router.get('/catalog/blueprints', async (req, res) => {
    try {
        const response = await printifyAPI.get('/catalog/blueprints.json');
        res.json({
            success: true,
            blueprints: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch blueprints');
    }
});

// GET /api/printify/catalog/blueprints/:id/print_providers - Get print providers for blueprint
router.get('/catalog/blueprints/:id/print_providers', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await printifyAPI.get(`/catalog/blueprints/${id}/print_providers.json`);
        res.json({
            success: true,
            printProviders: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch print providers');
    }
});

// GET /api/printify/catalog/blueprints/:blueprintId/print_providers/:printProviderId/variants 
// Get variants for specific blueprint and print provider
router.get('/catalog/blueprints/:blueprintId/print_providers/:printProviderId/variants', async (req, res) => {
    try {
        const { blueprintId, printProviderId } = req.params;
        const response = await printifyAPI.get(
            `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
        );
        res.json({
            success: true,
            variants: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch variants');
    }
});

// GET /api/printify/shops/:shopId/products - Get all products from shop
router.get('/shops/:shopId/products', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const response = await printifyAPI.get(`/shops/${shopId}/products.json`, {
            params: { page, limit }
        });
        
        res.json({
            success: true,
            products: response.data.data,
            pagination: {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total
            }
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch products');
    }
});

// GET /api/printify/shops/:shopId/products/:productId - Get single product
router.get('/shops/:shopId/products/:productId', async (req, res) => {
    try {
        const { shopId, productId } = req.params;
        const response = await printifyAPI.get(`/shops/${shopId}/products/${productId}.json`);
        res.json({
            success: true,
            product: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch product');
    }
});

// POST /api/printify/shops/:shopId/products - Create new product
router.post('/shops/:shopId/products', async (req, res) => {
    try {
        const { shopId } = req.params;
        const productData = req.body;
        
        // Validate required fields
        if (!productData.title || !productData.blueprint_id || !productData.print_provider_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, blueprint_id, print_provider_id'
            });
        }
        
        const response = await printifyAPI.post(`/shops/${shopId}/products.json`, productData);
        res.status(201).json({
            success: true,
            product: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to create product');
    }
});

// POST /api/printify/shops/:shopId/orders - Create new order
router.post('/shops/:shopId/orders', async (req, res) => {
    try {
        const { shopId } = req.params;
        const orderData = req.body;
        
        // Validate required fields
        if (!orderData.line_items || !orderData.shipping_address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: line_items, shipping_address'
            });
        }
        
        const response = await printifyAPI.post(`/shops/${shopId}/orders.json`, orderData);
        res.status(201).json({
            success: true,
            order: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to create order');
    }
});

// GET /api/printify/shops/:shopId/orders - Get all orders
router.get('/shops/:shopId/orders', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 20, status } = req.query;
        
        const params = { page, limit };
        if (status) params.status = status;
        
        const response = await printifyAPI.get(`/shops/${shopId}/orders.json`, { params });
        res.json({
            success: true,
            orders: response.data.data,
            pagination: {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total
            }
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch orders');
    }
});

// GET /api/printify/shops/:shopId/orders/:orderId - Get single order
router.get('/shops/:shopId/orders/:orderId', async (req, res) => {
    try {
        const { shopId, orderId } = req.params;
        const response = await printifyAPI.get(`/shops/${shopId}/orders/${orderId}.json`);
        res.json({
            success: true,
            order: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to fetch order');
    }
});

// POST /api/printify/shops/:shopId/orders/:orderId/send_to_production - Send order to production
router.post('/shops/:shopId/orders/:orderId/send_to_production', async (req, res) => {
    try {
        const { shopId, orderId } = req.params;
        const response = await printifyAPI.post(`/shops/${shopId}/orders/${orderId}/send_to_production.json`);
        res.json({
            success: true,
            message: 'Order sent to production successfully',
            order: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to send order to production');
    }
});

// POST /api/printify/shops/:shopId/orders/:orderId/calculate_shipping - Calculate shipping costs
router.post('/shops/:shopId/orders/:orderId/calculate_shipping', async (req, res) => {
    try {
        const { shopId, orderId } = req.params;
        const response = await printifyAPI.post(`/shops/${shopId}/orders/${orderId}/calculate_shipping.json`);
        res.json({
            success: true,
            shipping: response.data
        });
    } catch (error) {
        handlePrintifyError(error, res, 'Failed to calculate shipping');
    }
});

// Helper function to handle Printify API errors
function handlePrintifyError(error, res, defaultMessage) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || defaultMessage;
    
    console.error('Printify API Error:', {
        status,
        message,
        url: error.config?.url,
        data: error.response?.data
    });
    
    res.status(status).json({
        success: false,
        error: message,
        details: error.response?.data || null
    });
}

module.exports = router;
