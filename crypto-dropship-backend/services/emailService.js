// services/emailService.js - Ask Copilot:
// "Create email notification service using NodeMailer
// Send order confirmations, shipping updates, and admin alerts
// Template-based emails with customer and order information"

const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Configure email transporter based on environment
            const emailConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            };

            // Create transporter if credentials are available
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                this.transporter = nodemailer.createTransporter(emailConfig);
                this.isConfigured = true;
                console.log('✅ Email service configured successfully');
                
                // Verify connection
                this.verifyConnection();
            } else {
                console.log('⚠️  Email service not configured - missing SMTP credentials');
                console.log('   Set SMTP_USER and SMTP_PASS environment variables');
            }
        } catch (error) {
            console.error('❌ Failed to configure email service:', error.message);
        }
    }

    async verifyConnection() {
        if (!this.isConfigured) return false;
        
        try {
            await this.transporter.verify();
            console.log('✅ Email connection verified');
            return true;
        } catch (error) {
            console.error('❌ Email connection failed:', error.message);
            this.isConfigured = false;
            return false;
        }
    }

    // Send order confirmation email
    async sendOrderConfirmation(order, customer) {
        if (!this.isConfigured) {
            console.log('📧 Email service not configured - skipping order confirmation');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const emailTemplate = this.getOrderConfirmationTemplate(order, customer);
            
            const mailOptions = {
                from: `"${process.env.BUSINESS_NAME || 'Crypto Dropship'}" <${process.env.SMTP_USER}>`,
                to: customer.email,
                subject: `Order Confirmation - ${order.order_number}`,
                html: emailTemplate,
                text: this.stripHtml(emailTemplate)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Order confirmation sent to ${customer.email}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                message: 'Order confirmation sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send order confirmation:', error.message);
            return { success: false, message: error.message };
        }
    }

    // Send shipping notification email
    async sendShippingNotification(order, customer, trackingInfo) {
        if (!this.isConfigured) {
            console.log('📧 Email service not configured - skipping shipping notification');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const emailTemplate = this.getShippingNotificationTemplate(order, customer, trackingInfo);
            
            const mailOptions = {
                from: `"${process.env.BUSINESS_NAME || 'Crypto Dropship'}" <${process.env.SMTP_USER}>`,
                to: customer.email,
                subject: `Your Order Has Shipped - ${order.order_number}`,
                html: emailTemplate,
                text: this.stripHtml(emailTemplate)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Shipping notification sent to ${customer.email}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                message: 'Shipping notification sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send shipping notification:', error.message);
            return { success: false, message: error.message };
        }
    }

    // Send order status update email
    async sendOrderStatusUpdate(order, customer, previousStatus, newStatus) {
        if (!this.isConfigured) {
            console.log('📧 Email service not configured - skipping status update');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const emailTemplate = this.getOrderStatusUpdateTemplate(order, customer, previousStatus, newStatus);
            
            const mailOptions = {
                from: `"${process.env.BUSINESS_NAME || 'Crypto Dropship'}" <${process.env.SMTP_USER}>`,
                to: customer.email,
                subject: `Order Update - ${order.order_number}`,
                html: emailTemplate,
                text: this.stripHtml(emailTemplate)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Order status update sent to ${customer.email}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                message: 'Order status update sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send order status update:', error.message);
            return { success: false, message: error.message };
        }
    }

    // Send admin notification
    async sendAdminNotification(subject, message, data = {}) {
        if (!this.isConfigured) {
            console.log('📧 Email service not configured - skipping admin notification');
            return { success: false, message: 'Email service not configured' };
        }

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (!adminEmail) {
            return { success: false, message: 'No admin email configured' };
        }

        try {
            const emailTemplate = this.getAdminNotificationTemplate(subject, message, data);
            
            const mailOptions = {
                from: `"${process.env.BUSINESS_NAME || 'Crypto Dropship'} System" <${process.env.SMTP_USER}>`,
                to: adminEmail,
                subject: `[ADMIN] ${subject}`,
                html: emailTemplate,
                text: this.stripHtml(emailTemplate)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification sent: ${subject}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                message: 'Admin notification sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send admin notification:', error.message);
            return { success: false, message: error.message };
        }
    }

    // Email templates
    getOrderConfirmationTemplate(order, customer) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
            <style>
                .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
                .amount { font-size: 18px; font-weight: bold; color: #059669; }
                .order-number { font-size: 24px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>${process.env.BUSINESS_NAME || 'Crypto Dropship'}</h1>
                    <h2>Order Confirmation</h2>
                </div>
                <div class="content">
                    <p>Hi ${customer.first_name || 'Valued Customer'},</p>
                    <p>Thank you for your order! We've received your payment and are processing your order.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order Number:</strong> <span class="order-number">${order.order_number}</span></p>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                        <p><strong>Total Amount:</strong> <span class="amount">${order.total_amount} ${order.currency}</span></p>
                        <p><strong>Status:</strong> ${this.formatStatus(order.status)}</p>
                        ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
                    </div>

                    <div class="order-details">
                        <h3>Shipping Address</h3>
                        <p>
                            ${order.shipping_address.street}<br>
                            ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}<br>
                            ${order.shipping_address.country}
                        </p>
                    </div>

                    <p>We'll send you updates as your order progresses. If you have any questions, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${process.env.BUSINESS_NAME || 'Crypto Dropship'}. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getShippingNotificationTemplate(order, customer, trackingInfo) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Your Order Has Shipped</title>
            <style>
                .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .shipping-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
                .tracking-button { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>📦 Your Order Has Shipped!</h1>
                </div>
                <div class="content">
                    <p>Hi ${customer.first_name || 'Valued Customer'},</p>
                    <p>Great news! Your order <strong>${order.order_number}</strong> has shipped and is on its way to you.</p>
                    
                    <div class="shipping-details">
                        <h3>Shipping Information</h3>
                        <p><strong>Tracking Number:</strong> ${trackingInfo.tracking_number}</p>
                        <p><strong>Carrier:</strong> ${trackingInfo.carrier || 'Standard Shipping'}</p>
                        <p><strong>Estimated Delivery:</strong> ${trackingInfo.estimated_delivery ? new Date(trackingInfo.estimated_delivery).toLocaleDateString() : '3-7 business days'}</p>
                        
                        ${trackingInfo.tracking_url ? `<a href="${trackingInfo.tracking_url}" class="tracking-button">Track Your Package</a>` : ''}
                    </div>

                    <p>You can expect your package to arrive within the estimated timeframe. We'll notify you when it's delivered!</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${process.env.BUSINESS_NAME || 'Crypto Dropship'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getOrderStatusUpdateTemplate(order, customer, previousStatus, newStatus) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Status Update</title>
            <style>
                .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .status-update { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed; }
                .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
                .status { font-weight: bold; color: #7c3aed; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Order Status Update</h1>
                </div>
                <div class="content">
                    <p>Hi ${customer.first_name || 'Valued Customer'},</p>
                    <p>We wanted to update you on the status of your order <strong>${order.order_number}</strong>.</p>
                    
                    <div class="status-update">
                        <h3>Status Change</h3>
                        <p><strong>Previous Status:</strong> ${this.formatStatus(previousStatus)}</p>
                        <p><strong>Current Status:</strong> <span class="status">${this.formatStatus(newStatus)}</span></p>
                        <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    ${this.getStatusDescription(newStatus)}
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${process.env.BUSINESS_NAME || 'Crypto Dropship'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getAdminNotificationTemplate(subject, message, data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Admin Notification</title>
            <style>
                .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .data-section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
                .code { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>🚨 Admin Notification</h1>
                    <h2>${subject}</h2>
                </div>
                <div class="content">
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                    
                    ${Object.keys(data).length > 0 ? `
                    <div class="data-section">
                        <h3>Additional Data</h3>
                        <div class="code">${JSON.stringify(data, null, 2)}</div>
                    </div>
                    ` : ''}

                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                </div>
                <div class="footer">
                    <p>Crypto Dropship Admin System</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Utility methods
    formatStatus(status) {
        return status.replace(/_/g, ' ').toUpperCase();
    }

    getStatusDescription(status) {
        const descriptions = {
            'pending_payment': '<p>We are waiting for payment confirmation.</p>',
            'payment_confirmed': '<p>Payment received! We are now processing your order.</p>',
            'processing': '<p>Your order is being prepared for shipment.</p>',
            'production': '<p>Your items are being manufactured and will ship soon.</p>',
            'shipped': '<p>Your order is on the way! Check your tracking information above.</p>',
            'delivered': '<p>🎉 Your order has been delivered! We hope you love your purchase.</p>',
            'cancelled': '<p>Your order has been cancelled. If you have questions, please contact support.</p>'
        };
        
        return descriptions[status] || '<p>Your order status has been updated.</p>';
    }

    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
