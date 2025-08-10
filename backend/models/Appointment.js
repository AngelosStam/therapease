// backend/models/Appointment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    client: { type: Schema.Types.ObjectId, ref: 'User' },
    guestName: { type: String },
    guestEmail: { type: String },
    guestPhone: { type: String },
    appointmentDate: { type: Date },
    message: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'cancelled'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
