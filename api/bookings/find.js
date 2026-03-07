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
    const result = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No car found with number ' + cNum });
    }
    const booking = result.rows[0];
    res.status(200).json({ success: true, slot: booking.slot, mobile: booking.mobile, bookedAt: booking.bookedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
