// routes/home.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const Expense = require('../models/Expense');
const IncomeStatement = require('../models/IncomeStatement');
const { isAuthenticated } = require('../middleware/auth');

// ホームページルート
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // ログイン中のユーザーIDを取得

    // ユーザーごとに関連付けられたデータを取得
    const totalRecipes = await Recipe.countDocuments({ user: userId });
    const totalStocks = await Stock.countDocuments({ user: userId });
    const totalExpenses = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$purchase" } } }
    ]);
    const totalSales = await IncomeStatement.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$netProfit" } } }
    ]);

    // 月ごとの経費と売上のデータを集計
    const expensesByMonth = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: { $substr: ["$date", 0, 7] }, totalExpense: { $sum: "$purchase" } } },
      { $sort: { _id: 1 } }
    ]);

    const salesByMonth = await IncomeStatement.aggregate([
      { $match: { user: userId } },
      { $group: { _id: { $substr: ["$orderDate", 0, 7] }, totalSales: { $sum: "$netProfit" } } },
      { $sort: { _id: 1 } }
    ]);

    // ページにデータを渡す
    res.render('home/home', {
      totalRecipes,
      totalStocks,
      totalExpenses: totalExpenses[0]?.total || 0,
      totalSales: totalSales[0]?.total || 0,
      expensesByMonth,
      salesByMonth
    });
  } catch (error) {
    console.error("Error fetching data for home page:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
