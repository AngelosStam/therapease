// controllers/appointmentsController.js
// Handles Appointment CRUD, therapist approvals, per‑date queries, month overview, and therapist scheduling (recurring).

const crypto = require('crypto');
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

exports.create = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (req.user && (req.user.role === 'client' || req.user.role === 'therapist')) {
            payload.client = payload.client || req.user.id;
        }
        if (!payload.status) payload.status = 'pending';
        if (!payload.recurrenceFrequency) payload.recurrenceFrequency = 'none';

        const appt = await Appointment.create(payload);
        return res.status(201).json(appt);
    } catch (err) {
        console.error('appointmentsController.create error:', err);
        return res.status(400).json({ error: 'Failed to create appointment request' });
    }
};

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

exports.monthOverview = async (req, res) => {
    try {
        const year = parseInt(req.query.year, 10);
        const month = parseInt(req.query.month, 10); // 0-based expected
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

// ====== NEW: Therapist scheduling for clients ======

exports.createForClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { appointmentDate } = req.body || {};
        if (!appointmentDate) return res.status(400).json({ error: 'appointmentDate is required' });

        const appt = await Appointment.create({
            client: clientId,
            appointmentDate,
            status: 'approved',
            recurrenceFrequency: 'none'
        });

        const populated = await Appointment.findById(appt._id)
            .populate('client', 'firstName lastName email phone')
            .lean();

        return res.status(201).json(populated);
    } catch (err) {
        console.error('appointmentsController.createForClient error:', err);
        return res.status(500).json({ error: 'Failed to schedule appointment' });
    }
};

/**
 * POST /api/appointments/client/:clientId/recurring
 * Body: { startDate: ISOString, frequency: 'weekly'|'biweekly'|'monthly', endDate: ISOString }
 * Creates occurrences up to and including endDate (safety cap applied).
 */
exports.createRecurringForClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { startDate, frequency, endDate } = req.body || {};
        if (!startDate || !frequency || !endDate) {
            return res.status(400).json({ error: 'startDate, frequency and endDate are required' });
        }
        if (!['weekly', 'biweekly', 'monthly'].includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }

        const seriesId = crypto.randomUUID();
        const start = new Date(startDate);
        const until = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(until.getTime())) {
            return res.status(400).json({ error: 'Invalid dates' });
        }
        // Safety limits
        const MAX_COUNT = 200;

        const occurrences = [];
        let cursor = new Date(start);
        while (cursor <= until && occurrences.length < MAX_COUNT) {
            occurrences.push(new Date(cursor));
            if (frequency === 'weekly') cursor.setDate(cursor.getDate() + 7);
            else if (frequency === 'biweekly') cursor.setDate(cursor.getDate() + 14);
            else if (frequency === 'monthly') cursor.setMonth(cursor.getMonth() + 1);
        }
        if (!occurrences.length) {
            return res.status(400).json({ error: 'No occurrences within the given range' });
        }

        const docs = occurrences.map(dt => ({
            client: clientId,
            appointmentDate: dt,
            status: 'approved',
            seriesId,
            recurrenceFrequency: frequency
        }));

        const created = await Appointment.insertMany(docs);
        const populated = await Appointment.find({ seriesId }).sort({ appointmentDate: 1 }).lean();
        return res.status(201).json({ seriesId, items: populated });
    } catch (err) {
        console.error('appointmentsController.createRecurringForClient error:', err);
        return res.status(500).json({ error: 'Failed to start recurring series' });
    }
};

exports.cancelRecurringSeries = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const now = new Date();

        const result = await Appointment.updateMany(
            { seriesId, appointmentDate: { $gte: now }, status: { $in: ['approved', 'pending', 'requested'] } },
            { $set: { status: 'cancelled' } }
        );

        return res.status(200).json({ message: 'Series cancelled', modified: result.modifiedCount });
    } catch (err) {
        console.error('appointmentsController.cancelRecurringSeries error:', err);
        return res.status(500).json({ error: 'Failed to cancel series' });
    }
};
