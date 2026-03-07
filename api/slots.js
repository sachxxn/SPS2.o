const { pool, connectDB } = require('../config/db');

let dbReady = false;
async function ensureDB() {
  if (!dbReady) {
    await connectDB();
    // Seed slots on first cold start
    const slotList = [
      { slotId: 'F1-S1', floor: 'First Floor' },
      { slotId: 'F1-S2', floor: 'First Floor' },
      { slotId: 'F1-S3', floor: 'First Floor' },
      { slotId: 'F2-S1', floor: 'Second Floor' },
      { slotId: 'F2-S2', floor: 'Second Floor' },
      { slotId: 'F2-S3', floor: 'Second Floor' },
    ];
    for (const s of slotList) {
      await pool.query(
        'INSERT INTO slots ("slotId", "floor") VALUES ($1, $2) ON CONFLICT ("slotId") DO NOTHING',
        [s.slotId, s.floor]
      );
    }
    dbReady = true;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await ensureDB();
    const result = await pool.query('SELECT * FROM slots ORDER BY "slotId"');
    
    // Map to exact format requested by user
    const formattedSlots = result.rows.map(s => ({
      slotId: s.slotId,
      __v: 0,
      carNumber: s.carNumber || "",
      floor: s.floor,
      mobile: s.mobile || "",
      occupied: s.occupied
    }));

    res.status(200).json({ success: true, slots: formattedSlots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
