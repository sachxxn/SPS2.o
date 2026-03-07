const { pool } = require('../config/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const result = await pool.query('SELECT * FROM history ORDER BY timestamp DESC LIMIT 50');
    res.status(200).json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
