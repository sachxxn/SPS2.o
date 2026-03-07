// ============================================
// SMART PARKING SYSTEM - SERVER
// File: server.js
// Run: node server.js
// ============================================

const express = require('express');
const path = require('path');
const cors = require('cors');

// ── IMPORT DATABASE CONNECTION ──
const { pool, connectDB } = require('../config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
        await pool.query(`
            INSERT INTO slots ("slotId", "floor")
            VALUES ($1, $2)
            ON CONFLICT ("slotId") DO NOTHING;
        `, [s.slotId, s.floor]);
    }
    console.log('✅  All 6 parking slots ready in database');
}

// ── LAZY INIT (Vercel serverless: runs on first request) ──
let initialized = false;
app.use(async (req, res, next) => {
    if (!initialized) {
        try {
            await connectDB();
            await initSlots();
            initialized = true;
        } catch (err) {
            console.error('DB init failed:', err);
            return res.status(500).json({ success: false, error: 'DB init failed' });
        }
    }
    next();
});

// ── IMPORT ROUTES ──
const slotRoutes = require('../routes/slots');
const bookingRoutes = require('../routes/bookings');
const historyRoutes = require('../routes/history');

// ── REGISTER ROUTES ──
// Use path prefixes without '/api' because Vercel strips the folder path in serverless
app.use('/slots', slotRoutes);
app.use('/bookings', bookingRoutes);
app.use('/history', historyRoutes);
// Keep the original pathing as well for local development compatibility
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/history', historyRoutes);

// ── SERVE HOMEPAGE ──
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ── EXPORT FOR VERCEL (serverless) ──
module.exports = app;

// ── START SERVER LOCALLY (only when not on Vercel) ──
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log('================================================');
        console.log('🚗  Smart Parking Server is RUNNING!');
        console.log('🌐  Open: http://localhost:' + PORT);
        console.log('📋  API:  http://localhost:' + PORT + '/api/slots');
        console.log('================================================');
    });
}
