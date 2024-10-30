const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const { isAuthenticated } = require('../middleware/auth');

// 在庫一覧ページ
router.get('/stockHome', isAuthenticated, async (req, res) => {
  try {
    const { sortField, sortOrder } = req.query;
    let sortOptions = {};

    if (sortField && sortOrder) {
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
    }

    const stocks = await Stock.find({}).sort(sortOptions);
    const stockData = stocks.map(stock => ({
      ...stock.toObject(),
      remaining: stock.remaining,
      remainingValue: stock.remainingValue
    }));

    res.render('stocks/stockHome', { stocks: stockData });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).send('Server Error');
  }
});

// 在庫の新規追加
router.post('/add', isAuthenticated, async (req, res) => {
  const { date, itemName, purchaseQuantity, purchasePrice, unitPrice } = req.body;

  try {
    const dateObj = new Date(date);
    const correctedDate = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000));

    const newStock = new Stock({
      date: correctedDate,
      itemName,
      purchaseQuantity,
      purchasePrice,
      unitPrice
    });

    await newStock.save();
    res.redirect('/stocks/stockHome');
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(400).send('Error: ' + error.message);
  }
});

// 在庫の削除
router.delete('/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  try {
    await Stock.deleteMany({ _id: { $in: ids } });
    res.redirect('/stocks/stockHome');
  } catch (error) {
    console.error('Error deleting stocks:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
