const { pool, connectDB } = require('../../config/db');

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await ensureDB();
    const { carNumber, mobile, slot, slotIndex } = req.body;
    if (!carNumber || !mobile || !slot) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const cNum = carNumber.toUpperCase();

    // Check if car is already booked
    const existing = await pool.query('SELECT * FROM bookings WHERE "carNumber" = $1 AND "isActive" = true', [cNum]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: cNum + ' already booked in slot ' + existing.rows[0].slot });
    }

    // Check slot is free
    const slotDoc = await pool.query('SELECT * FROM slots WHERE "slotId" = $1', [slot]);
    if (slotDoc.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    if (slotDoc.rows[0].occupied) {
      return res.status(400).json({ success: false, error: 'Slot ' + slot + ' is already occupied' });
    }

    // Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO bookings ("carNumber", "mobile", "slot", "slotIndex") VALUES ($1, $2, $3, $4)', [cNum, mobile, slot, slotIndex || 0]);
      await client.query('UPDATE slots SET occupied = true, "carNumber" = $1, "mobile" = $2 WHERE "slotId" = $3', [cNum, mobile, slot]);
      await client.query('INSERT INTO history ("carNumber", "mobile", "slot", "action") VALUES ($1, $2, $3, $4)', [cNum, mobile, slot, 'BOOKED']);
      await client.query('COMMIT');
      res.status(200).json({ success: true, message: cNum + ' booked in slot ' + slot });
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
