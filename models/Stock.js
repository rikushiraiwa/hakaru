const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  itemName: String,
  purchaseQuantity: Number,
  purchasePrice: Number,
  unitPrice: Number,
  remaining: Number,
  remainingValue: Number,
  date: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }  // ユーザーIDを参照
});

module.exports = mongoose.model('Stock', stockSchema);
