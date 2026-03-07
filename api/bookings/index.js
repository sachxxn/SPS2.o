const { pool, connectDB } = require('../../config/db');

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await ensureDB();
    const result = await pool.query('SELECT * FROM bookings WHERE "isActive" = true ORDER BY "bookedAt" DESC');
    res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
