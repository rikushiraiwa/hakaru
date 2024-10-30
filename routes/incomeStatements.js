const express = require('express');
const router = express.Router();
const IncomeStatement = require('../models/IncomeStatement');
const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const { isAuthenticated } = require('../middleware/auth');



router.get('/incomeStatement', isAuthenticated, async (req, res) => {
  const recipes = await Recipe.find();
  res.render('incomeStatements/incomeStatement', { recipes });
});

// Income Statementの新規登録
router.post('/register', isAuthenticated, async (req, res) => {
  try {
    const { productName } = req.body;
    const recipe = await Recipe.findOne({ recipeName: productName });

    if (recipe) {
      for (const item of recipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName });
        if (!stock) continue;

        stock.remaining = typeof stock.remaining === 'number' ? stock.remaining : stock.purchaseQuantity;
        stock.remainingValue = typeof stock.remainingValue === 'number' ? stock.remainingValue : stock.purchasePrice;

        const newRemaining = stock.remaining - item.amountUsage;
        const newRemainingValue = stock.remainingValue - item.amountFee;

        stock.remaining = !isNaN(newRemaining) ? Math.max(newRemaining, 0) : stock.purchaseQuantity;
        stock.remainingValue = !isNaN(newRemainingValue) ? Math.max(newRemainingValue, 0) : stock.purchasePrice;

        await stock.save();
      }
    }

    const { revenue, cogs, expenses, sales, salesCommission, transferFee, shippingFee } = req.body;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const ratio = revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;
    const depositAmount = sales - salesCommission - transferFee - shippingFee;

    const newIncomeStatement = new IncomeStatement({
      ...req.body,
      grossProfit,
      netProfit,
      ratio,
      depositAmount
    });

    await newIncomeStatement.save();
    res.redirect('/incomeStatements/soldInfor');
  } catch (error) {
    console.error('Error registering income statement:', error);
    res.status(500).send('Server Error');
  }
});

// Income Statement一覧ページ
router.get('/soldInfor', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const incomeStatements = await IncomeStatement.find({}).skip(skip).limit(limit);
    const totalDocuments = await IncomeStatement.countDocuments();
    const totalPages = Math.ceil(totalDocuments / limit);

    res.render('incomeStatements/soldInfor', { incomeStatements, currentPage: page, totalPages });
  } catch (error) {
    console.error('Error fetching income statements:', error);
    res.status(500).send('Server Error');
  }
});

// Income Statement編集ページ
router.get('/soldEdit/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const statement = await IncomeStatement.findById(id);
    const recipes = await Recipe.find();

    if (!statement) {
      return res.status(404).send('Income Statement not found');
    }

    res.render('incomeStatements/soldEdit', {
      ...statement.toObject(),
      recipes,
      id: statement._id,
    });
  } catch (error) {
    console.error('Error fetching income statement for editing:', error);
    res.status(500).send('Server Error');
  }
});

// Income Statementの更新
router.put('/update/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
  
      // 計算
      const depositAmount = data.sales - data.salesCommission - data.transferFee - data.shippingFee;
      const grossProfit = data.revenue - data.cogs;
      const netProfit = grossProfit - data.expenses;
      const netRatio = data.revenue !== 0 ? ((netProfit / data.revenue) * 100).toFixed(2) : 0;
  
      // 更新データ
      const updatedData = {
        ...data,
        grossProfit,
        netProfit,
        ratio: netRatio,
        depositAmount
      };
  
      await IncomeStatement.findByIdAndUpdate(id, updatedData, { new: true });
      res.redirect('/incomeStatements/soldInfor');
    } catch (error) {
      console.error('Error updating income statement:', error);
      res.status(500).send('Server Error');
    }
});
  
module.exports = router;
