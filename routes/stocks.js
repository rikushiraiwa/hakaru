// routes/stocks.js
const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const { isAuthenticated } = require('../middleware/auth');

// 在庫一覧ページ（ログイン中のユーザーの在庫のみを表示）
router.get('/stockHome', isAuthenticated, async (req, res) => {
  try {
    const { sortField, sortOrder } = req.query;
    let sortOptions = {};

    if (sortField && sortOrder) {
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
    }

    // ログイン中のユーザーの Stock のみ取得
    const stocks = await Stock.find({ user: req.user._id }).sort(sortOptions);
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

// 在庫の新規追加（ログイン中のユーザーに関連付け）
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
      unitPrice,
      user: req.user._id  // ログイン中のユーザーのIDを関連付け
    });

    await newStock.save();
    res.redirect('/stocks/stockHome');
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(400).send('Error: ' + error.message);
  }
});

// 在庫の削除（ログイン中のユーザーに関連付け）
router.delete('/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  try {
    // ログイン中のユーザーのStockのみ削除
    await Stock.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.redirect('/stocks/stockHome');
  } catch (error) {
    console.error('Error deleting stocks:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
