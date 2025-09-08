// routes/webhooks.js - Ask Copilot:
// "Create webhook endpoint routes for Printify integration
// Handle webhook validation and route to appropriate handlers
// Include logging and error handling for webhook events"

const express = require('express');
const printifyWebhookHandler = require('../webhooks/printifyWebhooks');
const router = express.Router();

// Middleware to parse raw body for webhook signature validation
router.use('/printify', express.raw({ type: 'application/json' }));

// Printify webhook endpoint
router.post('/printify', async (req, res) => {
    try {
        const signature = req.get('X-Printify-Signature');
        const eventType = req.get('X-Printify-Event-Type');
        
        console.log(`📦 Received Printify webhook: ${eventType}`);
        
        if (!eventType) {
            return res.status(400).json({
                success: false,
                error: 'Missing event type header'
            });
        }

        // Parse JSON payload
        let payload;
        try {
            payload = JSON.parse(req.body.toString());
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid JSON payload'
            });
        }

        // Process webhook
        const result = await printifyWebhookHandler.handleWebhook(
            eventType,
            payload,
            signature
        );

        res.json(result);

    } catch (error) {
        console.error('❌ Webhook processing error:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Webhook health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook endpoints operational',
        endpoints: {
            printify: '/api/webhooks/printify'
        },
        timestamp: new Date().toISOString()
    });
});

// Get webhook events summary (admin only)
router.get('/events/summary', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        const summary = await printifyWebhookHandler.getWebhookEventsSummary(parseInt(days));
        
        res.json({
            success: true,
            summary
        });
        
    } catch (error) {
        console.error('❌ Error fetching webhook summary:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch webhook summary'
        });
    }
});

module.exports = router;
