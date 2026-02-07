const crypto = require('crypto');

/**
 * Middleware that attaches a unique request ID to every request.
 * The ID is available as req.requestId and included in the response header X-Request-Id.
 */
const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
};

module.exports = requestId;
