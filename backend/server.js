// backend/server.js
require('dotenv').config();               // ← load .env at project root
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');

const app = express();

// 1) CORS
app.use(cors({
    origin: 'http://localhost:4200',       // your Angular dev URL
    credentials: true
}));

// 2) JSON body parsing
app.use(express.json());

// 3) JWT decoding → req.user
app.use(authMiddleware);

// 4) Mount all routers
app.use('/api/auth', authRoutes);         // register & login
app.use('/api/clients', clientsRoutes);      // approve/reject clients
app.use('/api/appointments', appointmentRoutes);  // book & manage appointments

// 5) 404 fallback
app.use((req, res) => {
    res.status(404).json({
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// 6) Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
});

// 7) Connect to MongoDB & start
const uri = process.env.MONGO_URI
    || 'mongodb://127.0.0.1:27017/therapease';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        const port = process.env.PORT || 5000;
        app.listen(port, () =>
            console.log(`Server running on port ${port}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
