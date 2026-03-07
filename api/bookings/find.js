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
    const result = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `No car found with number ${cNum}` });
    }
    const booking = result.rows[0];
    res.status(200).json({ success: true, slot: booking.slot, mobile: booking.mobile, bookedAt: booking.bookedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
