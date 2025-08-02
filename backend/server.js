// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');

const app = express();

// Enable CORS for your Angular dev server
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Decode JWT if present → req.user
app.use(authMiddleware);

// Serve Swagger UI from the static JSON spec
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
);

// Mount API routers
app.use('/api/auth', authRoutes);         // registration & login
app.use('/api/clients', clientsRoutes);      // client approval/rejection
app.use('/api/appointments', appointmentRoutes);  // appointment booking & management

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
});

// Connect to MongoDB & start the server
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        const port = process.env.PORT || 5000;
        app.listen(port, () =>
            console.log(`Server running on port ${port}`)
        );
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
