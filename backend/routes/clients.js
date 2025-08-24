// routes/clients.js
// Therapist-facing routes for client management (list approved, list pending, approve, reject)

const express = require('express');
const router = express.Router();

// Controllers
const ctrl = require('../controllers/clientsController');
const getClients = ctrl.getClients;
const getPending = ctrl.getPending;
const approveClient = ctrl.approveClient;
const rejectClient = ctrl.rejectClient;

// Auth middleware
const mw = require('../middleware/authMiddleware') || {};
// These should exist in your middleware; we fall back to permissive no-ops if not.
const authenticate = mw.authenticate || mw.protect || mw.verifyToken || ((req, _res, next) => next());
const requireTherapist = mw.requireTherapist || mw.therapistOnly || mw.isTherapist || ((req, _res, next) => next());

// Routes
router.get('/', authenticate, requireTherapist, getClients);
router.get('/pending', authenticate, requireTherapist, getPending);
router.patch('/:id/approve', authenticate, requireTherapist, approveClient);
router.patch('/:id/reject', authenticate, requireTherapist, rejectClient);

module.exports = router;
