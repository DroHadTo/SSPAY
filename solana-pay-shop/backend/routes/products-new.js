const express = require('express');
const router = express.Router();
const PrintifyApiService = require('../services/printifyApi');

// Initialize Printify API service
const printifyApi = new PrintifyApiService();

// Test connection on startup
printifyApi.testConnection()
    .then(result => {
        if (result.success) {
            console.log('✅ Printify API connected successfully');
        } else {
            console.error('❌ Printify API connection failed:', result.message);
        }
    })
    .catch(error => {
        console.error('❌ Error testing Printify connection:', error.message);
    });

/**
 * Get all products from Printify
 * GET /api/products
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;

        console.log(`🛍️  Fetching products from Printify - Page: ${page}, Limit: ${limit}`);
        
        const result = await printifyApi.getProducts(page, limit);
        
        // Filter by category if specified
        let products = result.products;
        if (category && category !== 'All') {
            products = result.products.filter(product => 
                product.category === category || 
                product.tags.includes(category)
            );
        }

        res.json({
            products,
            pagination: {
                page: result.page,
                pages: result.pages,
                total: result.total,
                hasNext: result.page < result.pages,
                hasPrev: result.page > 1
            },
            category,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        
        // Fallback to mock data if Printify API fails
        console.log('📦 Using fallback mock products due to API error');
        const mockProducts = getMockProducts();
        
        res.json({
            products: mockProducts,
            pagination: {
                page: 1,
                pages: 1,
                total: mockProducts.length,
                hasNext: false,
                hasPrev: false
            },
            error: 'Using mock data - Printify API unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Get single product by ID
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`🔍 Fetching product details for ID: ${productId}`);
        
        const product = await printifyApi.getProduct(productId);
        
        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
                message: `Product with ID ${productId} does not exist`
            });
        }

        res.json({
            product,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`Error fetching product ${req.params.id}:`, error);
        
        // Try to find in mock data as fallback
        const mockProduct = getMockProducts().find(p => p.id === req.params.id);
        if (mockProduct) {
            return res.json({
                product: mockProduct,
                error: 'Using mock data - Printify API unavailable',
                timestamp: new Date().toISOString()
            });
        }

        res.status(404).json({
            error: 'Product not found',
            message: error.message
        });
    }
});

/**
 * Get product categories
 * GET /api/products/categories/list
 */
router.get('/categories/list', async (req, res) => {
    try {
        console.log('📂 Fetching product categories from Printify');
        
        const categories = await printifyApi.getCategories();
        
        res.json({
            categories: ['All', ...categories],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Fallback categories
        res.json({
            categories: ['All', 'T-Shirts', 'Hoodies', 'Mugs', 'Posters', 'Accessories'],
            error: 'Using fallback categories',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Search products
 * GET /api/products/search?q=searchterm
 */
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                error: 'Missing search query',
                message: 'Please provide a search term using ?q=searchterm'
            });
        }

        console.log(`🔍 Searching products for: "${query}"`);
        
        // Get all products and filter by search term
        const result = await printifyApi.getProducts(1, 100);
        const searchResults = result.products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        res.json({
            products: searchResults,
            query,
            count: searchResults.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

/**
 * Test Printify connection
 * GET /api/products/test/connection
 */
router.get('/test/connection', async (req, res) => {
    try {
        const result = await printifyApi.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Fallback mock products for when Printify API is unavailable
 */
function getMockProducts() {
    return [
        {
            id: '1',
            name: 'Solana T-Shirt',
            price: 25.99,
            description: 'Official Solana branded t-shirt made with premium cotton.',
            category: 'T-Shirts',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
            variants: [{ id: 1, title: 'Default', price: 25.99, available: true }],
            tags: ['blockchain', 'crypto', 'solana'],
            stock: 'in-stock',
            rating: 4.8,
            sales: 156
        },
        {
            id: '2',
            name: 'Crypto Hoodie',
            price: 45.99,
            description: 'Comfortable hoodie perfect for crypto enthusiasts.',
            category: 'Hoodies',
            image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
            images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
            variants: [{ id: 2, title: 'Default', price: 45.99, available: true }],
            tags: ['crypto', 'clothing', 'winter'],
            stock: 'in-stock',
            rating: 4.6,
            sales: 89
        },
        {
            id: '3',
            name: 'Blockchain Mug',
            price: 15.99,
            description: 'Start your day with a cup of decentralization.',
            category: 'Mugs',
            image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
            images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
            variants: [{ id: 3, title: 'Default', price: 15.99, available: true }],
            tags: ['mug', 'coffee', 'blockchain'],
            stock: 'in-stock',
            rating: 4.7,
            sales: 234
        }
    ];
}

module.exports = router;
