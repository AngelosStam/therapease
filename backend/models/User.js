// models/User.js
// Mongoose model for application users (therapist & clients)

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true, required: true },
        lastName: { type: String, trim: true, required: true },
        phone: { type: String, trim: true, required: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: { type: String, required: true },

        role: {
            type: String,
            enum: ['client', 'therapist'],
            default: 'client'
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },

        // ⭐ When the therapist approves the registration, we set this
        approvedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Optional: index for faster therapist queries
UserSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
