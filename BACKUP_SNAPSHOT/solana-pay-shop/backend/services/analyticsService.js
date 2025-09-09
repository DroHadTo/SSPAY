/**
 * Analytics Service for Solana Pay Shop
 * Tracks payment success rates, popular products, and revenue metrics
 */

class AnalyticsService {
    constructor() {
        // In-memory storage (use database with proper time-series data in production)
        this.paymentEvents = [];
        this.productViews = new Map();
        this.salesData = [];
        this.userSessions = new Map();
        this.conversionFunnels = new Map();
        
        // Cache for performance
        this.analyticsCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Track payment attempt
     */
    async trackPaymentAttempt(paymentData) {
        const event = {
            id: this.generateEventId(),
            type: 'payment_attempt',
            paymentId: paymentData.paymentId,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentToken: paymentData.paymentToken,
            timestamp: new Date().toISOString(),
            userAgent: paymentData.userAgent,
            ipAddress: paymentData.ipAddress,
            metadata: paymentData.metadata || {}
        };

        this.paymentEvents.push(event);
        this.invalidateCache();
        
        console.log(`📊 Tracked payment attempt: ${paymentData.paymentId}`);
        return event;
    }

    /**
     * Track payment success
     */
    async trackPaymentSuccess(paymentData) {
        const event = {
            id: this.generateEventId(),
            type: 'payment_success',
            paymentId: paymentData.paymentId,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentToken: paymentData.paymentToken,
            transactionSignature: paymentData.signature,
            processingTime: paymentData.processingTime,
            timestamp: new Date().toISOString(),
            metadata: paymentData.metadata || {}
        };

        this.paymentEvents.push(event);
        
        // Track sale data
        this.salesData.push({
            id: this.generateEventId(),
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentToken: paymentData.paymentToken,
            items: paymentData.items || [],
            timestamp: new Date().toISOString()
        });

        this.invalidateCache();
        
        console.log(`📊 Tracked payment success: ${paymentData.paymentId}`);
        return event;
    }

    /**
     * Track payment failure
     */
    async trackPaymentFailure(paymentData) {
        const event = {
            id: this.generateEventId(),
            type: 'payment_failure',
            paymentId: paymentData.paymentId,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentToken: paymentData.paymentToken,
            errorCode: paymentData.errorCode,
            errorMessage: paymentData.errorMessage,
            timestamp: new Date().toISOString(),
            metadata: paymentData.metadata || {}
        };

        this.paymentEvents.push(event);
        this.invalidateCache();
        
        console.log(`📊 Tracked payment failure: ${paymentData.paymentId} - ${paymentData.errorMessage}`);
        return event;
    }

    /**
     * Track product view
     */
    async trackProductView(productId, productName, sessionId, metadata = {}) {
        const viewKey = `${productId}_${sessionId}`;
        const timestamp = new Date().toISOString();

        if (!this.productViews.has(productId)) {
            this.productViews.set(productId, {
                productId,
                productName,
                totalViews: 0,
                uniqueViews: 0,
                sessions: new Set(),
                viewHistory: []
            });
        }

        const productData = this.productViews.get(productId);
        productData.totalViews++;
        
        // Track unique views
        if (!productData.sessions.has(sessionId)) {
            productData.sessions.add(sessionId);
            productData.uniqueViews++;
        }

        // Track view history
        productData.viewHistory.push({
            sessionId,
            timestamp,
            metadata
        });

        // Keep only last 1000 views
        if (productData.viewHistory.length > 1000) {
            productData.viewHistory = productData.viewHistory.slice(-1000);
        }

        this.invalidateCache();
        return productData;
    }

    /**
     * Track user session
     */
    async trackUserSession(sessionId, data) {
        if (!this.userSessions.has(sessionId)) {
            this.userSessions.set(sessionId, {
                sessionId,
                startTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                pageViews: [],
                events: [],
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                referrer: data.referrer
            });
        }

        const session = this.userSessions.get(sessionId);
        session.lastActivity = new Date().toISOString();
        
        if (data.pageView) {
            session.pageViews.push({
                page: data.pageView,
                timestamp: new Date().toISOString()
            });
        }

        if (data.event) {
            session.events.push({
                event: data.event,
                timestamp: new Date().toISOString(),
                data: data.eventData
            });
        }

        return session;
    }

    /**
     * Get payment success rate
     */
    async getPaymentSuccessRate(timeframe = '30d') {
        const cacheKey = `payment_success_rate_${timeframe}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));

        const relevantEvents = this.paymentEvents.filter(event => 
            new Date(event.timestamp) >= startDate
        );

        const attempts = relevantEvents.filter(e => e.type === 'payment_attempt').length;
        const successes = relevantEvents.filter(e => e.type === 'payment_success').length;
        const failures = relevantEvents.filter(e => e.type === 'payment_failure').length;

        const successRate = attempts > 0 ? (successes / attempts) * 100 : 0;

        // Token breakdown
        const tokenBreakdown = {};
        relevantEvents.forEach(event => {
            const token = event.paymentToken || 'SOL';
            if (!tokenBreakdown[token]) {
                tokenBreakdown[token] = { attempts: 0, successes: 0, failures: 0 };
            }
            tokenBreakdown[token][event.type === 'payment_attempt' ? 'attempts' : 
                                  event.type === 'payment_success' ? 'successes' : 'failures']++;
        });

        // Calculate success rates per token
        Object.keys(tokenBreakdown).forEach(token => {
            const data = tokenBreakdown[token];
            data.successRate = data.attempts > 0 ? (data.successes / data.attempts) * 100 : 0;
        });

        const result = {
            timeframe,
            totalAttempts: attempts,
            totalSuccesses: successes,
            totalFailures: failures,
            successRate: Math.round(successRate * 100) / 100,
            tokenBreakdown,
            generatedAt: new Date().toISOString()
        };

        this.setCache(cacheKey, result);
        return result;
    }

    /**
     * Get popular products
     */
    async getPopularProducts(timeframe = '30d', limit = 10) {
        const cacheKey = `popular_products_${timeframe}_${limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Get product data from views and sales
        const productStats = new Map();

        // Track views
        for (const [productId, viewData] of this.productViews.entries()) {
            const recentViews = viewData.viewHistory.filter(view => 
                new Date(view.timestamp) >= startDate
            );

            if (recentViews.length > 0) {
                productStats.set(productId, {
                    productId,
                    productName: viewData.productName,
                    views: recentViews.length,
                    uniqueViews: new Set(recentViews.map(v => v.sessionId)).size,
                    sales: 0,
                    revenue: 0
                });
            }
        }

        // Track sales
        const recentSales = this.salesData.filter(sale => 
            new Date(sale.timestamp) >= startDate
        );

        recentSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const stats = productStats.get(item.id) || {
                        productId: item.id,
                        productName: item.name,
                        views: 0,
                        uniqueViews: 0,
                        sales: 0,
                        revenue: 0
                    };

                    stats.sales += item.quantity;
                    stats.revenue += item.price * item.quantity;
                    productStats.set(item.id, stats);
                });
            }
        });

        // Calculate popularity score (views + sales * 10)
        const popularProducts = Array.from(productStats.values())
            .map(product => ({
                ...product,
                popularityScore: product.views + (product.sales * 10),
                conversionRate: product.views > 0 ? (product.sales / product.views) * 100 : 0
            }))
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);

        const result = {
            timeframe,
            products: popularProducts,
            totalProducts: productStats.size,
            generatedAt: new Date().toISOString()
        };

        this.setCache(cacheKey, result);
        return result;
    }

    /**
     * Get revenue tracking data
     */
    async getRevenueTracking(timeframe = '30d', groupBy = 'day') {
        const cacheKey = `revenue_tracking_${timeframe}_${groupBy}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));

        const recentSales = this.salesData.filter(sale => 
            new Date(sale.timestamp) >= startDate
        );

        // Group sales by time period
        const revenueByPeriod = new Map();
        const paymentTokenRevenue = new Map();
        
        recentSales.forEach(sale => {
            const date = new Date(sale.timestamp);
            let periodKey;

            if (groupBy === 'day') {
                periodKey = date.toISOString().split('T')[0];
            } else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
            } else if (groupBy === 'month') {
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            // Revenue by period
            if (!revenueByPeriod.has(periodKey)) {
                revenueByPeriod.set(periodKey, {
                    period: periodKey,
                    revenue: 0,
                    orders: 0,
                    averageOrderValue: 0
                });
            }
            const periodData = revenueByPeriod.get(periodKey);
            periodData.revenue += sale.amount;
            periodData.orders++;
            periodData.averageOrderValue = periodData.revenue / periodData.orders;

            // Revenue by payment token
            const token = sale.paymentToken || 'SOL';
            if (!paymentTokenRevenue.has(token)) {
                paymentTokenRevenue.set(token, { revenue: 0, orders: 0 });
            }
            const tokenData = paymentTokenRevenue.get(token);
            tokenData.revenue += sale.amount;
            tokenData.orders++;
        });

        const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.amount, 0);
        const totalOrders = recentSales.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const result = {
            timeframe,
            groupBy,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            revenueByPeriod: Array.from(revenueByPeriod.values()).sort((a, b) => a.period.localeCompare(b.period)),
            paymentTokenRevenue: Object.fromEntries(paymentTokenRevenue),
            generatedAt: new Date().toISOString()
        };

        this.setCache(cacheKey, result);
        return result;
    }

    /**
     * Get comprehensive analytics dashboard
     */
    async getAnalyticsDashboard(timeframe = '30d') {
        const [
            paymentMetrics,
            popularProducts,
            revenueData,
            conversionFunnel
        ] = await Promise.all([
            this.getPaymentSuccessRate(timeframe),
            this.getPopularProducts(timeframe, 5),
            this.getRevenueTracking(timeframe),
            this.getConversionFunnel(timeframe)
        ]);

        return {
            timeframe,
            overview: {
                totalRevenue: revenueData.totalRevenue,
                totalOrders: revenueData.totalOrders,
                averageOrderValue: revenueData.averageOrderValue,
                paymentSuccessRate: paymentMetrics.successRate,
                totalPaymentAttempts: paymentMetrics.totalAttempts
            },
            paymentMetrics,
            popularProducts,
            revenueData,
            conversionFunnel,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get conversion funnel data
     */
    async getConversionFunnel(timeframe = '30d') {
        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Calculate funnel metrics
        const totalSessions = Array.from(this.userSessions.values())
            .filter(session => new Date(session.startTime) >= startDate).length;

        const productViews = Array.from(this.productViews.values())
            .reduce((sum, product) => {
                const recentViews = product.viewHistory.filter(view => 
                    new Date(view.timestamp) >= startDate
                );
                return sum + recentViews.length;
            }, 0);

        const paymentAttempts = this.paymentEvents.filter(event => 
            event.type === 'payment_attempt' && 
            new Date(event.timestamp) >= startDate
        ).length;

        const completedPurchases = this.paymentEvents.filter(event => 
            event.type === 'payment_success' && 
            new Date(event.timestamp) >= startDate
        ).length;

        return {
            timeframe,
            funnel: [
                {
                    stage: 'Visitors',
                    count: totalSessions,
                    percentage: 100,
                    conversionRate: 100
                },
                {
                    stage: 'Product Views',
                    count: productViews,
                    percentage: totalSessions > 0 ? (productViews / totalSessions) * 100 : 0,
                    conversionRate: totalSessions > 0 ? (productViews / totalSessions) * 100 : 0
                },
                {
                    stage: 'Payment Attempts',
                    count: paymentAttempts,
                    percentage: totalSessions > 0 ? (paymentAttempts / totalSessions) * 100 : 0,
                    conversionRate: productViews > 0 ? (paymentAttempts / productViews) * 100 : 0
                },
                {
                    stage: 'Completed Purchases',
                    count: completedPurchases,
                    percentage: totalSessions > 0 ? (completedPurchases / totalSessions) * 100 : 0,
                    conversionRate: paymentAttempts > 0 ? (completedPurchases / paymentAttempts) * 100 : 0
                }
            ],
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.analyticsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.analyticsCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    invalidateCache() {
        this.analyticsCache.clear();
    }

    /**
     * Generate event ID
     */
    generateEventId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export analytics data to CSV
     */
    exportAnalyticsCSV(type, timeframe = '30d') {
        switch (type) {
            case 'payments':
                return this.exportPaymentEvents(timeframe);
            case 'sales':
                return this.exportSalesData(timeframe);
            case 'product_views':
                return this.exportProductViews(timeframe);
            default:
                throw new Error('Invalid export type');
        }
    }

    exportPaymentEvents(timeframe) {
        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));
        
        const events = this.paymentEvents.filter(event => 
            new Date(event.timestamp) >= startDate
        );

        const headers = ['Timestamp', 'Type', 'Payment ID', 'Order ID', 'Amount', 'Currency', 'Payment Token', 'Status'];
        const rows = events.map(event => [
            event.timestamp,
            event.type,
            event.paymentId,
            event.orderId,
            event.amount,
            event.currency,
            event.paymentToken,
            event.type === 'payment_success' ? 'Success' : event.type === 'payment_failure' ? 'Failed' : 'Attempted'
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    exportSalesData(timeframe) {
        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));
        
        const sales = this.salesData.filter(sale => 
            new Date(sale.timestamp) >= startDate
        );

        const headers = ['Timestamp', 'Order ID', 'Amount', 'Currency', 'Payment Token', 'Items'];
        const rows = sales.map(sale => [
            sale.timestamp,
            sale.orderId,
            sale.amount,
            sale.currency,
            sale.paymentToken,
            sale.items ? sale.items.map(item => `${item.name} x${item.quantity}`).join('; ') : ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

module.exports = AnalyticsService;
