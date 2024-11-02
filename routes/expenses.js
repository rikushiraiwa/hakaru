const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { isAuthenticated } = require('../middleware/auth'); // 認証ミドルウェアのインポート

// 経費一覧ページ（ログイン中のユーザーに関連付け）
router.get('/', isAuthenticated, async (req, res) => {
  const { sortField, sortOrder } = req.query;
  let sortOptions = {};

  if (sortField && sortOrder) {
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
  }

  try {
    // ログイン中のユーザーに関連する経費データを取得
    const expenses = await Expense.find({ user: req.user._id }).sort(sortOptions);

    // `TotalExpense` を計算
    const totalExpenseResult = await Expense.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ["$supplier", 0] },
                { $ifNull: ["$purchase", 0] },
                { $ifNull: ["$consumable", 0] },
                { $ifNull: ["$otherExpense", 0] },
                { $ifNull: ["$shippingCost", 0] },
                { $ifNull: ["$cash", 0] },
                { $ifNull: ["$credit", 0] }
              ]
            }
          },
          discount: { $sum: { $ifNull: ["$purchaseDiscount", 0] } }
        }
      },
      {
        $project: {
          totalExpense: { $subtract: ["$total", "$discount"] }
        }
      }
    ]);

    const totalExpense = totalExpenseResult.length > 0 ? totalExpenseResult[0].totalExpense : 0;

    // `TotalExpense` を `expense.ejs` に渡す
    res.render('expenses/expense', { expenseData: expenses, totalExpense });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).send('Server Error');
  }
});

// 経費の新規登録（ログイン中のユーザーに関連付け）
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const newExpense = new Expense({
      ...req.body,
      user: req.user._id  // ログイン中のユーザーのIDを設定
    });
    await newExpense.save();
    res.redirect('/expenses');
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(400).send('Error: ' + error.message);
  }
});

// 経費の削除（ユーザーのデータのみ削除可能）
router.delete('/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  try {
    // ログイン中のユーザーに関連する経費データのみ削除
    await Expense.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.redirect('/expenses');
  } catch (error) {
    console.error('Error deleting expenses:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
