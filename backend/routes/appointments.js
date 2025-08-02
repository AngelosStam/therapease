/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment request (guest or logged-in client)     
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestName:
 *                 type: string
 *               guestEmail:
 *                 type: string
 *                 format: email
 *               guestPhone:
 *                 type: string (format: phone number)
 *               appointmentDate:
 *                 type: string (format: date-time)
 *               message:
 *                 type: string
 *             required:
 *               - guestName
 *               - guestEmail
 *               - guestPhone
 *               - appointmentDate
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'     
 * /api/appointments:
 *   get:
 *     summary: List all requests & sessions
 *     tags:
 *       - Appointments
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Appointment'
 * /api/appointments/my:
 *   get:   
 *     summary: Client-only: list their own approved upcoming sessions
 *     tags:     
 *       - Appointments
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Appointment' 
 * /api/appointments/:id:
 *   put:
 *     summary: Therapist-only: approve or reject an appointment request
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - approved
 *                   - rejected
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: OK  
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'   
 * /api/appointments/:id:
 *   delete:     
 *     summary: Therapist-only: delete an appointment request
 *     tags:
 *       - Appointments
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 */

// backend/routes/appointments.js

const express = require('express');
const Appointment = require('../models/Appointment');
const { ensureAuth, ensureTherapist } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/appointments
 * Create a new appointment request (guest or logged-in client)
 */
router.post('/', async (req, res) => {
    const {
        guestName,
        guestEmail,
        guestPhone,
        appointmentDate,
        message
    } = req.body;

    const appt = new Appointment({
        client: req.user && req.user.role === 'client' ? req.user._id : undefined,
        guestName: req.user && req.user.role === 'client' ? undefined : guestName,
        guestEmail: req.user && req.user.role === 'client' ? undefined : guestEmail,
        guestPhone: req.user && req.user.role === 'client' ? undefined : guestPhone,
        appointmentDate,
        message,
        status: 'pending'
    });

    const saved = await appt.save();
    res.status(201).json(saved);
});

/**
 * GET /api/appointments
 * Therapist-only: list all requests & sessions
 */
router.get('/', ensureAuth, ensureTherapist, async (req, res) => {
    const list = await Appointment.find()
        .populate('client', 'name email phone')
        .sort({ createdAt: -1 });
    res.json(list);
});

/**
 * PUT /api/appointments/:id
 * Therapist-only: approve (set date) or cancel
 */
router.put('/:id', ensureAuth, ensureTherapist, async (req, res) => {
    // no more ": any" annotation here
    const updates = {};
    if (req.body.appointmentDate) {
        updates.appointmentDate = req.body.appointmentDate;
        updates.status = 'approved';
    }
    if (req.body.status === 'cancelled') {
        updates.status = 'cancelled';
    }

    const appt = await Appointment.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
    ).populate('client', 'name email phone');

    if (!appt) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.json(appt);
});

/**
 * GET /api/appointments/my
 * Client-only: list their own approved upcoming sessions
 */
router.get('/my', ensureAuth, async (req, res) => {
    const list = await Appointment.find({
        client: req.user._id,
        status: 'approved'
    }).sort({ appointmentDate: -1 });

    res.json(list);
});

module.exports = router;
