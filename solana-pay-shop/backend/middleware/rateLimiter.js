/**
 * Rate Limiting Middleware for Solana Pay Shop API
 * Implements different rate limits for different endpoint types
 */

class RateLimitStore {
    constructor() {
        this.requests = new Map();
    }

    increment(key) {
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        
        const requests = this.requests.get(key);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < windowMs);
        validRequests.push(now);
        
        this.requests.set(key, validRequests);
        
        return {
            totalHits: validRequests.length,
            resetTime: new Date(now + windowMs)
        };
    }

    reset(key) {
        this.requests.delete(key);
    }
}

const store = new RateLimitStore();

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 */
function createRateLimit(options = {}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100,
        message = 'Too many requests, please try again later.',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress,
        standardHeaders = true,
        legacyHeaders = false
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const result = store.increment(key);

        if (standardHeaders) {
            res.set({
                'X-RateLimit-Limit': max,
                'X-RateLimit-Remaining': Math.max(0, max - result.totalHits),
                'X-RateLimit-Reset': result.resetTime.toISOString()
            });
        }

        if (legacyHeaders) {
            res.set({
                'X-Rate-Limit-Limit': max,
                'X-Rate-Limit-Remaining': Math.max(0, max - result.totalHits),
                'X-Rate-Limit-Reset': result.resetTime.toISOString()
            });
        }

        if (result.totalHits > max) {
            console.warn(`⚠️  Rate limit exceeded for ${key}: ${result.totalHits}/${max} requests`);
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        console.log(`📊 Rate limit check for ${key}: ${result.totalHits}/${max} requests`);
        next();
    };
}

// Predefined rate limiters for different use cases
const rateLimiters = {
    // General API rate limit - 100 requests per 15 minutes
    general: createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many API requests. Please try again in 15 minutes.'
    }),

    // Payment endpoints - stricter limit (20 requests per 15 minutes)
    payment: createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: 'Too many payment requests. Please try again in 15 minutes.'
    }),

    // Product endpoints - more lenient (200 requests per 15 minutes)
    products: createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        message: 'Too many product requests. Please try again in 15 minutes.'
    }),

    // Strict rate limit for sensitive operations (5 requests per 15 minutes)
    strict: createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Rate limit exceeded for sensitive operation. Please try again in 15 minutes.'
    })
};

module.exports = {
    createRateLimit,
    rateLimiters,
    store
};
