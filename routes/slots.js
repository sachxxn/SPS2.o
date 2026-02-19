const express = require('express');
const router  = express.Router();
const Slot    = require('../models/Slot');

// GET all slots
router.get('/', async (req, res) => {
  try {
    const slots = await Slot.find().sort('slotId');
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
