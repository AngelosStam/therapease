/**
 * config/db.js
 * Creates a connection to MongoDB using Mongoose.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            // Mongoose 7 uses sensible defaults; options left for clarity
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
