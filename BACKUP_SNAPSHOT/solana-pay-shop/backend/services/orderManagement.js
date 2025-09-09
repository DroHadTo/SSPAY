/**
 * Order Management Service for Solana Pay Shop
 * Handles order creation, tracking, and history management
 */

const { v4: uuidv4 } = require('uuid');

class OrderManagementService {
    constructor() {
        // In-memory storage (use database in production)
        this.orders = new Map();
        this.ordersByCustomer = new Map();
        this.ordersByStatus = new Map();
        
        // Order statuses
        this.ORDER_STATUS = {
            PENDING: 'pending',
            PAYMENT_PENDING: 'payment_pending',
            PAID: 'paid',
            PROCESSING: 'processing',
            SHIPPED: 'shipped',
            DELIVERED: 'delivered',
            CANCELLED: 'cancelled',
            REFUNDED: 'refunded'
        };

        // Initialize status tracking
        Object.values(this.ORDER_STATUS).forEach(status => {
            this.ordersByStatus.set(status, new Set());
        });
    }

    /**
     * Create a new order
     */
    async createOrder(orderData) {
        try {
            const orderId = uuidv4();
            const orderNumber = this.generateOrderNumber();
            
            const order = {
                id: orderId,
                orderNumber,
                customerId: orderData.customerId || 'anonymous',
                customerInfo: {
                    email: orderData.customerEmail || '',
                    name: orderData.customerName || '',
                    phone: orderData.customerPhone || '',
                    shippingAddress: orderData.shippingAddress || {}
                },
                items: orderData.items || [],
                subtotal: orderData.subtotal || 0,
                tax: orderData.tax || 0,
                shipping: orderData.shipping || 0,
                total: orderData.total || 0,
                currency: orderData.currency || 'USD',
                paymentToken: orderData.paymentToken || 'SOL',
                paymentId: orderData.paymentId || null,
                status: this.ORDER_STATUS.PENDING,
                statusHistory: [{
                    status: this.ORDER_STATUS.PENDING,
                    timestamp: new Date().toISOString(),
                    note: 'Order created'
                }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: orderData.metadata || {}
            };

            // Store order
            this.orders.set(orderId, order);
            
            // Index by customer
            const customerOrders = this.ordersByCustomer.get(order.customerId) || new Set();
            customerOrders.add(orderId);
            this.ordersByCustomer.set(order.customerId, customerOrders);
            
            // Index by status
            this.ordersByStatus.get(order.status).add(orderId);

            console.log(`📦 Order created: ${orderNumber} (${orderId})`);
            return order;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, newStatus, note = '') {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            if (!Object.values(this.ORDER_STATUS).includes(newStatus)) {
                throw new Error('Invalid order status');
            }

            // Remove from old status index
            this.ordersByStatus.get(order.status).delete(orderId);
            
            // Update order
            const oldStatus = order.status;
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            
            // Add status history entry
            order.statusHistory.push({
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || `Status changed from ${oldStatus} to ${newStatus}`
            });

            // Add to new status index
            this.ordersByStatus.get(newStatus).add(orderId);

            console.log(`📋 Order ${order.orderNumber} status updated: ${oldStatus} → ${newStatus}`);
            return order;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    /**
     * Get order by ID
     */
    async getOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    /**
     * Get order by order number
     */
    async getOrderByNumber(orderNumber) {
        for (const order of this.orders.values()) {
            if (order.orderNumber === orderNumber) {
                return order;
            }
        }
        throw new Error('Order not found');
    }

    /**
     * Get orders by customer
     */
    async getCustomerOrders(customerId, options = {}) {
        const { limit = 50, offset = 0, status = null } = options;
        const customerOrderIds = this.ordersByCustomer.get(customerId) || new Set();
        
        let orders = Array.from(customerOrderIds)
            .map(id => this.orders.get(id))
            .filter(order => order && (status ? order.status === status : true))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const total = orders.length;
        orders = orders.slice(offset, offset + limit);

        return {
            orders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }

    /**
     * Get orders by status
     */
    async getOrdersByStatus(status, options = {}) {
        const { limit = 50, offset = 0 } = options;
        
        if (!Object.values(this.ORDER_STATUS).includes(status)) {
            throw new Error('Invalid order status');
        }

        const orderIds = this.ordersByStatus.get(status) || new Set();
        let orders = Array.from(orderIds)
            .map(id => this.orders.get(id))
            .filter(order => order)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const total = orders.length;
        orders = orders.slice(offset, offset + limit);

        return {
            orders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }

    /**
     * Search orders
     */
    async searchOrders(query, options = {}) {
        const { limit = 50, offset = 0 } = options;
        const searchTerm = query.toLowerCase();

        let orders = Array.from(this.orders.values())
            .filter(order => {
                return (
                    order.orderNumber.toLowerCase().includes(searchTerm) ||
                    order.customerInfo.email.toLowerCase().includes(searchTerm) ||
                    order.customerInfo.name.toLowerCase().includes(searchTerm) ||
                    order.items.some(item => 
                        item.name.toLowerCase().includes(searchTerm)
                    )
                );
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const total = orders.length;
        orders = orders.slice(offset, offset + limit);

        return {
            orders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }

    /**
     * Link payment to order
     */
    async linkPaymentToOrder(orderId, paymentId, signature = null) {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            order.paymentId = paymentId;
            if (signature) {
                order.paymentSignature = signature;
            }
            order.updatedAt = new Date().toISOString();

            // Update status to payment pending
            await this.updateOrderStatus(orderId, this.ORDER_STATUS.PAYMENT_PENDING, 'Payment initiated');

            return order;
        } catch (error) {
            console.error('Error linking payment to order:', error);
            throw error;
        }
    }

    /**
     * Mark order as paid
     */
    async markOrderAsPaid(orderId, paymentSignature) {
        try {
            const order = await this.updateOrderStatus(
                orderId, 
                this.ORDER_STATUS.PAID, 
                `Payment confirmed with signature: ${paymentSignature}`
            );
            
            order.paymentSignature = paymentSignature;
            order.paidAt = new Date().toISOString();
            
            return order;
        } catch (error) {
            console.error('Error marking order as paid:', error);
            throw error;
        }
    }

    /**
     * Generate order number
     */
    generateOrderNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `SOL-${timestamp}-${random}`;
    }

    /**
     * Get order statistics
     */
    async getOrderStatistics(timeframe = '30d') {
        const now = new Date();
        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        const orders = Array.from(this.orders.values())
            .filter(order => new Date(order.createdAt) >= startDate);

        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders
                .filter(order => order.status === this.ORDER_STATUS.PAID || order.status === this.ORDER_STATUS.PROCESSING || order.status === this.ORDER_STATUS.SHIPPED || order.status === this.ORDER_STATUS.DELIVERED)
                .reduce((sum, order) => sum + order.total, 0),
            averageOrderValue: 0,
            statusBreakdown: {},
            paymentTokenBreakdown: {},
            topProducts: {},
            recentOrders: orders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
        };

        // Calculate average order value
        const paidOrders = orders.filter(order => 
            [this.ORDER_STATUS.PAID, this.ORDER_STATUS.PROCESSING, this.ORDER_STATUS.SHIPPED, this.ORDER_STATUS.DELIVERED]
            .includes(order.status)
        );
        stats.averageOrderValue = paidOrders.length > 0 ? stats.totalRevenue / paidOrders.length : 0;

        // Status breakdown
        Object.values(this.ORDER_STATUS).forEach(status => {
            stats.statusBreakdown[status] = orders.filter(order => order.status === status).length;
        });

        // Payment token breakdown
        orders.forEach(order => {
            const token = order.paymentToken || 'SOL';
            stats.paymentTokenBreakdown[token] = (stats.paymentTokenBreakdown[token] || 0) + 1;
        });

        // Top products
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!stats.topProducts[item.id]) {
                    stats.topProducts[item.id] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                stats.topProducts[item.id].quantity += item.quantity;
                stats.topProducts[item.id].revenue += item.price * item.quantity;
            });
        });

        return stats;
    }

    /**
     * Export orders to CSV format
     */
    exportOrdersToCSV(orders) {
        const headers = [
            'Order Number', 'Order ID', 'Customer Email', 'Customer Name',
            'Status', 'Total', 'Currency', 'Payment Token', 'Payment ID',
            'Created At', 'Updated At'
        ];

        const rows = orders.map(order => [
            order.orderNumber,
            order.id,
            order.customerInfo.email,
            order.customerInfo.name,
            order.status,
            order.total,
            order.currency,
            order.paymentToken,
            order.paymentId || '',
            order.createdAt,
            order.updatedAt
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Get all orders (admin function)
     */
    async getAllOrders(options = {}) {
        const { limit = 100, offset = 0, status = null, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        
        let orders = Array.from(this.orders.values())
            .filter(order => status ? order.status === status : true);

        // Sort orders
        orders.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });

        // Apply pagination
        const total = orders.length;
        orders = orders.slice(offset, offset + limit);

        return {
            orders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }
}

module.exports = OrderManagementService;
