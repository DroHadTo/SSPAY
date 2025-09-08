/**
 * Inventory Management Service for Solana Pay Shop
 * Handles product stock levels, availability, and inventory tracking
 */

class InventoryService {
    constructor() {
        // In-memory storage (use database in production)
        this.inventory = new Map();
        this.reservedStock = new Map(); // For items in pending orders
        this.inventoryHistory = [];
        
        // Initialize with default products
        this.initializeDefaultInventory();
    }

    /**
     * Initialize default inventory
     */
    initializeDefaultInventory() {
        const defaultProducts = [
            {
                id: 1,
                sku: 'SOL-TSHIRT-001',
                name: 'Solana Pay T-Shirt',
                category: 'apparel',
                stock: 100,
                reservedStock: 0,
                lowStockThreshold: 10,
                price: 25.99,
                cost: 12.00,
                supplier: 'PrintifySupplier',
                location: 'Warehouse-A'
            },
            {
                id: 2,
                sku: 'CRYPTO-HOODIE-001',
                name: 'Crypto Hoodie',
                category: 'apparel',
                stock: 75,
                reservedStock: 0,
                lowStockThreshold: 5,
                price: 45.99,
                cost: 22.00,
                supplier: 'PrintifySupplier',
                location: 'Warehouse-A'
            },
            {
                id: 3,
                sku: 'BLOCKCHAIN-MUG-001',
                name: 'Blockchain Mug',
                category: 'accessories',
                stock: 150,
                reservedStock: 0,
                lowStockThreshold: 20,
                price: 15.99,
                cost: 6.50,
                supplier: 'LocalSupplier',
                location: 'Warehouse-B'
            }
        ];

        defaultProducts.forEach(product => {
            this.inventory.set(product.id, {
                ...product,
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
        });

        console.log(`📦 Initialized inventory with ${defaultProducts.length} products`);
    }

    /**
     * Get product inventory by ID
     */
    async getProductInventory(productId) {
        const inventory = this.inventory.get(productId);
        if (!inventory) {
            throw new Error('Product not found in inventory');
        }

        return {
            ...inventory,
            availableStock: inventory.stock - inventory.reservedStock,
            isLowStock: (inventory.stock - inventory.reservedStock) <= inventory.lowStockThreshold,
            isOutOfStock: (inventory.stock - inventory.reservedStock) <= 0
        };
    }

    /**
     * Check if product is available in requested quantity
     */
    async checkAvailability(productId, quantity) {
        try {
            const inventory = await this.getProductInventory(productId);
            return {
                available: inventory.availableStock >= quantity,
                availableStock: inventory.availableStock,
                requestedQuantity: quantity,
                shortfall: Math.max(0, quantity - inventory.availableStock)
            };
        } catch (error) {
            return {
                available: false,
                availableStock: 0,
                requestedQuantity: quantity,
                shortfall: quantity,
                error: error.message
            };
        }
    }

    /**
     * Reserve stock for an order
     */
    async reserveStock(items, orderId) {
        const reservations = [];
        const failures = [];

        try {
            // Check availability for all items first
            for (const item of items) {
                const availability = await this.checkAvailability(item.id, item.quantity);
                if (!availability.available) {
                    failures.push({
                        productId: item.id,
                        name: item.name,
                        requested: item.quantity,
                        available: availability.availableStock,
                        shortfall: availability.shortfall
                    });
                }
            }

            if (failures.length > 0) {
                throw new Error('Insufficient stock for some items');
            }

            // Reserve stock for all items
            for (const item of items) {
                const inventory = this.inventory.get(item.id);
                if (inventory) {
                    inventory.reservedStock += item.quantity;
                    inventory.lastUpdated = new Date().toISOString();

                    // Track reservation
                    const reservationId = `${orderId}_${item.id}`;
                    this.reservedStock.set(reservationId, {
                        orderId,
                        productId: item.id,
                        quantity: item.quantity,
                        reservedAt: new Date().toISOString(),
                        status: 'active'
                    });

                    reservations.push({
                        productId: item.id,
                        quantity: item.quantity,
                        reservationId
                    });

                    // Log inventory change
                    this.logInventoryChange(item.id, 'reservation', -item.quantity, `Reserved for order ${orderId}`);
                }
            }

            console.log(`📦 Reserved stock for order ${orderId}:`, reservations);
            return { success: true, reservations, failures: [] };

        } catch (error) {
            console.error('Error reserving stock:', error);
            return { success: false, reservations, failures };
        }
    }

    /**
     * Release reserved stock (when order is cancelled)
     */
    async releaseReservedStock(orderId) {
        const releases = [];

        try {
            // Find all reservations for this order
            for (const [reservationId, reservation] of this.reservedStock.entries()) {
                if (reservation.orderId === orderId && reservation.status === 'active') {
                    const inventory = this.inventory.get(reservation.productId);
                    if (inventory) {
                        inventory.reservedStock -= reservation.quantity;
                        inventory.lastUpdated = new Date().toISOString();

                        // Mark reservation as released
                        reservation.status = 'released';
                        reservation.releasedAt = new Date().toISOString();

                        releases.push({
                            productId: reservation.productId,
                            quantity: reservation.quantity,
                            reservationId
                        });

                        // Log inventory change
                        this.logInventoryChange(
                            reservation.productId, 
                            'release', 
                            reservation.quantity, 
                            `Released reservation for cancelled order ${orderId}`
                        );
                    }
                }
            }

            console.log(`📦 Released reserved stock for order ${orderId}:`, releases);
            return { success: true, releases };

        } catch (error) {
            console.error('Error releasing reserved stock:', error);
            return { success: false, releases: [] };
        }
    }

    /**
     * Confirm stock usage (when order is fulfilled)
     */
    async confirmStockUsage(orderId) {
        const confirmations = [];

        try {
            // Find all reservations for this order
            for (const [reservationId, reservation] of this.reservedStock.entries()) {
                if (reservation.orderId === orderId && reservation.status === 'active') {
                    const inventory = this.inventory.get(reservation.productId);
                    if (inventory) {
                        // Reduce actual stock and reserved stock
                        inventory.stock -= reservation.quantity;
                        inventory.reservedStock -= reservation.quantity;
                        inventory.lastUpdated = new Date().toISOString();

                        // Mark reservation as confirmed
                        reservation.status = 'confirmed';
                        reservation.confirmedAt = new Date().toISOString();

                        confirmations.push({
                            productId: reservation.productId,
                            quantity: reservation.quantity,
                            reservationId
                        });

                        // Log inventory change
                        this.logInventoryChange(
                            reservation.productId, 
                            'sale', 
                            -reservation.quantity, 
                            `Confirmed sale for order ${orderId}`
                        );

                        // Check for low stock alerts
                        if (inventory.stock <= inventory.lowStockThreshold) {
                            console.warn(`⚠️ Low stock alert: ${inventory.name} (${inventory.stock} remaining)`);
                        }
                    }
                }
            }

            console.log(`📦 Confirmed stock usage for order ${orderId}:`, confirmations);
            return { success: true, confirmations };

        } catch (error) {
            console.error('Error confirming stock usage:', error);
            return { success: false, confirmations: [] };
        }
    }

    /**
     * Update product stock levels
     */
    async updateStock(productId, newStock, reason = 'manual adjustment') {
        try {
            const inventory = this.inventory.get(productId);
            if (!inventory) {
                throw new Error('Product not found in inventory');
            }

            const oldStock = inventory.stock;
            const change = newStock - oldStock;
            
            inventory.stock = newStock;
            inventory.lastUpdated = new Date().toISOString();

            // Log inventory change
            this.logInventoryChange(productId, 'adjustment', change, reason);

            console.log(`📦 Updated stock for ${inventory.name}: ${oldStock} → ${newStock} (${change >= 0 ? '+' : ''}${change})`);
            
            return await this.getProductInventory(productId);
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    }

    /**
     * Add new product to inventory
     */
    async addProduct(productData) {
        try {
            const productId = productData.id || this.generateProductId();
            
            const inventoryItem = {
                id: productId,
                sku: productData.sku || this.generateSKU(productData.name),
                name: productData.name,
                category: productData.category || 'general',
                stock: productData.stock || 0,
                reservedStock: 0,
                lowStockThreshold: productData.lowStockThreshold || 10,
                price: productData.price || 0,
                cost: productData.cost || 0,
                supplier: productData.supplier || '',
                location: productData.location || 'Default',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            this.inventory.set(productId, inventoryItem);

            // Log inventory change
            this.logInventoryChange(productId, 'created', inventoryItem.stock, 'Product added to inventory');

            console.log(`📦 Added new product to inventory: ${inventoryItem.name} (ID: ${productId})`);
            return inventoryItem;
        } catch (error) {
            console.error('Error adding product to inventory:', error);
            throw error;
        }
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts() {
        const lowStockProducts = [];

        for (const inventory of this.inventory.values()) {
            const availableStock = inventory.stock - inventory.reservedStock;
            if (availableStock <= inventory.lowStockThreshold) {
                lowStockProducts.push({
                    ...inventory,
                    availableStock,
                    isOutOfStock: availableStock <= 0
                });
            }
        }

        return lowStockProducts.sort((a, b) => a.availableStock - b.availableStock);
    }

    /**
     * Get inventory summary
     */
    async getInventorySummary() {
        const products = Array.from(this.inventory.values());
        const lowStockProducts = await this.getLowStockProducts();
        
        const summary = {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0),
            totalReservedStock: products.reduce((sum, p) => sum + p.reservedStock, 0),
            totalAvailableStock: products.reduce((sum, p) => sum + (p.stock - p.reservedStock), 0),
            lowStockCount: lowStockProducts.length,
            outOfStockCount: lowStockProducts.filter(p => p.availableStock <= 0).length,
            inventoryValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
            categories: {},
            suppliers: {}
        };

        // Category breakdown
        products.forEach(product => {
            if (!summary.categories[product.category]) {
                summary.categories[product.category] = {
                    count: 0,
                    totalStock: 0,
                    totalValue: 0
                };
            }
            summary.categories[product.category].count++;
            summary.categories[product.category].totalStock += product.stock;
            summary.categories[product.category].totalValue += product.stock * product.cost;
        });

        // Supplier breakdown
        products.forEach(product => {
            if (!summary.suppliers[product.supplier]) {
                summary.suppliers[product.supplier] = {
                    count: 0,
                    totalStock: 0,
                    totalValue: 0
                };
            }
            summary.suppliers[product.supplier].count++;
            summary.suppliers[product.supplier].totalStock += product.stock;
            summary.suppliers[product.supplier].totalValue += product.stock * product.cost;
        });

        return summary;
    }

    /**
     * Log inventory changes
     */
    logInventoryChange(productId, type, quantity, reason) {
        const logEntry = {
            id: this.generateLogId(),
            productId,
            type, // 'sale', 'reservation', 'release', 'adjustment', 'created'
            quantity,
            reason,
            timestamp: new Date().toISOString(),
            user: 'system' // In production, track actual user
        };

        this.inventoryHistory.push(logEntry);
        
        // Keep only last 1000 entries in memory
        if (this.inventoryHistory.length > 1000) {
            this.inventoryHistory = this.inventoryHistory.slice(-1000);
        }
    }

    /**
     * Get inventory history
     */
    async getInventoryHistory(productId = null, limit = 50) {
        let history = this.inventoryHistory;
        
        if (productId) {
            history = history.filter(entry => entry.productId === productId);
        }

        return history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Generate unique product ID
     */
    generateProductId() {
        return Math.max(...Array.from(this.inventory.keys()), 0) + 1;
    }

    /**
     * Generate SKU
     */
    generateSKU(productName) {
        const prefix = productName.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        return `${prefix}-${timestamp}`;
    }

    /**
     * Generate log ID
     */
    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get all inventory (admin function)
     */
    async getAllInventory() {
        const inventory = Array.from(this.inventory.values()).map(item => ({
            ...item,
            availableStock: item.stock - item.reservedStock,
            isLowStock: (item.stock - item.reservedStock) <= item.lowStockThreshold,
            isOutOfStock: (item.stock - item.reservedStock) <= 0
        }));

        return inventory.sort((a, b) => a.name.localeCompare(b.name));
    }
}

module.exports = InventoryService;
