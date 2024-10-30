const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { isAuthenticated } = require('../middleware/auth'); // 認証ミドルウェアのインポート

// 経費一覧ページ
router.get('/', isAuthenticated, async (req, res) => {
  const { sortField, sortOrder } = req.query;
  let sortOptions = {};

  if (sortField && sortOrder) {
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
  }

  try {
    const expenses = await Expense.find({}).sort(sortOptions);
    res.render('expenses/expense', { expenseData: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).send('Server Error');
  }
});

// 経費の新規登録
router.post('/', isAuthenticated, async (req, res) => {
  const newExpense = new Expense(req.body);
  await newExpense.save();
  res.redirect('/expenses');
});

// 経費の削除
router.delete('/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;
  await Expense.deleteMany({ _id: { $in: ids } });
  res.redirect('/expenses');
});

module.exports = router;
