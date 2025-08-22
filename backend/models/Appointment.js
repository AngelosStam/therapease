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

        // Backward compatible statuses:
        //  - 'pending' and 'requested' => awaiting therapist action
        //  - 'approved'                => scheduled
        //  - 'rejected'                => request denied
        //  - 'cancelled'               => approved session cancelled
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

module.exports = mongoose.model('Appointment', AppointmentSchema);
