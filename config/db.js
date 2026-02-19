// ============================================
// DATABASE CONNECTION FILE
// File: config/db.js
// ============================================

const mongoose = require('mongoose');

// Your MongoDB connection string
// Option 1: Local MongoDB (running on your computer)
const MONGO_URI = 'mongodb://localhost:27017/smartparking';

// Option 2: MongoDB Atlas (Cloud) - uncomment and paste your Atlas URI below
// const MONGO_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smartparking?retryWrites=true&w=majority';

const connectDB = async () => {
    try {
        // Connection options
        const options = {
            useNewUrlParser:    true,
            useUnifiedTopology: true,
        };

        // Connect to MongoDB
        const conn = await mongoose.connect(MONGO_URI, options);

        console.log('================================================');
        console.log('✅  MongoDB Connected Successfully!');
        console.log('📦  Host     : ' + conn.connection.host);
        console.log('🗄️  Database : ' + conn.connection.name);
        console.log('================================================');

    } catch (error) {
        console.log('================================================');
        console.error('❌  MongoDB Connection FAILED!');
        console.error('🔴  Error    : ' + error.message);
        console.log('------------------------------------------------');
        console.log('💡  FIX: Make sure MongoDB is running.');
        console.log('    Windows → Search "MongoDB" in Services → Start');
        console.log('    Or run: mongod  in a new terminal');
        console.log('================================================');
        process.exit(1); // Stop server if DB fails
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
});

// Gracefully close connection when app stops
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed (app terminated)');
    process.exit(0);
});

module.exports = connectDB;
