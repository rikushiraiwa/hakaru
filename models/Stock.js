const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  date: Date,
  itemName: String,
  purchaseQuantity: Number,
  purchasePrice: Number,
  unitPrice: Number,
  remaining: Number,
  remainingValue: Number,
});

module.exports = mongoose.model('Stock', stockSchema);
