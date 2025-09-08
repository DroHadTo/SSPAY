// webhooks/printifyWebhooks.js - Ask Copilot:
// "Create webhook handlers for Printify order updates
// Validate webhook signatures and process order status changes
// Update database and trigger email notifications"

const crypto = require('crypto');
const { Order, OrderItem, Customer } = require('../database/models');
const emailService = require('../services/emailService');

class PrintifyWebhookHandler {
    constructor() {
        this.webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
    }

    // Validate webhook signature
    validateSignature(payload, signature) {
        if (!this.webhookSecret) {
            console.warn('⚠️  Printify webhook secret not configured - skipping signature validation');
            return true; // Allow webhooks in development without secret
        }

        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(payload)
                .digest('hex');

            const receivedSignature = signature.replace('sha256=', '');
            
            return crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(receivedSignature, 'hex')
            );
        } catch (error) {
            console.error('❌ Webhook signature validation error:', error.message);
            return false;
        }
    }

    // Main webhook handler
    async handleWebhook(eventType, payload, signature) {
        console.log(`📦 Received Printify webhook: ${eventType}`);

        // Validate signature
        if (!this.validateSignature(JSON.stringify(payload), signature)) {
            throw new Error('Invalid webhook signature');
        }

        try {
            switch (eventType) {
                case 'order:sent-to-production':
                    return await this.handleOrderSentToProduction(payload);
                
                case 'order:shipped':
                    return await this.handleOrderShipped(payload);
                
                case 'order:delivered':
                    return await this.handleOrderDelivered(payload);
                
                case 'order:canceled':
                    return await this.handleOrderCanceled(payload);
                
                case 'product:out-of-stock':
                    return await this.handleProductOutOfStock(payload);
                
                case 'product:back-in-stock':
                    return await this.handleProductBackInStock(payload);
                
                default:
                    console.log(`⚠️  Unhandled webhook event: ${eventType}`);
                    return { success: true, message: 'Event not handled' };
            }
        } catch (error) {
            console.error(`❌ Error processing webhook ${eventType}:`, error.message);
            throw error;
        }
    }

    // Handle order sent to production
    async handleOrderSentToProduction(payload) {
        const { id: printifyOrderId, resource } = payload;
        
        // Find order in database
        const order = await Order.findOne({
            where: { printify_order_id: printifyOrderId },
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!order) {
            console.log(`⚠️  Order not found for Printify ID: ${printifyOrderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Update order status
        const previousStatus = order.status;
        await order.updateStatus('production', {
            printify_data: resource,
            printify_status: 'sent-to-production'
        });

        // Update order items production status
        if (resource.line_items) {
            for (const lineItem of resource.line_items) {
                await OrderItem.update(
                    { 
                        production_status: 'in_production',
                        printify_line_item_id: lineItem.id 
                    },
                    { 
                        where: { 
                            order_id: order.id,
                            printify_variant_id: lineItem.variant_id 
                        }
                    }
                );
            }
        }

        // Send email notification
        if (order.customer) {
            await emailService.sendOrderStatusUpdate(
                order, 
                order.customer, 
                previousStatus, 
                'production'
            );
        }

        console.log(`✅ Order ${order.order_number} sent to production`);
        return { success: true, message: 'Order production status updated' };
    }

    // Handle order shipped
    async handleOrderShipped(payload) {
        const { id: printifyOrderId, resource } = payload;
        
        const order = await Order.findOne({
            where: { printify_order_id: printifyOrderId },
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!order) {
            console.log(`⚠️  Order not found for Printify ID: ${printifyOrderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Extract shipping information
        const trackingInfo = {
            tracking_number: resource.tracking_number,
            tracking_url: resource.tracking_url,
            carrier: resource.carrier,
            estimated_delivery: resource.estimated_delivery_date
        };

        // Update order status
        const previousStatus = order.status;
        await order.updateStatus('shipped', {
            ...trackingInfo,
            printify_data: resource,
            printify_status: 'shipped'
        });

        // Update order items
        if (resource.line_items) {
            for (const lineItem of resource.line_items) {
                await OrderItem.update(
                    { 
                        production_status: 'shipped',
                        tracking_number: trackingInfo.tracking_number
                    },
                    { 
                        where: { 
                            order_id: order.id,
                            printify_line_item_id: lineItem.id 
                        }
                    }
                );
            }
        }

        // Send shipping notification email
        if (order.customer) {
            await emailService.sendShippingNotification(
                order,
                order.customer,
                trackingInfo
            );
        }

        console.log(`✅ Order ${order.order_number} shipped with tracking: ${trackingInfo.tracking_number}`);
        return { success: true, message: 'Order shipping status updated' };
    }

    // Handle order delivered
    async handleOrderDelivered(payload) {
        const { id: printifyOrderId, resource } = payload;
        
        const order = await Order.findOne({
            where: { printify_order_id: printifyOrderId },
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!order) {
            console.log(`⚠️  Order not found for Printify ID: ${printifyOrderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Update order status
        const previousStatus = order.status;
        await order.updateStatus('delivered', {
            printify_data: resource,
            printify_status: 'delivered',
            delivered_at: new Date()
        });

        // Update order items
        await OrderItem.update(
            { 
                production_status: 'delivered',
                delivered_at: new Date()
            },
            { where: { order_id: order.id } }
        );

        // Send delivery notification email
        if (order.customer) {
            await emailService.sendOrderStatusUpdate(
                order,
                order.customer,
                previousStatus,
                'delivered'
            );
        }

        console.log(`✅ Order ${order.order_number} delivered`);
        return { success: true, message: 'Order delivery status updated' };
    }

    // Handle order canceled
    async handleOrderCanceled(payload) {
        const { id: printifyOrderId, resource } = payload;
        
        const order = await Order.findOne({
            where: { printify_order_id: printifyOrderId },
            include: [{ model: Customer, as: 'customer' }]
        });

        if (!order) {
            console.log(`⚠️  Order not found for Printify ID: ${printifyOrderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Update order status
        const previousStatus = order.status;
        await order.updateStatus('cancelled', {
            printify_data: resource,
            printify_status: 'canceled',
            cancellation_reason: resource.reason || 'Canceled by supplier'
        });

        // Update order items
        await OrderItem.update(
            { production_status: 'cancelled' },
            { where: { order_id: order.id } }
        );

        // Send cancellation notification
        if (order.customer) {
            await emailService.sendOrderStatusUpdate(
                order,
                order.customer,
                previousStatus,
                'cancelled'
            );
        }

        // Send admin notification for manual refund handling
        await emailService.sendAdminNotification(
            'Order Canceled - Refund Required',
            `Order ${order.order_number} has been canceled by Printify. Manual refund may be required.`,
            {
                order_number: order.order_number,
                customer_email: order.customer_email,
                total_amount: order.total_amount,
                reason: resource.reason
            }
        );

        console.log(`✅ Order ${order.order_number} canceled`);
        return { success: true, message: 'Order cancellation processed' };
    }

    // Handle product out of stock
    async handleProductOutOfStock(payload) {
        const { resource } = payload;
        const { Product } = require('../database/models');

        // Find product by Printify ID
        const product = await Product.findOne({
            where: { printify_product_id: resource.id }
        });

        if (product) {
            // Update product availability
            await product.update({
                is_available: false,
                printify_status: 'out-of-stock',
                last_synced: new Date()
            });

            // Send admin notification
            await emailService.sendAdminNotification(
                'Product Out of Stock',
                `Product "${product.title}" is now out of stock on Printify.`,
                {
                    product_id: product.id,
                    printify_product_id: resource.id,
                    product_title: product.title
                }
            );

            console.log(`⚠️  Product ${product.title} marked as out of stock`);
        }

        return { success: true, message: 'Product stock status updated' };
    }

    // Handle product back in stock
    async handleProductBackInStock(payload) {
        const { resource } = payload;
        const { Product } = require('../database/models');

        // Find product by Printify ID
        const product = await Product.findOne({
            where: { printify_product_id: resource.id }
        });

        if (product) {
            // Update product availability
            await product.update({
                is_available: true,
                printify_status: 'in-stock',
                last_synced: new Date()
            });

            // Send admin notification
            await emailService.sendAdminNotification(
                'Product Back in Stock',
                `Product "${product.title}" is now back in stock on Printify.`,
                {
                    product_id: product.id,
                    printify_product_id: resource.id,
                    product_title: product.title
                }
            );

            console.log(`✅ Product ${product.title} marked as back in stock`);
        }

        return { success: true, message: 'Product stock status updated' };
    }

    // Get webhook events summary for admin
    async getWebhookEventsSummary(days = 7) {
        // This would typically be stored in a webhooks log table
        // For now, return a placeholder
        return {
            total_events: 0,
            events_by_type: {},
            recent_events: [],
            period_days: days
        };
    }
}

module.exports = new PrintifyWebhookHandler();
