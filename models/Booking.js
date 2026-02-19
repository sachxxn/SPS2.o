const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  carNumber: { type: String, required: true, uppercase: true },
  mobile:    { type: String, required: true },
  slot:      { type: String, required: true },
  slotIndex: { type: Number, required: true },
  bookedAt:  { type: Date,   default: Date.now },
  isActive:  { type: Boolean, default: true }
});

module.exports = mongoose.model('Booking', bookingSchema);
