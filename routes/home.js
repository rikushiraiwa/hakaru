const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const Expense = require('../models/Expense');
const IncomeStatement = require('../models/IncomeStatement');


// ホームページルート
router.get('/', isAuthenticated, async (req, res) => {
    try {
      const totalRecipes = await Recipe.countDocuments();   // レシピの総数
      const totalStocks = await Stock.countDocuments();     // 在庫の総数
      const totalExpenses = await Expense.aggregate([{ $group: { _id: null, total: { $sum: "$purchase" } } }]); // 経費の合計
      const totalSales = await IncomeStatement.aggregate([{ $group: { _id: null, total: { $sum: "$productPrice" } } }]); // 売上の合計
  
      // 月ごとの経費と売上のデータを集計
      const expensesByMonth = await Expense.aggregate([
        { $group: { _id: { $substr: ["$date", 0, 7] }, totalExpense: { $sum: "$purchase" } } }, // 月ごとの集計
        { $sort: { _id: 1 } } // 月ごとにソート
      ]);
  
      const salesByMonth = await IncomeStatement.aggregate([
        { $group: { _id: { $substr: ["$orderDate", 0, 7] }, totalSales: { $sum: "$productPrice" } } }, // 月ごとの集計
        { $sort: { _id: 1 } } // 月ごとにソート
      ]);
  
      // ページにデータを渡す
      res.render('home/home', {
        totalRecipes,
        totalStocks,
        totalExpenses: totalExpenses[0]?.total || 0,  // 経費合計
        totalSales: totalSales[0]?.total || 0,        // 売上合計
        expensesByMonth,
        salesByMonth
      });
    } catch (error) {
      console.error("Error fetching data for home page:", error);
      res.status(500).send("Server Error");
    }
});

module.exports = router;
