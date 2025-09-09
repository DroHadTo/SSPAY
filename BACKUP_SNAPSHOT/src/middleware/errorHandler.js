const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error
    let error = {
        message: 'Internal Server Error',
        status: 500
    };

    // Validation errors
    if (err.name === 'ValidationError') {
        error.message = 'Validation Error';
        error.details = err.errors;
        error.status = 400;
    }

    // Sequelize errors
    if (err.name === 'SequelizeValidationError') {
        error.message = 'Database Validation Error';
        error.details = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        error.status = 400;
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        error.message = 'Duplicate Entry';
        error.details = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        error.status = 409;
    }

    // Custom application errors
    if (err.status && err.message) {
        error.message = err.message;
        error.status = err.status;
    }

    // API specific errors
    if (err.response && err.response.data) {
        error.message = 'External API Error';
        error.details = err.response.data;
        error.status = err.response.status || 500;
    }

    // Don't expose stack traces in production
    if (process.env.NODE_ENV === 'production') {
        delete err.stack;
    } else {
        error.stack = err.stack;
    }

    res.status(error.status).json({
        error: error.message,
        ...(error.details && { details: error.details }),
        ...(error.stack && { stack: error.stack }),
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
