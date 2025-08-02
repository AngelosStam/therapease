/**
 * @openapi
 * /api/clients/approved:
 *   get:
 *     summary: List approved clients
 *     tags:
 *       - Clients
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/User' 
 * /api/clients/pending:
 *   get:
 *     summary: List pending clients
 *     tags:
 *       - Clients
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/User' 
 * /api/clients/approve/{id}:
 *   put:
 *     summary: Approve a client
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *             required:
 *               - approved
 *     responses:
 *       200:
 *         description: OK         
 * /api/clients/reject/{id}:
 *   put:   
 *     summary: Reject a client
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:             
 *               approved:
 *                 type: boolean
 *             required:
 *               - approved
 *     responses:
 *       200:
 *         description: OK  
 */

// backend/routes/clients.js
const express = require('express')
const router = express.Router()
const User = require('../models/User')

// Middleware to protect therapist-only routes
function ensureTherapist(req, res, next) {
    // you probably already decode JWT and set req.user
    if (!req.user || req.user.role !== 'therapist') {
        return res.status(403).json({ message: 'Forbidden' })
    }
    next()
}

// GET /api/clients/approved
router.get('/approved', ensureTherapist, async (req, res) => {
    try {
        const clients = await User.find({ role: 'client', approved: true })
            .sort({ createdAt: -1 })
            .select('-password')  // never send hashes
        res.json(clients)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// GET /api/clients/pending
router.get('/pending', ensureTherapist, async (req, res) => {
    try {
        const clients = await User.find({ role: 'client', approved: false })
            .sort({ createdAt: -1 })
            .select('-password')
        res.json(clients)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// PUT /api/clients/approve/:id
router.put('/approve/:id', ensureTherapist, async (req, res) => {
    try {
        const client = await User.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        ).select('-password')
        if (!client) return res.status(404).json({ message: 'Not found' })
        res.json(client)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// PUT /api/clients/reject/:id
router.put('/reject/:id', ensureTherapist, async (req, res) => {
    try {
        // you can either delete or mark a separate flag, here we delete:
        const client = await User.findByIdAndDelete(req.params.id)
        if (!client) return res.status(404).json({ message: 'Not found' })
        res.json({ message: 'Rejected and deleted' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

module.exports = router
