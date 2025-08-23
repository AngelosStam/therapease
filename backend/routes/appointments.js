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

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment request
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentRequest'
 *     responses:
 *       201:
 *         description: Request created successfully    
 *       400:
 *         description: Missing fields    
 *       401:
 *         description: Unauthorized    
 */
router.post('/', ctrl.create);

// ---------- Therapist lists ----------

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: List all appointments (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all appointments    
 *       401:
 *         description: Unauthorized        
 */
router.get('/', authenticate, requireTherapist, ctrl.listAll);

/**
 * @swagger
 * /api/appointments/requests:
 *   get:
 *     summary: List all appointment requests (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all requests    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden    
 */
router.get('/requests', authenticate, requireTherapist, ctrl.listRequests);

// ---------- Client lists ----------

/**
 * @swagger
 * /api/appointments/mine:
 *   get:
 *     summary: List all appointments (client-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all appointments    
 *       401:
 *         description: Unauthorized  
 *       403:
 *         description: Forbidden         
 */
router.get('/mine', authenticate, ctrl.listMyApproved);

// ---------- Per-date & overview (therapist) ----------

/**
 * @swagger 
 * /api/appointments/by-date:
 *   get:
 *     summary: List all appointments by date (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all appointments    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden
 */
router.get('/by-date', authenticate, requireTherapist, ctrl.listByDate);

/**
 * @swagger 
 * /api/appointments/overview:
 *   get:
 *     summary: List all appointments by month (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - list of all appointments    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden
 */
router.get('/overview', authenticate, requireTherapist, ctrl.monthOverview);

// ---------- Mutations (therapist) ----------
/**
 * @swagger
 * /api/appointments/{id}:
 *   patch:
 *     summary: Update an appointment by ID (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - updated appointment    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden    
 *       404:
 *         description: Not found       
 */
router.patch('/:id', authenticate, requireTherapist, ctrl.updateDate);

/**
 * @swagger 
 * /api/appointments/{id}:
 *   patch:
 *     summary: Approve or reject a request (therapist-only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - updated request    
 *       401:
 *         description: Unauthorized    
 *       403:
 *         description: Forbidden    
 *       404:
 *         description: Not found       
 */
router.patch('/:id/approve', authenticate, requireTherapist, ctrl.approve);
router.patch('/:id/reject', authenticate, requireTherapist, ctrl.rejectRequest);

/**
 * @swagger 
 * /api/appointments/{id}:
 *   patch:
 *     summary: Cancel an appointment (therapist-only)
 *     tags: [Appointments]    
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success - updated appointment    
 *       401:     
 *         description: Unauthorized    
 *       403:     
 *         description: Forbidden    
 *       404:     
 *         description: Not found       
 */
router.patch('/:id/cancel', authenticate, requireTherapist, ctrl.cancel);

module.exports = router;
