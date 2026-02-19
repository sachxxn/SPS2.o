const express = require('express');
const router  = express.Router();
const History = require('../models/History');

// GET last 50 history records
router.get('/', async (req, res) => {
  try {
    const history = await History.find().sort('-timestamp').limit(50);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
