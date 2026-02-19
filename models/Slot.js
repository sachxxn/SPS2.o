const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotId:    { type: String, required: true, unique: true },
  floor:     { type: String, default: '' },
  occupied:  { type: Boolean, default: false },
  carNumber: { type: String, default: '' },
  mobile:    { type: String, default: '' }
});

module.exports = mongoose.model('Slot', slotSchema);
