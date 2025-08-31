/**
 * controllers/authController.js
 *
 * Unified, user‑friendly auth flow:
 * - REGISTER:
 *    • New client  -> 201 + message: "Registration pending approval"
 *    • Therapist bootstrap (first time) -> 201 + "Therapist account created" + token
 *    • Existing email with status "rejected" -> 200 + message: "Registration resubmitted" (status reset to pending)
 *    • Existing email with status "pending"  -> 200 + message: "Registration pending approval"
 *    • Existing email with status "approved" -> 400 + error:   "Email already registered"
 *
 * - LOGIN:
 *    • No user                -> 400 + error: "User not found"
 *    • Wrong password         -> 400 + error: "Wrong password"
 *    • Status "pending"       -> 403 + error: "Registration pending approval"
 *    • Status "rejected"      -> 403 + error: "Registration rejected"
 *    • Status "approved"      -> 200 + message: "Login successful" + token
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if your structure differs

const THERAPIST_EMAIL = 'therapease@outlook.com';

/** Helper: sign JWT for approved users */
function signToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * POST /auth/register
 */
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, password } = req.body;

        // Basic validation
        if (!firstName || !lastName || !phone || !email || !password) {
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let existing = await User.findOne({ email: normalizedEmail });

        // No user exists yet for this email
        if (!existing) {
            const hashed = await bcrypt.hash(password, 10);

            // Therapist bootstrap (first time)
            if (normalizedEmail === THERAPIST_EMAIL.toLowerCase()) {
                const therapist = await User.create({
                    firstName,
                    lastName,
                    phone,
                    email: normalizedEmail,
                    password: hashed,
                    role: 'therapist',
                    status: 'approved'
                });

                const token = signToken(therapist);
                return res.status(201).json({
                    message: 'Therapist account created',
                    user: {
                        _id: therapist._id,
                        firstName: therapist.firstName,
                        lastName: therapist.lastName,
                        phone: therapist.phone,
                        email: therapist.email,
                        role: therapist.role,
                        status: therapist.status,
                        createdAt: therapist.createdAt,
                        updatedAt: therapist.updatedAt
                    },
                    token
                });
            }

            // Regular client -> pending approval (no token)
            const client = await User.create({
                firstName,
                lastName,
                phone,
                email: normalizedEmail,
                password: hashed,
                role: 'client',
                status: 'pending'
            });

            return res.status(201).json({
                message: 'Registration pending approval',
                user: {
                    _id: client._id,
                    firstName: client.firstName,
                    lastName: client.lastName,
                    phone: client.phone,
                    email: client.email,
                    role: client.role,
                    status: client.status,
                    createdAt: client.createdAt,
                    updatedAt: client.updatedAt
                }
            });
        }

        // User already exists for this email
        if (existing.status === 'rejected') {
            // Re-apply flow: update profile + password, reset to pending
            const hashed = await bcrypt.hash(password, 10);
            existing.firstName = firstName;
            existing.lastName = lastName;
            existing.phone = phone;
            existing.password = hashed;
            existing.role = existing.role || 'client';
            existing.status = 'pending';
            await existing.save();

            return res.status(200).json({
                message: 'Registration resubmitted',
                user: {
                    _id: existing._id,
                    firstName: existing.firstName,
                    lastName: existing.lastName,
                    phone: existing.phone,
                    email: existing.email,
                    role: existing.role,
                    status: existing.status,
                    createdAt: existing.createdAt,
                    updatedAt: existing.updatedAt
                }
            });
        }

        if (existing.status === 'pending') {
            return res.status(200).json({ message: 'Registration pending approval' });
        }

        // existing.status === 'approved'
        return res.status(400).json({ error: 'Email already registered' });
    } catch (err) {
        console.error('REGISTER ERROR:', err);
        return res.status(500).json({ error: 'Server error during registration' });
    }
};

/**
 * POST /auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(400).json({ error: 'Wrong password' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Registration pending approval' });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ error: 'Registration rejected' });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({ error: 'Login not allowed' });
        }

        const token = signToken(user);
        return res.status(200).json({
            message: 'Login successful',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            token
        });
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        return res.status(500).json({ error: 'Server error during login' });
    }
};

/**
 * GET /auth/me
 * Requires auth middleware that sets req.user from JWT.
 */
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err) {
        console.error('ME ERROR:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
