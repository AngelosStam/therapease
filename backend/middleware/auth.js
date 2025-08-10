// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// Decode JWT → req.user
function authMiddleware(req, res, next) {
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const { user } = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
        } catch {
            // invalid token
        }
    }
    next();
}

// Require authenticated user
function ensureAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
}

// Require therapist role
function ensureTherapist(req, res, next) {
    if (!req.user || req.user.role !== 'therapist') {
        return res.status(403).json({ message: 'Forbidden: therapist only' });
    }
    next();
}

module.exports = {
    authMiddleware,
    ensureAuth,
    ensureTherapist
};
