// backend/middleware/authMiddleware.js
// ------------------------------------
// Verifies JWTs and enforces role‐based access

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: verify token and attach user to req.user
exports.protect = async (req, res, next) => {
    let token;

    // Expect header: Authorization: Bearer <token>
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user (minus password) to request
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Middleware: only allow therapists
exports.requireTherapist = (req, res, next) => {
    if (req.user.role !== 'therapist') {
        return res.status(403).json({ message: 'Requires therapist role' });
    }
    next();
};
