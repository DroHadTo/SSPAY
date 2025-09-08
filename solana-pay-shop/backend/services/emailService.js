/**
 * Email Service for Solana Pay Shop
 * Handles order confirmations and status update notifications
 */

class EmailService {
    constructor() {
        // In production, integrate with services like SendGrid, Mailgun, or AWS SES
        this.emailProvider = process.env.EMAIL_PROVIDER || 'mock';
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@solanapayshop.com';
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Email templates
        this.templates = {
            orderConfirmation: this.getOrderConfirmationTemplate(),
            paymentConfirmation: this.getPaymentConfirmationTemplate(),
            orderShipped: this.getOrderShippedTemplate(),
            orderDelivered: this.getOrderDeliveredTemplate(),
            orderCancelled: this.getOrderCancelledTemplate()
        };
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmation(order) {
        try {
            const emailContent = this.generateOrderConfirmationEmail(order);
            
            const emailData = {
                to: order.customerInfo.email,
                subject: `Order Confirmation - ${order.orderNumber}`,
                html: emailContent.html,
                text: emailContent.text
            };

            return await this.sendEmail(emailData);
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            throw error;
        }
    }

    /**
     * Send payment confirmation email
     */
    async sendPaymentConfirmation(order, paymentDetails) {
        try {
            const emailContent = this.generatePaymentConfirmationEmail(order, paymentDetails);
            
            const emailData = {
                to: order.customerInfo.email,
                subject: `Payment Confirmed - ${order.orderNumber}`,
                html: emailContent.html,
                text: emailContent.text
            };

            return await this.sendEmail(emailData);
        } catch (error) {
            console.error('Error sending payment confirmation email:', error);
            throw error;
        }
    }

    /**
     * Send order status update email
     */
    async sendOrderStatusUpdate(order, previousStatus) {
        try {
            let emailContent;
            let subject;

            switch (order.status) {
                case 'shipped':
                    emailContent = this.generateOrderShippedEmail(order);
                    subject = `Order Shipped - ${order.orderNumber}`;
                    break;
                case 'delivered':
                    emailContent = this.generateOrderDeliveredEmail(order);
                    subject = `Order Delivered - ${order.orderNumber}`;
                    break;
                case 'cancelled':
                    emailContent = this.generateOrderCancelledEmail(order);
                    subject = `Order Cancelled - ${order.orderNumber}`;
                    break;
                default:
                    // Generic status update
                    emailContent = this.generateGenericStatusUpdateEmail(order, previousStatus);
                    subject = `Order Update - ${order.orderNumber}`;
            }

            const emailData = {
                to: order.customerInfo.email,
                subject,
                html: emailContent.html,
                text: emailContent.text
            };

            return await this.sendEmail(emailData);
        } catch (error) {
            console.error('Error sending order status update email:', error);
            throw error;
        }
    }

    /**
     * Generate order confirmation email content
     */
    generateOrderConfirmationEmail(order) {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${item.name}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    $${item.price.toFixed(2)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    $${(item.price * item.quantity).toFixed(2)}
                </td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Confirmation</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #9945FF;">⚡ Solana Pay Shop</h1>
                        <h2 style="color: #333;">Order Confirmation</h2>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>Dear ${order.customerInfo.name || 'Customer'},</p>
                        <p>Thank you for your order! We've received your order and will process it shortly.</p>
                        
                        <div style="margin: 20px 0;">
                            <strong>Order Number:</strong> ${order.orderNumber}<br>
                            <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
                            <strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                    </div>

                    <h3>Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
                                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Qty</th>
                                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8f9fa; font-weight: bold;">
                                <td colspan="3" style="padding: 15px; text-align: right;">Total:</td>
                                <td style="padding: 15px; text-align: right;">$${order.total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;">💰 Payment Information</h4>
                        <p style="margin: 5px 0;"><strong>Payment Token:</strong> ${order.paymentToken}</p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${order.status === 'paid' ? 'Confirmed' : 'Pending'}</p>
                        ${order.paymentId ? `<p style="margin: 5px 0;"><strong>Payment ID:</strong> ${order.paymentId}</p>` : ''}
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Questions about your order? Contact us at support@solanapayshop.com</p>
                        <p style="color: #666; font-size: 12px;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Order Confirmation - Solana Pay Shop

Dear ${order.customerInfo.name || 'Customer'},

Thank you for your order! We've received your order and will process it shortly.

Order Details:
- Order Number: ${order.orderNumber}
- Order Date: ${new Date(order.createdAt).toLocaleDateString()}
- Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
- Total: $${order.total.toFixed(2)}

Items:
${order.items.map(item => `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Payment Information:
- Payment Token: ${order.paymentToken}
- Payment Status: ${order.status === 'paid' ? 'Confirmed' : 'Pending'}

Questions? Contact us at support@solanapayshop.com
        `;

        return { html, text };
    }

    /**
     * Generate payment confirmation email content
     */
    generatePaymentConfirmationEmail(order, paymentDetails) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Payment Confirmed</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #9945FF;">⚡ Solana Pay Shop</h1>
                        <h2 style="color: #4caf50;">✅ Payment Confirmed</h2>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #4caf50;">
                        <p><strong>Great news!</strong> Your payment has been confirmed and your order is now being processed.</p>
                        
                        <div style="margin: 20px 0;">
                            <strong>Order Number:</strong> ${order.orderNumber}<br>
                            <strong>Payment Amount:</strong> $${order.total.toFixed(2)}<br>
                            <strong>Payment Token:</strong> ${order.paymentToken}<br>
                            ${paymentDetails.signature ? `<strong>Transaction:</strong> ${paymentDetails.signature}<br>` : ''}
                            <strong>Confirmed At:</strong> ${new Date().toLocaleString()}
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0;">📦 What's Next?</h4>
                        <ul style="margin: 0; padding-left: 20px;">
                            <li>Your order is now in our processing queue</li>
                            <li>We'll send you updates as your order progresses</li>
                            <li>Typical processing time is 1-3 business days</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Thank you for choosing Solana Pay Shop!</p>
                        <p style="color: #666; font-size: 12px;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Payment Confirmed - Solana Pay Shop

Great news! Your payment has been confirmed and your order is now being processed.

Order Number: ${order.orderNumber}
Payment Amount: $${order.total.toFixed(2)}
Payment Token: ${order.paymentToken}
${paymentDetails.signature ? `Transaction: ${paymentDetails.signature}` : ''}
Confirmed At: ${new Date().toLocaleString()}

What's Next?
- Your order is now in our processing queue
- We'll send you updates as your order progresses
- Typical processing time is 1-3 business days

Thank you for choosing Solana Pay Shop!
        `;

        return { html, text };
    }

    /**
     * Send email (mock implementation)
     */
    async sendEmail(emailData) {
        try {
            if (this.emailProvider === 'mock' || !this.isProduction) {
                // Mock email sending for development
                console.log('📧 Mock Email Sent:', {
                    to: emailData.to,
                    subject: emailData.subject,
                    provider: 'mock'
                });
                
                // In development, log email content
                if (process.env.NODE_ENV === 'development') {
                    console.log('Email Content (Text):\n', emailData.text);
                }
                
                return {
                    success: true,
                    messageId: 'mock_' + Date.now(),
                    provider: 'mock'
                };
            }

            // In production, integrate with real email service
            // Example for SendGrid (external email service):
            /*
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY); // cspell:ignore SENDGRID
            
            const msg = {
                to: emailData.to,
                from: this.fromEmail,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
            };
            
            const result = await sgMail.send(msg);
            return {
                success: true,
                messageId: result[0].headers['x-message-id'],
                provider: 'sendgrid' // cspell:ignore sendgrid
            };
            */

            throw new Error('Email provider not configured for production');
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Validate email address
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate generic status update email
     */
    generateGenericStatusUpdateEmail(order, previousStatus) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Update</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #9945FF;">⚡ Solana Pay Shop</h1>
                        <h2 style="color: #333;">Order Update</h2>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>Dear ${order.customerInfo.name || 'Customer'},</p>
                        <p>Your order status has been updated.</p>
                        
                        <div style="margin: 20px 0;">
                            <strong>Order Number:</strong> ${order.orderNumber}<br>
                            <strong>Previous Status:</strong> ${previousStatus}<br>
                            <strong>Current Status:</strong> ${order.status}<br>
                            <strong>Updated At:</strong> ${new Date(order.updatedAt).toLocaleString()}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Questions about your order? Contact us at support@solanapayshop.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Order Update - Solana Pay Shop

Dear ${order.customerInfo.name || 'Customer'},

Your order status has been updated.

Order Number: ${order.orderNumber}
Previous Status: ${previousStatus}
Current Status: ${order.status}
Updated At: ${new Date(order.updatedAt).toLocaleString()}

Questions? Contact us at support@solanapayshop.com
        `;

        return { html, text };
    }

    // Additional template methods would be implemented here...
    getOrderConfirmationTemplate() { return 'order_confirmation'; }
    getPaymentConfirmationTemplate() { return 'payment_confirmation'; }
    getOrderShippedTemplate() { return 'order_shipped'; }
    getOrderDeliveredTemplate() { return 'order_delivered'; }
    getOrderCancelledTemplate() { return 'order_cancelled'; }
}

module.exports = EmailService;
