// controllers/appointmentsController.js
// Handles Appointment CRUD, therapist approvals, per‑date queries, and month overview.

const Appointment = require('../models/Appointment');

/** Utilities */
function dayWindowFromISO(iso) {
    const d = new Date(iso || Date.now());
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return { start, end };
}
function monthWindow(year, month) {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
    return { start, end };
}

/**
 * POST /api/appointments
 * Create a new appointment REQUEST.
 * - Guests can create (no auth required)
 * - If authenticated client: attach req.user.id as client
 * Status defaults to 'pending' for backward compatibility.
 */
exports.create = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (req.user && (req.user.role === 'client' || req.user.role === 'therapist')) {
            // Allow therapist to also create on someone's behalf if needed
            payload.client = payload.client || req.user.id;
        }

        if (!payload.status) payload.status = 'pending';

        const appt = await Appointment.create(payload);
        return res.status(201).json(appt);
    } catch (err) {
        console.error('appointmentsController.create error:', err);
        return res.status(400).json({ error: 'Failed to create appointment request' });
    }
};

/** GET /api/appointments (therapist: list ALL) */
exports.listAll = async (_req, res) => {
    try {
        const list = await Appointment.find({})
            .populate('client', 'firstName lastName email phone')
            .sort({ appointmentDate: 1, createdAt: -1 })
            .lean();

        return res.status(200).json(list);
    } catch (err) {
        console.error('appointmentsController.listAll error:', err);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

/** GET /api/appointments/mine (client: list my approved) */
exports.listMyApproved = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const list = await Appointment.find({
            client: req.user.id,
            status: 'approved'
        })
            .sort({ appointmentDate: 1 })
            .lean();

        return res.status(200).json(list);
    } catch (err) {
        console.error('appointmentsController.listMyApproved error:', err);
        return res.status(500).json({ error: 'Failed to fetch your appointments' });
    }
};

/** GET /api/appointments/requests (therapist: pending/requested) */
exports.listRequests = async (_req, res) => {
    try {
        const list = await Appointment.find({
            status: { $in: ['pending', 'requested'] }
        })
            .populate('client', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(list);
    } catch (err) {
        console.error('appointmentsController.listRequests error:', err);
        return res.status(500).json({ error: 'Failed to load appointment requests' });
    }
};

/**
 * PATCH /api/appointments/:id/approve (therapist)
 * Approve a request. If appointmentDate is provided in body, set it.
 * We keep approval lenient (no hard requirement to have appointmentDate),
 * but best UX is to set date/time first via PATCH /:id, then approve.
 */
exports.approve = async (req, res) => {
    try {
        const { id } = req.params;
        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        if (req.body && req.body.appointmentDate) {
            appt.appointmentDate = req.body.appointmentDate;
        }

        appt.status = 'approved';
        await appt.save();

        const populated = await Appointment.findById(appt._id)
            .populate('client', 'firstName lastName email phone')
            .lean();

        return res.status(200).json({ message: 'Approved', appointment: populated });
    } catch (err) {
        console.error('appointmentsController.approve error:', err);
        return res.status(500).json({ error: 'Failed to approve appointment' });
    }
};

/** PATCH /api/appointments/:id/reject (therapist) */
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        appt.status = 'rejected';
        await appt.save();

        return res.status(200).json({ message: 'Request rejected' });
    } catch (err) {
        console.error('appointmentsController.rejectRequest error:', err);
        return res.status(500).json({ error: 'Failed to reject request' });
    }
};

/**
 * PATCH /api/appointments/:id
 * Update appointment date/time (therapist action or client reschedule request).
 * Accepts { appointmentDate: ISOString }
 */
exports.updateDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate } = req.body;

        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        if (appointmentDate) appt.appointmentDate = appointmentDate;
        await appt.save();

        const populated = await Appointment.findById(appt._id)
            .populate('client', 'firstName lastName email phone')
            .lean();

        return res.status(200).json(populated);
    } catch (err) {
        console.error('appointmentsController.updateDate error:', err);
        return res.status(500).json({ error: 'Failed to update appointment' });
    }
};

/** PATCH /api/appointments/:id/cancel (therapist) */
exports.cancel = async (req, res) => {
    try {
        const { id } = req.params;
        const appt = await Appointment.findById(id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        appt.status = 'cancelled';
        await appt.save();

        return res.status(200).json({ message: 'Cancelled' });
    } catch (err) {
        console.error('appointmentsController.cancel error:', err);
        return res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};

/**
 * GET /api/appointments/by-date?date=ISO (therapist)
 * Return approved appointments for a specific day.
 */
exports.listByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const { start, end } = dayWindowFromISO(date);

        const list = await Appointment.find({
            status: 'approved',
            appointmentDate: { $gte: start, $lt: end }
        })
            .populate('client', 'firstName lastName email phone')
            .sort({ appointmentDate: 1 })
            .lean();

        return res.status(200).json(list);
    } catch (err) {
        console.error('appointmentsController.listByDate error:', err);
        return res.status(500).json({ error: 'Failed to fetch appointments for the day' });
    }
};

/**
 * GET /api/appointments/overview?year=YYYY&month=MM (therapist)
 * Month overview for approved appointments. Returns: { [yyyy-mm-dd]: count }
 */
exports.monthOverview = async (req, res) => {
    try {
        const year = parseInt(req.query.year, 10);
        const month = parseInt(req.query.month, 10); // 0-based expected from client
        if (Number.isNaN(year) || Number.isNaN(month)) {
            return res.status(400).json({ error: 'year and month (0-based) are required' });
        }

        const { start, end } = monthWindow(year, month);

        const rows = await Appointment.aggregate([
            {
                $match: {
                    status: 'approved',
                    appointmentDate: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const map = {};
        for (const r of rows) map[r._id] = r.count;

        return res.status(200).json(map);
    } catch (err) {
        console.error('appointmentsController.monthOverview error:', err);
        return res.status(500).json({ error: 'Failed to fetch month overview' });
    }
};
