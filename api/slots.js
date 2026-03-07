const { pool, connectDB } = require('../../config/db');

// Lazy init wrapper
let initialized = false;
async function initDB() {
    if (!initialized) {
        await connectDB();
        const slotList = [
            { slotId: 'F1-S1', floor: 'First Floor' }, { slotId: 'F1-S2', floor: 'First Floor' }, { slotId: 'F1-S3', floor: 'First Floor' },
            { slotId: 'F2-S1', floor: 'Second Floor' }, { slotId: 'F2-S2', floor: 'Second Floor' }, { slotId: 'F2-S3', floor: 'Second Floor' }
        ];
        for (const s of slotList) {
            await pool.query('INSERT INTO slots ("slotId", "floor") VALUES ($1, $2) ON CONFLICT ("slotId") DO NOTHING;', [s.slotId, s.floor]);
        }
        initialized = true;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        await initDB();
        const result = await pool.query('SELECT * FROM slots ORDER BY "slotId"');
        res.status(200).json({ success: true, slots: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
