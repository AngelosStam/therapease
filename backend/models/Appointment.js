// models/Appointment.js
// Mongoose model for appointments (guests and clients)

const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
    {
        // If a logged-in client books, we link to the user
        client: { type: Schema.Types.ObjectId, ref: 'User', default: null },

        // Guest booking fields (when not logged in)
        guestName: { type: String, trim: true, default: null },
        guestEmail: { type: String, trim: true, lowercase: true, default: null },
        guestPhone: { type: String, trim: true, default: null },

        message: { type: String, trim: true, default: '' },

        // When the session is scheduled to occur (may be null while request is pending)
        appointmentDate: { type: Date, default: null },

        // Recurrence support
        seriesId: { type: String, default: null }, // same ID for all items in a series
        recurrenceFrequency: {
            type: String,
            enum: ['none', 'weekly', 'biweekly', 'monthly'],
            default: 'none'
        },

        // Backward compatible statuses
        status: {
            type: String,
            enum: ['pending', 'requested', 'approved', 'rejected', 'cancelled'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

// Helpful indexes
AppointmentSchema.index({ status: 1, appointmentDate: 1, createdAt: -1 });
AppointmentSchema.index({ seriesId: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
