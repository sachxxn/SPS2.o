const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const Slot    = require('../models/Slot');
const History = require('../models/History');

// GET all active bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ isActive: true }).sort('-bookedAt');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST book a slot
router.post('/book', async (req, res) => {
  try {
    const { carNumber, mobile, slot, slotIndex } = req.body;

    if (!carNumber || !mobile || !slot) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check car already booked
    const existing = await Booking.findOne({ carNumber: carNumber.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(400).json({ success: false, error: `${carNumber} already booked in slot ${existing.slot}` });
    }

    // Check slot is free
    const slotDoc = await Slot.findOne({ slotId: slot });
    if (!slotDoc) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    if (slotDoc.occupied) {
      return res.status(400).json({ success: false, error: `Slot ${slot} is already occupied` });
    }

    // Save booking
    await new Booking({ carNumber: carNumber.toUpperCase(), mobile, slot, slotIndex }).save();

    // Update slot
    await Slot.findOneAndUpdate({ slotId: slot }, { occupied: true, carNumber: carNumber.toUpperCase(), mobile });

    // Log history
    await new History({ carNumber: carNumber.toUpperCase(), mobile, slot, action: 'BOOKED' }).save();

    console.log(`✅ BOOKED: ${carNumber} → ${slot}`);
    res.json({ success: true, message: `${carNumber} booked in slot ${slot}` });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST find a car
router.post('/find', async (req, res) => {
  try {
    const { carNumber } = req.body;
    const booking = await Booking.findOne({ carNumber: carNumber.toUpperCase(), isActive: true });
    if (!booking) {
      return res.status(404).json({ success: false, error: `No car found with number ${carNumber}` });
    }
    res.json({ success: true, slot: booking.slot, mobile: booking.mobile, bookedAt: booking.bookedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST checkout
router.post('/checkout', async (req, res) => {
  try {
    const { carNumber } = req.body;
    const booking = await Booking.findOne({ carNumber: carNumber.toUpperCase(), isActive: true });
    if (!booking) {
      return res.status(404).json({ success: false, error: `No active booking for ${carNumber}` });
    }

    const slot = booking.slot;

    // Deactivate booking
    await Booking.findByIdAndUpdate(booking._id, { isActive: false });

    // Free slot
    await Slot.findOneAndUpdate({ slotId: slot }, { occupied: false, carNumber: '', mobile: '' });

    // Log history
    await new History({ carNumber: carNumber.toUpperCase(), mobile: booking.mobile, slot, action: 'CHECKOUT' }).save();

    console.log(`✅ CHECKOUT: ${carNumber} ← ${slot} freed`);
    res.json({ success: true, message: `${carNumber} checked out. Slot ${slot} is free.`, slot });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
