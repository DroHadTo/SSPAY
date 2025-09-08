/**
 * Analytics API Routes
 * Handles payment success rates, popular products, and revenue tracking
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const AnalyticsService = require('../services/analyticsService');

const router = express.Router();

// Initialize analytics service
const analyticsService = new AnalyticsService();

/**
 * Get analytics dashboard
 * GET /api/analytics/dashboard
 */
router.get('/dashboard',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const timeframe = req.query.timeframe || '30d';
            const dashboard = await analyticsService.getAnalyticsDashboard(timeframe);

            res.json({
                success: true,
                dashboard
            });

        } catch (error) {
            console.error('Error fetching analytics dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get payment success rates
 * GET /api/analytics/payment-success-rate
 */
router.get('/payment-success-rate',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const timeframe = req.query.timeframe || '30d';
            const successRate = await analyticsService.getPaymentSuccessRate(timeframe);

            res.json({
                success: true,
                data: successRate
            });

        } catch (error) {
            console.error('Error fetching payment success rate:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get popular products
 * GET /api/analytics/popular-products
 */
router.get('/popular-products',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const timeframe = req.query.timeframe || '30d';
            const limit = parseInt(req.query.limit) || 10;
            
            const popularProducts = await analyticsService.getPopularProducts(timeframe, limit);

            res.json({
                success: true,
                data: popularProducts
            });

        } catch (error) {
            console.error('Error fetching popular products:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get revenue tracking
 * GET /api/analytics/revenue
 */
router.get('/revenue',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe'),
        query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy value')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const timeframe = req.query.timeframe || '30d';
            const groupBy = req.query.groupBy || 'day';
            
            const revenueData = await analyticsService.getRevenueTracking(timeframe, groupBy);

            res.json({
                success: true,
                data: revenueData
            });

        } catch (error) {
            console.error('Error fetching revenue data:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get conversion funnel
 * GET /api/analytics/conversion-funnel
 */
router.get('/conversion-funnel',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const timeframe = req.query.timeframe || '30d';
            const conversionFunnel = await analyticsService.getConversionFunnel(timeframe);

            res.json({
                success: true,
                data: conversionFunnel
            });

        } catch (error) {
            console.error('Error fetching conversion funnel:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Track product view
 * POST /api/analytics/track/product-view
 */
router.post('/track/product-view',
    [
        query('productId').notEmpty().withMessage('Product ID is required'),
        query('productName').notEmpty().withMessage('Product name is required'),
        query('sessionId').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const productId = req.query.productId;
            const productName = req.query.productName;
            const sessionId = req.query.sessionId || req.sessionID || 'anonymous';
            const metadata = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                referrer: req.headers.referer
            };

            await analyticsService.trackProductView(productId, productName, sessionId, metadata);

            res.json({
                success: true,
                message: 'Product view tracked successfully'
            });

        } catch (error) {
            console.error('Error tracking product view:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Track user session
 * POST /api/analytics/track/session
 */
router.post('/track/session',
    async (req, res) => {
        try {
            const sessionId = req.body.sessionId || req.sessionID || 'anonymous';
            const sessionData = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                referrer: req.headers.referer,
                pageView: req.body.pageView,
                event: req.body.event,
                eventData: req.body.eventData
            };

            await analyticsService.trackUserSession(sessionId, sessionData);

            res.json({
                success: true,
                message: 'Session tracked successfully'
            });

        } catch (error) {
            console.error('Error tracking session:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Export analytics data
 * GET /api/analytics/export/:type
 */
router.get('/export/:type',
    [
        query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe'),
        query('type').isIn(['payments', 'sales', 'product_views']).withMessage('Invalid export type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const type = req.params.type;
            const timeframe = req.query.timeframe || '30d';
            
            const csvData = analyticsService.exportAnalyticsCSV(type, timeframe);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}_${timeframe}.csv"`);
            res.send(csvData);

        } catch (error) {
            console.error('Error exporting analytics data:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

module.exports = router;
