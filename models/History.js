const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  carNumber: { type: String },
  mobile:    { type: String },
  slot:      { type: String },
  action:    { type: String }, // 'BOOKED' or 'CHECKOUT'
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);
