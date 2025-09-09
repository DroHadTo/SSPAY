const express = require('express');
const router = express.Router();
const printifyService = require('../services/printifyService');

// GET /api/printify/test - Test Printify API connection
router.get('/test', async (req, res, next) => {
    try {
        const result = await printifyService.testConnection();
        res.json(result);
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            message: 'Failed to test Printify connection'
        });
    }
});

// GET /api/printify/status - Get comprehensive Printify service status
router.get('/status', async (req, res, next) => {
    try {
        const connectionTest = await printifyService.testConnection();
        const shopInfo = connectionTest.success ? await printifyService.getShopInfo() : null;
        
        res.json({
            success: true,
            connection: connectionTest,
            shop: shopInfo,
            features: {
                rateLimiting: true,
                errorHandling: true,
                categoryDetection: true,
                orderManagement: true,
                shippingCalculation: true,
                productTransformation: true
            },
            version: '2.0.0'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            message: 'Failed to get Printify service status'
        });
    }
});

// GET /api/printify/shops - Get Printify shops
router.get('/shops', async (req, res, next) => {
    try {
        const shops = await printifyService.getShops();
        res.json({
            success: true,
            data: shops
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/printify/products - Get Printify products
router.get('/products', async (req, res, next) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const products = await printifyService.getProducts(page, limit);
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/printify/products/:id - Get single Printify product
router.get('/products/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await printifyService.getProduct(id);
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/printify/catalog - Get Printify catalog
router.get('/catalog', async (req, res, next) => {
    try {
        const catalog = await printifyService.getCatalog();
        res.json({
            success: true,
            data: catalog
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/printify/blueprints/:id - Get blueprint details
router.get('/blueprints/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const blueprint = await printifyService.getBlueprint(id);
        res.json({
            success: true,
            data: blueprint
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/printify/orders - Get Printify orders
router.get('/orders', async (req, res, next) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const orders = await printifyService.getOrders(page, limit);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
