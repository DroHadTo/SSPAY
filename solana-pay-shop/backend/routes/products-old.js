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

// Mock product data (replace with database in production)
const products = [
    {
        id: 1,
        name: "Solana T-Shirt",
        price: 25.00,
        description: "Official Solana branded t-shirt made from premium cotton",
        category: "clothing",
        image: "https://via.placeholder.com/250x200?text=Solana+T-Shirt",
        inStock: true,
        inventory: 50,
        sku: "SOL-TSHIRT-001",
        tags: ["solana", "clothing", "crypto", "blockchain"]
    },
    {
        id: 2,
        name: "Crypto Mug",
        price: 15.00,
        description: "Drink your coffee while HODLing - ceramic mug with crypto designs",
        category: "accessories",
        image: "https://via.placeholder.com/250x200?text=Crypto+Mug",
        inStock: true,
        inventory: 100,
        sku: "CRYPTO-MUG-001",
        tags: ["mug", "coffee", "crypto", "hodl"]
    },
    {
        id: 3,
        name: "Blockchain Stickers",
        price: 5.00,
        description: "Pack of 10 high-quality blockchain and crypto stickers",
        category: "accessories",
        image: "https://via.placeholder.com/250x200?text=Stickers",
        inStock: true,
        inventory: 200,
        sku: "BLOCKCHAIN-STICKERS-001",
        tags: ["stickers", "blockchain", "crypto", "pack"]
    },
    {
        id: 4,
        name: "DeFi Hoodie",
        price: 45.00,
        description: "Warm and decentralized - premium hoodie for DeFi enthusiasts",
        category: "clothing",
        image: "https://via.placeholder.com/250x200?text=DeFi+Hoodie",
        inStock: true,
        inventory: 25,
        sku: "DEFI-HOODIE-001",
        tags: ["hoodie", "defi", "clothing", "warm"]
    },
    {
        id: 5,
        name: "Web3 Cap",
        price: 20.00,
        description: "Stylish cap representing the future of the internet",
        category: "accessories",
        image: "https://via.placeholder.com/250x200?text=Web3+Cap",
        inStock: true,
        inventory: 75,
        sku: "WEB3-CAP-001",
        tags: ["cap", "web3", "accessories", "style"]
    },
    {
        id: 6,
        name: "NFT Art Print",
        price: 35.00,
        description: "Limited edition NFT-inspired art print on premium paper",
        category: "art",
        image: "https://via.placeholder.com/250x200?text=NFT+Art",
        inStock: true,
        inventory: 30,
        sku: "NFT-ART-001",
        tags: ["nft", "art", "print", "limited"]
    }
];

/**
 * Get all products
 * GET /api/products
 */
router.get('/', (req, res) => {
    try {
        const { category, inStock, minPrice, maxPrice, search } = req.query;
        let filteredProducts = [...products];

        // Filter by category
        if (category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by stock status
        if (inStock !== undefined) {
            const stockFilter = inStock === 'true';
            filteredProducts = filteredProducts.filter(product => 
                product.inStock === stockFilter
            );
        }

        // Filter by price range
        if (minPrice) {
            filteredProducts = filteredProducts.filter(product => 
                product.price >= parseFloat(minPrice)
            );
        }

        if (maxPrice) {
            filteredProducts = filteredProducts.filter(product => 
                product.price <= parseFloat(maxPrice)
            );
        }

        // Search filter
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        res.json({
            products: filteredProducts,
            count: filteredProducts.length,
            total: products.length
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

/**
 * Get a specific product by ID
 * GET /api/products/:id
 */
router.get('/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
                message: `Product with ID ${productId} does not exist`
            });
        }

        res.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            error: 'Failed to fetch product',
            message: error.message
        });
    }
});

/**
 * Get product categories
 * GET /api/products/meta/categories
 */
router.get('/meta/categories', (req, res) => {
    try {
        const categories = [...new Set(products.map(product => product.category))];
        
        const categoriesWithCounts = categories.map(category => ({
            name: category,
            count: products.filter(product => product.category === category).length
        }));

        res.json({
            categories: categoriesWithCounts,
            total: categories.length
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

/**
 * Get featured products
 * GET /api/products/featured
 */
router.get('/featured', (req, res) => {
    try {
        // For demo purposes, return products with low inventory as "featured"
        const featuredProducts = products
            .filter(product => product.inStock && product.inventory < 50)
            .sort((a, b) => a.inventory - b.inventory)
            .slice(0, 4);

        res.json({
            products: featuredProducts,
            count: featuredProducts.length
        });

    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            error: 'Failed to fetch featured products',
            message: error.message
        });
    }
});

/**
 * Check product availability
 * POST /api/products/check-availability
 */
router.post('/check-availability', (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Items array is required'
            });
        }

        const availability = items.map(item => {
            const product = products.find(p => p.id === item.id);
            
            if (!product) {
                return {
                    id: item.id,
                    available: false,
                    reason: 'Product not found'
                };
            }

            if (!product.inStock) {
                return {
                    id: item.id,
                    available: false,
                    reason: 'Out of stock'
                };
            }

            if (product.inventory < item.quantity) {
                return {
                    id: item.id,
                    available: false,
                    reason: `Only ${product.inventory} items available`,
                    availableQuantity: product.inventory
                };
            }

            return {
                id: item.id,
                available: true,
                product: {
                    name: product.name,
                    price: product.price,
                    inventory: product.inventory
                }
            };
        });

        const allAvailable = availability.every(item => item.available);

        res.json({
            available: allAvailable,
            items: availability
        });

    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            error: 'Failed to check availability',
            message: error.message
        });
    }
});

/**
 * Update product inventory (for admin use)
 * PUT /api/products/:id/inventory
 */
router.put('/:id/inventory', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { quantity, operation = 'set' } = req.body;

        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({
                error: 'Product not found',
                message: `Product with ID ${productId} does not exist`
            });
        }

        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                error: 'Invalid quantity',
                message: 'Quantity must be a non-negative number'
            });
        }

        const product = products[productIndex];

        switch (operation) {
            case 'set':
                product.inventory = quantity;
                break;
            case 'add':
                product.inventory += quantity;
                break;
            case 'subtract':
                product.inventory = Math.max(0, product.inventory - quantity);
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid operation',
                    message: 'Operation must be "set", "add", or "subtract"'
                });
        }

        // Update stock status
        product.inStock = product.inventory > 0;

        res.json({
            id: product.id,
            name: product.name,
            inventory: product.inventory,
            inStock: product.inStock,
            message: `Inventory updated successfully`
        });

    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({
            error: 'Failed to update inventory',
            message: error.message
        });
    }
});

module.exports = router;
