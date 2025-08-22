/**
 * server.js
 * Entry point for the TherapEase backend (Express + MongoDB).
 * - Loads env variables
 * - Connects to MongoDB
 * - Sets up middleware, routes, and Swagger UI
 * - Centralized error handler
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// DB connection
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const clientRoutes = require('./routes/clients');

// Swagger (correct path)
const {
    serve: swaggerServe,
    setup: swaggerSetup,
    spec: swaggerSpec,
} = require('./swagger/swagger');

const app = express();

// ----- Core middleware -----
app.use(cors());
app.use(bodyParser.json());

// ----- Connect to MongoDB -----
connectDB();

// ----- Health check -----
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'TherapEase API', time: new Date().toISOString() });
});

// ----- API routes -----
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/clients', clientRoutes);

// ----- Swagger UI -----
app.use('/api/docs', swaggerServe, swaggerSetup(swaggerSpec));

// ----- 404 handler (unknown routes) -----
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ----- Centralized error handler -----
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    const status = err.status || 500;
    const message = err.message || 'Server error';
    res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ TherapEase backend running on port ${PORT}`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/api/docs`);
});
