// backend/routes/auth.js

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:   
 *                 type: string
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string 
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email               
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: 
 *                   type: string   
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string       
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/auth/register  (not modified here)
router.post('/register', async (req, res) => {
    const { firstName, lastName, phone, email, password } = req.body;
    if (!firstName || !lastName || !phone || !email || !password) {
        return res.status(400).json({ message: 'Missing registration fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const isTherapist = normalizedEmail === 'angelos_stamatis@outlook.com';

    const user = new User({
        name: `${firstName} ${lastName}`,
        email: normalizedEmail,
        phone,
        password: hash,
        role: isTherapist ? 'therapist' : 'client',
        approved: isTherapist
    });

    await user.save();
    return res.status(201).json({
        message: isTherapist
            ? 'Therapist account created. You may now log in.'
            : 'Registration request submitted; please await approval.'
    });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'client' && !user.approved) {
        return res.status(403).json({ message: 'Registration not yet approved' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
    const token = jwt.sign({ user: safeUser }, process.env.JWT_SECRET, {
        expiresIn: '2h'
    });
    return res.json({ user: safeUser, token });
});

module.exports = router;
