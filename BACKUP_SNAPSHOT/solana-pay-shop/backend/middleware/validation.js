/**
 * Input Validation Middleware for Solana Pay Shop API
 * Validates and sanitizes incoming request data
 */

const { PublicKey } = require('@solana/web3.js');

/**
 * Validation schema definitions
 */
const validationSchemas = {
    payment: {
        createPayment: {
            required: ['items', 'total'],
            fields: {
                items: {
                    type: 'array',
                    minLength: 1,
                    maxLength: 50,
                    itemSchema: {
                        required: ['id', 'name', 'price', 'quantity'],
                        fields: {
                            id: { type: 'number', min: 1 },
                            name: { type: 'string', minLength: 1, maxLength: 100 },
                            price: { type: 'number', min: 0.01, max: 10000 },
                            quantity: { type: 'number', min: 1, max: 100 }
                        }
                    }
                },
                total: { type: 'number', min: 0.01, max: 50000 },
                currency: { type: 'string', enum: ['USD', 'SOL'], default: 'USD' },
                paymentToken: { type: 'string', enum: ['SOL', 'USDC', 'USDT'], default: 'SOL' },
                recipient: { type: 'string', validator: 'solanaAddress', optional: true },
                memo: { type: 'string', maxLength: 280, optional: true }
            }
        },
        verifyPayment: {
            required: ['paymentId', 'signature'],
            fields: {
                paymentId: { type: 'string', pattern: /^[a-zA-Z0-9_-]+$/, maxLength: 100 },
                signature: { type: 'string', minLength: 80, maxLength: 100 }
            }
        }
    },
    orders: {
        getOrder: {
            required: ['orderId'],
            fields: {
                orderId: { type: 'string', pattern: /^[a-zA-Z0-9_-]+$/, maxLength: 100 }
            }
        }
    }
};

/**
 * Custom validators
 */
const customValidators = {
    solanaAddress: (value) => {
        try {
            new PublicKey(value);
            return true;
        } catch {
            return false;
        }
    },
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    uuid: (value) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
};

/**
 * Sanitize string input
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove HTML tags and potential XSS
    return str
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
}

/**
 * Validate field against schema
 */
function validateField(value, fieldSchema, fieldName) {
    const errors = [];

    // Check required
    if (value === undefined || value === null) {
        if (!fieldSchema.optional) {
            errors.push(`${fieldName} is required`);
        }
        return errors;
    }

    // Apply default value
    if (value === undefined && fieldSchema.default !== undefined) {
        value = fieldSchema.default;
    }

    // Type validation
    if (fieldSchema.type) {
        switch (fieldSchema.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`${fieldName} must be a string`);
                    break;
                }
                value = sanitizeString(value);
                
                if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                    errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters`);
                }
                if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                    errors.push(`${fieldName} must be no more than ${fieldSchema.maxLength} characters`);
                }
                if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
                    errors.push(`${fieldName} format is invalid`);
                }
                if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
                    errors.push(`${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`);
                }
                break;

            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`${fieldName} must be a number`);
                    break;
                }
                value = num;
                
                if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                    errors.push(`${fieldName} must be at least ${fieldSchema.min}`);
                }
                if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                    errors.push(`${fieldName} must be no more than ${fieldSchema.max}`);
                }
                break;

            case 'array':
                if (!Array.isArray(value)) {
                    errors.push(`${fieldName} must be an array`);
                    break;
                }
                
                if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                    errors.push(`${fieldName} must have at least ${fieldSchema.minLength} items`);
                }
                if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                    errors.push(`${fieldName} must have no more than ${fieldSchema.maxLength} items`);
                }
                
                // Validate array items
                if (fieldSchema.itemSchema) {
                    value.forEach((item, index) => {
                        const itemErrors = validateObject(item, fieldSchema.itemSchema, `${fieldName}[${index}]`);
                        errors.push(...itemErrors);
                    });
                }
                break;

            case 'boolean':
                if (typeof value !== 'boolean') {
                    errors.push(`${fieldName} must be a boolean`);
                }
                break;
        }
    }

    // Custom validator
    if (fieldSchema.validator && customValidators[fieldSchema.validator]) {
        if (!customValidators[fieldSchema.validator](value)) {
            errors.push(`${fieldName} is not a valid ${fieldSchema.validator}`);
        }
    }

    return errors;
}

/**
 * Validate object against schema
 */
function validateObject(data, schema, prefix = '') {
    const errors = [];
    const validatedData = {};

    // Check required fields
    if (schema.required) {
        for (const requiredField of schema.required) {
            if (!(requiredField in data)) {
                errors.push(`${prefix ? prefix + '.' : ''}${requiredField} is required`);
            }
        }
    }

    // Validate each field
    if (schema.fields) {
        for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
            const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
            const fieldErrors = validateField(data[fieldName], fieldSchema, fullFieldName);
            errors.push(...fieldErrors);

            // Add sanitized value to validated data
            if (fieldErrors.length === 0) {
                validatedData[fieldName] = data[fieldName];
            }
        }
    }

    return errors;
}

/**
 * Create validation middleware
 */
function createValidator(schemaPath) {
    return (req, res, next) => {
        try {
            console.log(`🔍 Validating request: ${req.method} ${req.originalUrl}`);
            
            // Get schema
            const schemaParts = schemaPath.split('.');
            let schema = validationSchemas;
            for (const part of schemaParts) {
                schema = schema[part];
                if (!schema) {
                    throw new Error(`Validation schema not found: ${schemaPath}`);
                }
            }

            // Validate request body
            let errors = [];
            if (req.body && Object.keys(req.body).length > 0) {
                errors = validateObject(req.body, schema);
            } else if (schema.required && schema.required.length > 0) {
                errors.push('Request body is required');
            }

            // Validate query parameters if schema includes them
            if (schema.query) {
                const queryErrors = validateObject(req.query, schema.query, 'query');
                errors.push(...queryErrors);
            }

            // Validate URL parameters if schema includes them
            if (schema.params) {
                const paramErrors = validateObject(req.params, schema.params, 'params');
                errors.push(...paramErrors);
            }

            if (errors.length > 0) {
                console.warn(`❌ Validation failed for ${req.originalUrl}:`, errors);
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Invalid request data',
                    details: errors
                });
            }

            console.log(`✅ Validation passed for ${req.originalUrl}`);
            next();
        } catch (error) {
            console.error('Validation middleware error:', error);
            res.status(500).json({
                error: 'Internal validation error',
                message: 'Request validation failed'
            });
        }
    };
}

// Predefined validators
const validators = {
    payment: {
        createPayment: createValidator('payment.createPayment'),
        verifyPayment: createValidator('payment.verifyPayment')
    },
    orders: {
        getOrder: createValidator('orders.getOrder')
    }
};

module.exports = {
    createValidator,
    validators,
    validationSchemas,
    customValidators,
    sanitizeString
};
