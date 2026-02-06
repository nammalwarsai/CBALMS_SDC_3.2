// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Supabase errors
    if (err.code && err.message && err.details !== undefined) {
        const statusCode = err.code === 'PGRST116' ? 404 : 400;
        return res.status(statusCode).json({
            error: err.message,
            code: err.code
        });
    }

    // Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            error: err.details.map(d => d.message).join(', ')
        });
    }

    // Custom application errors with status code
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }

    // Default 500 error
    res.status(500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'An unexpected error occurred. Please try again later.'
    });
};

module.exports = errorHandler;
