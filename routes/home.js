const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const Expense = require('../models/Expense');
const IncomeStatement = require('../models/IncomeStatement');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // ログイン中のユーザーIDを取得

    // レシピ総数と在庫総数の取得
    const totalRecipes = await Recipe.countDocuments({ user: userId });
    const totalStocks = await Stock.countDocuments({ user: userId });

    // 経費の合計金額を取得
    const totalExpensesResult = await Expense.aggregate([
      { $match: { user: userId } },
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

    const totalExpenses = totalExpensesResult.length > 0 ? totalExpensesResult[0].totalExpense : 0;

    // 売上の合計金額を取得
    const totalSalesResult = await IncomeStatement.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$netProfit" } } }
    ]);
    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

    // ページにデータを渡す
    res.render('home/home', {
      totalRecipes,
      totalStocks,
      totalExpenses,
      totalSales
    });
  } catch (error) {
    console.error("Error fetching data for home page:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
