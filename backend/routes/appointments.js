// routes/appointments.js
// Wires Appointment routes to controller handlers

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/appointmentsController');

// Auth middleware (use whatever names your project exports)
let mw;
try { mw = require('../middleware/authMiddleware'); } catch { mw = {}; }
const authenticate =
    mw.authenticate || mw.protect || mw.verifyToken || mw.auth || ((_req, _res, next) => next());
const requireTherapist =
    mw.requireTherapist || mw.therapistOnly || mw.isTherapist || mw.onlyTherapist || ((_req, _res, next) => next());

// ---------- Public / Authenticated (creating requests) ----------
// Guests MUST be able to create requests → NO authenticate here
router.post('/', ctrl.create);

// ---------- Therapist lists ----------
router.get('/', authenticate, requireTherapist, ctrl.listAll);
router.get('/requests', authenticate, requireTherapist, ctrl.listRequests);

// ---------- Client lists ----------
router.get('/mine', authenticate, ctrl.listMyApproved);

// ---------- Per-date & overview (therapist) ----------
router.get('/by-date', authenticate, requireTherapist, ctrl.listByDate);
router.get('/overview', authenticate, requireTherapist, ctrl.monthOverview);

// ---------- Mutations (therapist) ----------
router.patch('/:id', authenticate, requireTherapist, ctrl.updateDate);
router.patch('/:id/approve', authenticate, requireTherapist, ctrl.approve);
router.patch('/:id/reject', authenticate, requireTherapist, ctrl.rejectRequest);
router.patch('/:id/cancel', authenticate, requireTherapist, ctrl.cancel);

module.exports = router;
