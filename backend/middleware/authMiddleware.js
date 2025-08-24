/**
 * middleware/authMiddleware.js
 * - authenticate: verifies JWT and attaches req.user
 * - requireTherapist: ensures logged-in user is therapist
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Missing token' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);
        if (!user) return res.status(401).json({ error: 'Invalid token user' });

        req.user = user;
        next();
    } catch (err) {
        err.status = 401;
        next(err);
    }
};

const requireTherapist = (req, res, next) => {
    if (!req.user || req.user.role !== 'therapist') {
        return res.status(403).json({ error: 'Therapist access required' });
    }
    next();
};

module.exports = { authenticate, requireTherapist };
