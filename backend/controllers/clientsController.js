// controllers/clientsController.js
// Therapist-facing client management: list approved/pending, approve, reject.

const mongoose = require('mongoose');
const User = require('../models/User');

// The only therapist allowed to approve/reject per project spec.
const THERAPIST_EMAIL = 'angelos_stamatis@outlook.com';

/**
 * Helper to assert the caller is the main therapist.
 * Assumes auth middleware has attached req.user with { email, role }.
 */
function assertMainTherapist(req) {
    if (!req.user) {
        const err = new Error('Unauthorized');
        err.status = 401;
        throw err;
    }
    // Must be therapist AND match the main therapist email
    const isTherapist = req.user.role === 'therapist';
    const isOwner = (req.user.email || '').toLowerCase() === THERAPIST_EMAIL.toLowerCase();
    if (!isTherapist || !isOwner) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }
}

/**
 * GET /api/clients
 * List approved clients (for therapist)
 */
exports.getClients = async function getClients(_req, res) {
    try {
        const clients = await User.find({ role: 'client', status: 'approved' })
            .select('_id firstName lastName email phone role status createdAt updatedAt approvedAt')
            .sort({ approvedAt: -1, createdAt: -1 })
            .lean();

        res.json(clients);
    } catch (e) {
        console.error('getClients error:', e);
        res.status(500).json({ error: 'Failed to load clients' });
    }
};

/**
 * GET /api/clients/pending
 * List pending registration requests (for therapist)
 */
exports.getPending = async function getPending(_req, res) {
    try {
        const pending = await User.find({ role: 'client', status: 'pending' })
            .select('_id firstName lastName email phone role status createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json(pending);
    } catch (e) {
        console.error('getPending error:', e);
        res.status(500).json({ error: 'Failed to load pending registrations' });
    }
};

/**
 * PATCH /api/clients/:id/approve
 * Approve a client registration (main therapist only)
 */
exports.approveClient = async function approveClient(req, res) {
    try {
        assertMainTherapist(req);

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid client id' });
        }

        const updated = await User.findOneAndUpdate(
            { _id: id, role: 'client' },
            { $set: { status: 'approved', approvedAt: new Date() } },
            { new: true, projection: '_id firstName lastName email phone role status createdAt updatedAt approvedAt' }
        ).lean();

        if (!updated) return res.status(404).json({ error: 'Client not found' });

        return res.json({ message: 'Client approved', client: updated });
    } catch (e) {
        console.error('approveClient error:', e);
        res.status(e.status || 500).json({ error: e.message || 'Failed to approve client' });
    }
};

/**
 * PATCH /api/clients/:id/reject
 * Reject a client registration (main therapist only)
 */
exports.rejectClient = async function rejectClient(req, res) {
    try {
        assertMainTherapist(req);

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid client id' });
        }

        const updated = await User.findOneAndUpdate(
            { _id: id, role: 'client' },
            { $set: { status: 'rejected' } },
            { new: true, projection: '_id firstName lastName email phone role status createdAt updatedAt approvedAt' }
        ).lean();

        if (!updated) return res.status(404).json({ error: 'Client not found' });

        return res.json({ message: 'Client rejected', client: updated });
    } catch (e) {
        console.error('rejectClient error:', e);
        res.status(e.status || 500).json({ error: e.message || 'Failed to reject client' });
    }
};
