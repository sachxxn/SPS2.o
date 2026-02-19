// ============================================
// SMART PARKING SYSTEM - SERVER
// File: server.js
// Run: node server.js
// ============================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

// ── IMPORT DATABASE CONNECTION ──
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CONNECT TO MONGODB FIRST ──
connectDB();

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── IMPORT MODELS ──
const Slot = require('./models/Slot');

// ── INITIALIZE 6 SLOTS IN DATABASE ──
async function initSlots() {
    const slotList = [
        { slotId: 'F1-S1', floor: 'First Floor' },
        { slotId: 'F1-S2', floor: 'First Floor' },
        { slotId: 'F1-S3', floor: 'First Floor' },
        { slotId: 'F2-S1', floor: 'Second Floor' },
        { slotId: 'F2-S2', floor: 'Second Floor' },
        { slotId: 'F2-S3', floor: 'Second Floor' },
    ];
    for (const s of slotList) {
        await Slot.findOneAndUpdate(
            { slotId: s.slotId },
            { $setOnInsert: s },
            { upsert: true, new: true }
        );
    }
    console.log('✅  All 6 parking slots ready in database');
}

// ── IMPORT ROUTES ──
const slotRoutes = require('./routes/slots');
const bookingRoutes = require('./routes/bookings');
const historyRoutes = require('./routes/history');

// ── REGISTER ROUTES ──
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/history', historyRoutes);

// ── SERVE HOMEPAGE ──
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START SERVER AFTER DB IS READY ──
mongoose.connection.once('open', async () => {
    await initSlots();
    app.listen(PORT, () => {
        console.log('================================================');
        console.log('🚗  Smart Parking Server is RUNNING!');
        console.log('🌐  Open: http://localhost:' + PORT);
        console.log('📋  API:  http://localhost:' + PORT + '/api/slots');
        console.log('================================================');
    });
});
