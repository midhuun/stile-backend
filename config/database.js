const mongoose = require('mongoose');
const env = require("dotenv");
env.config();

const mongouri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stile';
console.log(mongouri)

// Optimized MongoDB connection options
const connectTODB = async () => {
    try {
        await mongoose.connect(mongouri, {
            // These options improve MongoDB performance
            useNewUrlParser: true,
            useUnifiedTopology: true, 
            // Set connection pool size for handling multiple requests efficiently
            poolSize: 10,
            // Set timeouts to prevent hanging connections
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
            // Keep connection alive to avoid reconnection overhead
            keepAlive: true
        });
        
        // Enable mongoose query tracing for performance debugging
        mongoose.set('debug', process.env.NODE_ENV !== 'production');
        
        // Create text indexes for search functionality
        const db = mongoose.connection;
        db.once('open', async () => {
            console.log("Connected to Database Successfully");
            
            // Optional: Add event listeners for monitoring connection issues
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });
            
            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected, attempting to reconnect...');
            });
        });
    }
    catch(err) {
        console.log('Error Connecting to Database', err);
        // Retry connection after delay if failed
        setTimeout(connectTODB, 5000);
    }
};

module.exports = { connectTODB };