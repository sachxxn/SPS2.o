const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');

// GET all slots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM slots ORDER BY "slotId"');
    res.json({ success: true, slots: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
