const { pool, connectDB } = require('../../config/db');

// Lazy init wrapper
let initialized = false;
async function initDB() {
    if (!initialized) {
        await connectDB();
        initialized = true;
    }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await initDB();

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
      
      res.status(200).json({ success: true, message: `${cNum} checked out. Slot ${slot} is free.`, slot });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
