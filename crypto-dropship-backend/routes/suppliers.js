const express = require('express');
const router = express.Router();

// Mock supplier configurations
const suppliers = [
    {
        id: 'supplier_1',
        name: 'TechDrop Supplier',
        apiEndpoint: 'https://api.techdrop.com/v1',
        apiKey: process.env.SUPPLIER_API_KEY_1,
        supportedCategories: ['Electronics', 'Wearables'],
        processingTime: '1-3 business days',
        shippingRegions: ['US', 'CA', 'EU'],
        features: {
            realTimeInventory: true,
            trackingUpdates: true,
            returnSupport: true
        }
    },
    {
        id: 'supplier_2',
        name: 'GadgetSource',
        apiEndpoint: 'https://api.gadgetsource.com/v2',
        apiKey: process.env.SUPPLIER_API_KEY_2,
        supportedCategories: ['Accessories', 'Electronics'],
        processingTime: '1-2 business days',
        shippingRegions: ['US', 'CA'],
        features: {
            realTimeInventory: true,
            trackingUpdates: false,
            returnSupport: false
        }
    }
];

// Get all suppliers
router.get('/', (req, res) => {
    try {
        // Return suppliers without sensitive API keys
        const publicSuppliers = suppliers.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            supportedCategories: supplier.supportedCategories,
            processingTime: supplier.processingTime,
            shippingRegions: supplier.shippingRegions,
            features: supplier.features
        }));
        
        res.json({
            success: true,
            suppliers: publicSuppliers
        });
        
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch suppliers'
        });
    }
});

// Get supplier by ID
router.get('/:supplierId', (req, res) => {
    try {
        const { supplierId } = req.params;
        const supplier = suppliers.find(s => s.id === supplierId);
        
        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }
        
        // Return supplier without API key
        const publicSupplier = {
            id: supplier.id,
            name: supplier.name,
            supportedCategories: supplier.supportedCategories,
            processingTime: supplier.processingTime,
            shippingRegions: supplier.shippingRegions,
            features: supplier.features
        };
        
        res.json({
            success: true,
            supplier: publicSupplier
        });
        
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supplier'
        });
    }
});

// Create order with supplier
router.post('/:supplierId/orders', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const {
            productId,
            quantity,
            customerInfo,
            shippingAddress,
            orderReference
        } = req.body;
        
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }
        
        // Validate required fields
        if (!productId || !quantity || !customerInfo || !shippingAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Mock supplier order creation
        const supplierOrder = await createSupplierOrder(supplier, {
            productId,
            quantity,
            customerInfo,
            shippingAddress,
            orderReference
        });
        
        res.status(201).json({
            success: true,
            supplierOrder,
            message: 'Order created with supplier successfully'
        });
        
    } catch (error) {
        console.error('Error creating supplier order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create supplier order'
        });
    }
});

// Get supplier order status
router.get('/:supplierId/orders/:supplierOrderId', async (req, res) => {
    try {
        const { supplierId, supplierOrderId } = req.params;
        
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }
        
        // Mock supplier order status check
        const orderStatus = await getSupplierOrderStatus(supplier, supplierOrderId);
        
        res.json({
            success: true,
            orderStatus
        });
        
    } catch (error) {
        console.error('Error fetching supplier order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supplier order status'
        });
    }
});

// Sync inventory from supplier
router.post('/:supplierId/sync-inventory', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { productIds } = req.body;
        
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }
        
        // Mock inventory sync
        const inventoryUpdate = await syncSupplierInventory(supplier, productIds);
        
        res.json({
            success: true,
            inventoryUpdate,
            message: 'Inventory synced successfully'
        });
        
    } catch (error) {
        console.error('Error syncing inventory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync inventory'
        });
    }
});

// Mock function to create supplier order
async function createSupplierOrder(supplier, orderData) {
    // In production, this would make actual API calls to supplier
    const supplierOrderId = `${supplier.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    return {
        supplierOrderId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        status: 'accepted',
        productId: orderData.productId,
        quantity: orderData.quantity,
        estimatedProcessingTime: supplier.processingTime,
        estimatedShipping: '7-14 business days',
        trackingNumber: null,
        createdAt: new Date().toISOString()
    };
}

// Mock function to get supplier order status
async function getSupplierOrderStatus(supplier, supplierOrderId) {
    // In production, this would query supplier's API
    return {
        supplierOrderId,
        status: 'processing', // accepted, processing, shipped, delivered, cancelled
        trackingNumber: supplier.features.trackingUpdates ? `TRACK_${Math.random().toString(36).substr(2, 10).toUpperCase()}` : null,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date().toISOString()
    };
}

// Mock function to sync inventory
async function syncSupplierInventory(supplier, productIds) {
    // In production, this would fetch real inventory from supplier
    const inventoryData = productIds?.map(productId => ({
        productId,
        stock: Math.floor(Math.random() * 100) + 10,
        price: (Math.random() * 100 + 20).toFixed(2),
        lastUpdated: new Date().toISOString()
    })) || [];
    
    return {
        supplierId: supplier.id,
        productsUpdated: inventoryData.length,
        inventory: inventoryData,
        syncedAt: new Date().toISOString()
    };
}

module.exports = router;
