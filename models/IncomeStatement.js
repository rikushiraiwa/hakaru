const mongoose = require('mongoose');

const incomeStatementSchema = new mongoose.Schema({
  registerDate: String,
  customerName: String,
  productName: String,
  productPrice: Number,
  orderDate: String,
  shippingDate: String,
  payment: Number,
  uncollectedPrice: Number,
  sales: Number,
  salesCommission: Number,
  transferFee: Number,
  shippingFee: Number,
  depositAmount: Number,
  revenue: Number,
  cogs: Number,
  expenses: Number,
  grossProfit: Number,
  netProfit: Number,
  ratio: Number
});

module.exports = mongoose.model('IncomeStatement', incomeStatementSchema);
