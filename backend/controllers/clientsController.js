// controllers/clientsController.js
// Therapist tools: list clients & pending requests, approve / reject

const User = require('../models/User');

// GET /api/clients
// Returns APPROVED clients
exports.getClients = async (req, res) => {
    try {
        const clients = await User.find({ role: 'client', status: 'approved' })
            .sort({ approvedAt: -1, lastName: 1, firstName: 1 })
            .lean();

        return res.status(200).json(clients);
    } catch (err) {
        console.error('getClients error:', err);
        return res.status(500).json({ error: 'Failed to load clients' });
    }
};

// GET /api/clients/pending
// Returns PENDING registration requests
exports.getPending = async (req, res) => {
    try {
        const pending = await User.find({ role: 'client', status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(pending);
    } catch (err) {
        console.error('getPending error:', err);
        return res.status(500).json({ error: 'Failed to load pending requests' });
    }
};

// PATCH /api/clients/:id/approve
// Approve client and set approvedAt
exports.approveClient = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await User.findById(id);

        if (!client) return res.status(404).json({ error: 'Client not found' });
        if (client.role !== 'client')
            return res.status(400).json({ error: 'Only clients can be approved' });

        client.status = 'approved';

        // Set approvedAt only if not already set (idempotent)
        if (!client.approvedAt) {
            client.approvedAt = new Date();
        }

        await client.save();

        return res.status(200).json({
            message: 'Client approved',
            client: {
                _id: client._id,
                firstName: client.firstName,
                lastName: client.lastName,
                phone: client.phone,
                email: client.email,
                role: client.role,
                status: client.status,
                approvedAt: client.approvedAt,
                createdAt: client.createdAt,
                updatedAt: client.updatedAt
            }
        });
    } catch (err) {
        console.error('approveClient error:', err);
        return res.status(500).json({ error: 'Approval failed' });
    }
};

// PATCH /api/clients/:id/reject
// Reject client and clear approvedAt if any
exports.rejectClient = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await User.findById(id);

        if (!client) return res.status(404).json({ error: 'Client not found' });
        if (client.role !== 'client')
            return res.status(400).json({ error: 'Only clients can be rejected' });

        client.status = 'rejected';
        client.approvedAt = null; // ensure this is not set for rejected users

        await client.save();

        return res.status(200).json({ message: 'Client rejected' });
    } catch (err) {
        console.error('rejectClient error:', err);
        return res.status(500).json({ error: 'Rejection failed' });
    }
};
