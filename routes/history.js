const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');

// GET last 50 history records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM history ORDER BY timestamp DESC LIMIT 50');
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
