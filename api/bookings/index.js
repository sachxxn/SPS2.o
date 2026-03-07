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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await initDB();

  try {
    const result = await pool.query('SELECT * FROM bookings WHERE "isActive" = true ORDER BY "bookedAt" DESC');
    res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
