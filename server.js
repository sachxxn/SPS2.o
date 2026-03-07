// ============================================
// SMART PARKING SYSTEM - SERVER
// File: server.js
// Run: node server.js
// ============================================

const express = require('express');
const path = require('path');
const cors = require('cors');

// ── IMPORT DATABASE CONNECTION ──
const { pool, connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// ── LAZY INIT FOR VERCEL SERVERLESS ──
let initialized = false;
app.use(async (req, res, next) => {
    if (!initialized) {
        try {
            await connectDB();
            await initSlots();
            initialized = true;
        } catch (err) {
            console.error('DB init failed:', err);
        }
    }
    next();
});

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

// ── EXPORT FOR VERCEL (serverless) ──
module.exports = app;

// ── START SERVER LOCALLY ──
if (process.env.VERCEL !== '1') {
    connectDB().then(async () => {
        await initSlots();
        app.listen(PORT, () => {
            console.log('================================================');
            console.log('🚗  Smart Parking Server is RUNNING (Local)!');
            console.log('🌐  Open: http://localhost:' + PORT);
            console.log('📋  API:  http://localhost:' + PORT + '/api/slots');
            console.log('================================================');
        });
    }).catch(err => {
        console.error("Failed to start server", err);
    });
}
