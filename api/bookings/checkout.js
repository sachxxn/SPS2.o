const { pool, connectDB } = require('../../config/db');

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await ensureDB();
    const { carNumber } = req.body;
    const cNum = carNumber.toUpperCase();

    const bookingResult = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No active booking for ' + cNum });
    }

    const booking = bookingResult.rows[0];
    const slot = booking.slot;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE bookings SET "isActive" = false WHERE id = $1', [booking.id]);
      await client.query('UPDATE slots SET occupied = false, "carNumber" = $2, "mobile" = $3 WHERE "slotId" = $1', [slot, '', '']);
      await client.query('INSERT INTO history ("carNumber", "mobile", "slot", "action") VALUES ($1, $2, $3, $4)', [cNum, booking.mobile, slot, 'CHECKOUT']);
      await client.query('COMMIT');
      res.status(200).json({ success: true, message: cNum + ' checked out. Slot ' + slot + ' is free.', slot: slot });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
