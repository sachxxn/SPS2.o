const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');

// GET all active bookings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE "isActive" = true ORDER BY "bookedAt" DESC');
    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST book a slot
router.post('/book', async (req, res) => {
  try {
    const { carNumber, mobile, slot, slotIndex } = req.body;

    if (!carNumber || !mobile || !slot) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const cNum = carNumber.toUpperCase();

    // Check car already booked
    const existingResult = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: `${cNum} already booked in slot ${existingResult.rows[0].slot}` });
    }

    // Check slot is free
    const slotDocResult = await pool.query('SELECT * FROM slots WHERE "slotId" = $1', [slot]);
    if (slotDocResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    const slotDoc = slotDocResult.rows[0];
    if (slotDoc.occupied) {
      return res.status(400).json({ success: false, error: `Slot ${slot} is already occupied` });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Save booking
      await client.query(`
        INSERT INTO bookings ("carNumber", "mobile", "slot", "slotIndex") 
        VALUES ($1, $2, $3, $4)
      `, [cNum, mobile, slot, slotIndex || 0]);

      // Update slot
      await client.query(`
        UPDATE slots SET occupied = true, "carNumber" = $1, "mobile" = $2 WHERE "slotId" = $3
      `, [cNum, mobile, slot]);

      // Log history
      await client.query(`
        INSERT INTO history ("carNumber", "mobile", "slot", "action")
        VALUES ($1, $2, $3, 'BOOKED')
      `, [cNum, mobile, slot]);

      await client.query('COMMIT');
      console.log(`✅ BOOKED: ${cNum} → ${slot}`);
      res.json({ success: true, message: `${cNum} booked in slot ${slot}` });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST find a car
router.post('/find', async (req, res) => {
  try {
    const { carNumber } = req.body;
    const cNum = carNumber.toUpperCase();
    const result = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `No car found with number ${cNum}` });
    }
    const booking = result.rows[0];
    res.json({ success: true, slot: booking.slot, mobile: booking.mobile, bookedAt: booking.bookedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST checkout
router.post('/checkout', async (req, res) => {
  try {
    const { carNumber } = req.body;
    const cNum = carNumber.toUpperCase();
    
    // Find active booking
    const bookingResult = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: `No active booking for ${cNum}` });
    }
    
    const booking = bookingResult.rows[0];
    const slot = booking.slot;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deactivate booking
      await client.query('UPDATE bookings SET "isActive" = false WHERE id = $1', [booking.id]);

      // Free slot
      await client.query(`
        UPDATE slots SET occupied = false, "carNumber" = '', "mobile" = '' WHERE "slotId" = $1
      `, [slot]);

      // Log history
      await client.query(`
        INSERT INTO history ("carNumber", "mobile", "slot", "action")
        VALUES ($1, $2, $3, 'CHECKOUT')
      `, [cNum, booking.mobile, slot]);

      await client.query('COMMIT');
      console.log(`✅ CHECKOUT: ${cNum} ← ${slot} freed`);
      res.json({ success: true, message: `${cNum} checked out. Slot ${slot} is free.`, slot });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
