/**
 * server.js
 * Entry point for the TherapEase backend (Express + MongoDB).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const clientRoutes = require('./routes/clients');
const notesRoutes = require('./routes/notes'); // <-- NEW

const app = express();

app.use(cors());
app.use(bodyParser.json());

connectDB();

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'TherapEase API', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/notes', notesRoutes); // <-- NEW

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    const status = err.status || 500;
    const message = err.message || 'Server error';
    res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ TherapEase backend running on port ${PORT}`);
});
