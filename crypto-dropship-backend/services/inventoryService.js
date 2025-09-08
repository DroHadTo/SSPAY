// services/inventoryService.js - Ask Copilot:
// "Create inventory management service for product synchronization
// Track stock levels, handle low stock alerts, and sync with Printify
// Implement automated inventory updates and notifications"

const cron = require('node-cron');
const { Product, OrderItem } = require('../database/models');
const emailService = require('./emailService');

class InventoryService {
    constructor() {
        this.isRunning = false;
        this.syncInterval = process.env.INVENTORY_SYNC_INTERVAL || '0 */6 * * *'; // Every 6 hours
        this.lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;
        this.initializeScheduledTasks();
    }

    // Initialize scheduled inventory tasks
    initializeScheduledTasks() {
        // Schedule inventory sync
        cron.schedule(this.syncInterval, async () => {
            console.log('🔄 Starting scheduled inventory sync...');
            await this.syncAllProducts();
        });

        // Daily low stock check
        cron.schedule('0 9 * * *', async () => {
            console.log('📊 Running daily low stock check...');
            await this.checkLowStockProducts();
        });

        console.log(`✅ Inventory service scheduled tasks initialized`);
        console.log(`📅 Sync interval: ${this.syncInterval}`);
        console.log(`⚠️  Low stock threshold: ${this.lowStockThreshold}`);
    }

    // Sync all products with Printify
    async syncAllProducts() {
        if (this.isRunning) {
            console.log('⚠️  Inventory sync already in progress');
            return { success: false, message: 'Sync already in progress' };
        }

        this.isRunning = true;
        let syncedCount = 0;
        let errorCount = 0;

        try {
            console.log('🔄 Starting inventory synchronization...');
            
            const products = await Product.findAll({
                where: { printify_product_id: { [Product.sequelize.Op.not]: null } }
            });

            for (const product of products) {
                try {
                    await this.syncSingleProduct(product);
                    syncedCount++;
                } catch (error) {
                    console.error(`❌ Failed to sync product ${product.id}:`, error.message);
                    errorCount++;
                }
            }

            const result = {
                success: true,
                synced: syncedCount,
                errors: errorCount,
                total: products.length,
                timestamp: new Date().toISOString()
            };

            console.log(`✅ Inventory sync completed: ${syncedCount} synced, ${errorCount} errors`);

            // Send admin notification if there were errors
            if (errorCount > 0) {
                await emailService.sendAdminNotification(
                    'Inventory Sync Completed with Errors',
                    `Inventory synchronization completed with ${errorCount} errors out of ${products.length} products.`,
                    result
                );
            }

            return result;

        } catch (error) {
            console.error('❌ Inventory sync failed:', error.message);
            
            await emailService.sendAdminNotification(
                'Inventory Sync Failed',
                `Inventory synchronization failed: ${error.message}`,
                { error: error.message, timestamp: new Date().toISOString() }
            );

            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    // Sync single product with Printify
    async syncSingleProduct(product) {
        try {
            // This would make an API call to Printify to get current product info
            // For now, simulate the sync process
            
            console.log(`🔄 Syncing product: ${product.title}`);
            
            // Simulate getting data from Printify API
            const printifyData = await this.fetchPrintifyProductData(product.printify_product_id);
            
            if (!printifyData) {
                throw new Error('Product not found on Printify');
            }

            // Update product with fresh data
            await product.update({
                is_available: printifyData.is_available,
                variants: printifyData.variants,
                base_price: printifyData.base_price,
                printify_status: printifyData.status,
                last_synced: new Date(),
                metadata: {
                    ...product.metadata,
                    last_sync_result: 'success',
                    printify_updated_at: printifyData.updated_at
                }
            });

            // Recalculate selling price if base price changed
            product.calculateSellingPrice();
            await product.save();

            return { success: true, product_id: product.id };

        } catch (error) {
            // Update product with sync error
            await product.update({
                metadata: {
                    ...product.metadata,
                    last_sync_result: 'error',
                    last_sync_error: error.message
                }
            });

            throw error;
        }
    }

    // Fetch product data from Printify API (mock implementation)
    async fetchPrintifyProductData(printifyProductId) {
        // In production, this would make an actual API call to Printify
        // For now, return mock data
        return {
            is_available: true,
            variants: [],
            base_price: 19.99,
            status: 'active',
            updated_at: new Date().toISOString()
        };
    }

    // Check for low stock products
    async checkLowStockProducts() {
        try {
            const lowStockProducts = await Product.findAll({
                where: {
                    inventory_count: {
                        [Product.sequelize.Op.lte]: this.lowStockThreshold
                    },
                    is_published: true,
                    is_available: true
                }
            });

            if (lowStockProducts.length > 0) {
                console.log(`⚠️  Found ${lowStockProducts.length} low stock products`);
                
                await emailService.sendAdminNotification(
                    'Low Stock Alert',
                    `${lowStockProducts.length} products are running low on inventory.`,
                    {
                        low_stock_products: lowStockProducts.map(p => ({
                            id: p.id,
                            title: p.title,
                            current_stock: p.inventory_count,
                            threshold: this.lowStockThreshold
                        }))
                    }
                );
            }

            return {
                success: true,
                low_stock_count: lowStockProducts.length,
                products: lowStockProducts
            };

        } catch (error) {
            console.error('❌ Low stock check failed:', error.message);
            throw error;
        }
    }

    // Update inventory after order
    async updateInventoryAfterOrder(orderId) {
        try {
            const orderItems = await OrderItem.findAll({
                where: { order_id: orderId },
                include: [{ model: Product, as: 'product' }]
            });

            for (const item of orderItems) {
                if (item.product) {
                    const newInventory = Math.max(0, item.product.inventory_count - item.quantity);
                    
                    await item.product.update({
                        inventory_count: newInventory,
                        sales_count: item.product.sales_count + item.quantity
                    });

                    // Check if product is now low stock
                    if (newInventory <= this.lowStockThreshold && newInventory > 0) {
                        await emailService.sendAdminNotification(
                            'Product Low Stock After Order',
                            `Product "${item.product.title}" is now low on inventory after recent order.`,
                            {
                                product_id: item.product.id,
                                product_title: item.product.title,
                                remaining_stock: newInventory,
                                order_id: orderId
                            }
                        );
                    }

                    // Mark as out of stock if inventory reaches zero
                    if (newInventory === 0) {
                        await item.product.update({ is_available: false });
                        
                        await emailService.sendAdminNotification(
                            'Product Out of Stock',
                            `Product "${item.product.title}" is now out of stock.`,
                            {
                                product_id: item.product.id,
                                product_title: item.product.title,
                                order_id: orderId
                            }
                        );
                    }
                }
            }

            return { success: true, updated_products: orderItems.length };

        } catch (error) {
            console.error('❌ Failed to update inventory after order:', error.message);
            throw error;
        }
    }

    // Restore inventory after order cancellation
    async restoreInventoryAfterCancellation(orderId) {
        try {
            const orderItems = await OrderItem.findAll({
                where: { order_id: orderId },
                include: [{ model: Product, as: 'product' }]
            });

            for (const item of orderItems) {
                if (item.product) {
                    const newInventory = item.product.inventory_count + item.quantity;
                    
                    await item.product.update({
                        inventory_count: newInventory,
                        sales_count: Math.max(0, item.product.sales_count - item.quantity),
                        is_available: true // Make available again if it was out of stock
                    });
                }
            }

            return { success: true, restored_products: orderItems.length };

        } catch (error) {
            console.error('❌ Failed to restore inventory after cancellation:', error.message);
            throw error;
        }
    }

    // Get inventory statistics
    async getInventoryStats() {
        try {
            const { sequelize } = require('../database/models');
            
            const stats = await Product.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_products'],
                    [sequelize.fn('SUM', sequelize.col('inventory_count')), 'total_inventory'],
                    [sequelize.fn('AVG', sequelize.col('inventory_count')), 'avg_inventory'],
                    [sequelize.fn('COUNT', sequelize.literal('CASE WHEN inventory_count <= ' + this.lowStockThreshold + ' THEN 1 END')), 'low_stock_count'],
                    [sequelize.fn('COUNT', sequelize.literal('CASE WHEN inventory_count = 0 THEN 1 END')), 'out_of_stock_count']
                ],
                where: { is_published: true }
            });

            const recentSales = await OrderItem.findAll({
                attributes: [
                    'product_id',
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'total_sold']
                ],
                include: [{ model: Product, as: 'product', attributes: ['title'] }],
                where: {
                    createdAt: {
                        [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                },
                group: ['product_id'],
                order: [[sequelize.literal('total_sold'), 'DESC']],
                limit: 10
            });

            return {
                success: true,
                stats: stats[0],
                top_selling_products: recentSales,
                low_stock_threshold: this.lowStockThreshold,
                last_sync: await this.getLastSyncTime()
            };

        } catch (error) {
            console.error('❌ Failed to get inventory stats:', error.message);
            throw error;
        }
    }

    // Get last sync time
    async getLastSyncTime() {
        try {
            const lastSynced = await Product.findOne({
                where: { 
                    last_synced: { [Product.sequelize.Op.not]: null } 
                },
                order: [['last_synced', 'DESC']],
                attributes: ['last_synced']
            });

            return lastSynced ? lastSynced.last_synced : null;
        } catch (error) {
            return null;
        }
    }

    // Manual inventory adjustment
    async adjustInventory(productId, adjustment, reason = 'Manual adjustment') {
        try {
            const product = await Product.findByPk(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const oldInventory = product.inventory_count;
            const newInventory = Math.max(0, oldInventory + adjustment);

            await product.update({ inventory_count: newInventory });

            // Log the adjustment
            console.log(`📊 Inventory adjusted for ${product.title}: ${oldInventory} → ${newInventory} (${adjustment >= 0 ? '+' : ''}${adjustment})`);

            // Send admin notification for significant adjustments
            if (Math.abs(adjustment) >= 10) {
                await emailService.sendAdminNotification(
                    'Large Inventory Adjustment',
                    `Inventory adjusted for "${product.title}": ${oldInventory} → ${newInventory}`,
                    {
                        product_id: productId,
                        product_title: product.title,
                        old_inventory: oldInventory,
                        new_inventory: newInventory,
                        adjustment: adjustment,
                        reason: reason
                    }
                );
            }

            return {
                success: true,
                product_id: productId,
                old_inventory: oldInventory,
                new_inventory: newInventory,
                adjustment: adjustment
            };

        } catch (error) {
            console.error('❌ Failed to adjust inventory:', error.message);
            throw error;
        }
    }
}

// Create singleton instance
const inventoryService = new InventoryService();

module.exports = inventoryService;
