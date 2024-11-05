// routes/incomeStatements.js
const express = require('express');
const router = express.Router();
const IncomeStatement = require('../models/IncomeStatement');
const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const { isAuthenticated } = require('../middleware/auth');



// Income Statement ページの表示
router.get('/incomeStatement', isAuthenticated, async (req, res) => {
  try {
    // ログイン中のユーザーの IncomeStatement データを取得
    const userIncomeStatements = await IncomeStatement.find({ user: req.user._id });

    // 全てのレシピを取得し、amountFeeの合計も計算する
    const recipes = await Recipe.find({ user: req.user._id });

    // 各レシピごとにamountFeeの合計を計算し、recipesDataに格納
    const recipesData = recipes.map(recipe => {
      const totalAmountFee = recipe.items.reduce((acc, item) => acc + (item.amountFee || 0), 0);
      return {
        ...recipe.toObject(),
        totalAmountFee, // 各レシピのamountFeeの合計
      };
    });

    // ページにデータを渡す
    res.render('incomeStatements/incomeStatement', {
      incomeStatements: userIncomeStatements,
      recipes: recipesData, // 合計を含むレシピデータを渡す
    });
  } catch (error) {
    console.error('Error fetching income statements:', error);
    res.status(500).send('Server Error');
  }
});


// Income Statementの新規登録（ログイン中のユーザーに関連付け）
router.post('/register', isAuthenticated, async (req, res) => {
  try {
    const { productName } = req.body;
    const recipe = await Recipe.findOne({ recipeName: productName, user: req.user._id });

    if (recipe) {
      for (const item of recipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName, user: req.user._id });
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

    const { cogs, expenses, sales } = req.body;
    const grossProfit = sales - cogs;
    const netProfit = grossProfit - expenses;
    const ratio = sales !== 0 ? ((netProfit / sales) * 100).toFixed(2) : 0;


    const newIncomeStatement = new IncomeStatement({
      ...req.body,
      grossProfit,
      netProfit,
      ratio,
      user: req.user._id  // ログイン中のユーザーのIDを関連付け
    });

    await newIncomeStatement.save();
    res.redirect('/incomeStatements/soldInfor');
  } catch (error) {
    console.error('Error registering income statement:', error);
    res.status(500).send('Server Error');
  }
});

// Income Statement一覧ページ（ログイン中のユーザーのデータのみ表示）
router.get('/soldInfor', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const incomeStatements = await IncomeStatement.find({ user: req.user._id }).skip(skip).limit(limit);
    const totalDocuments = await IncomeStatement.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalDocuments / limit);

    res.render('incomeStatements/soldInfor', { incomeStatements, currentPage: page, totalPages });
  } catch (error) {
    console.error('Error fetching income statements:', error);
    res.status(500).send('Server Error');
  }
});


// Income Statement編集ページ（ログイン中のユーザーのデータのみ取得）
router.get('/soldEdit/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const statement = await IncomeStatement.findOne({ _id: id, user: req.user._id });
    const recipes = await Recipe.find({ user: req.user._id });

    if (!statement) {
      return res.status(404).send('Income Statement not found');
    }

    // statementにあるproductNameに該当するレシピを取得して、totalAmountFeeをCOGSとして設定
    const selectedRecipe = recipes.find(recipe => recipe.recipeName === statement.productName);
    const cogs = selectedRecipe
      ? selectedRecipe.items.reduce((acc, item) => acc + (item.amountFee || 0), 0)
      : 0;


    res.render('incomeStatements/soldEdit', {
      ...statement.toObject(),
      recipes,
      id: statement._id,
      cogs,  // COGSとしてtotalAmountFeeの合計を渡す
    });
  } catch (error) {
    console.error('Error fetching income statement for editing:', error);
    res.status(500).send('Server Error');
  }
});


// Income Statementの更新（ログイン中のユーザーのデータのみ更新）
router.put('/update/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Calculate profits and ratios
    const grossProfit = data.sales - data.cogs;
    const netProfit = grossProfit - data.expenses;
    const netRatio = data.sales !== 0 ? ((netProfit / data.sales) * 100).toFixed(2) : 0;

    const updatedData = {
      ...data,
      grossProfit,
      netProfit,
      ratio: netRatio,
    };

    // Get the original income statement for product comparison
    const oldStatement = await IncomeStatement.findOne({ _id: id, user: req.user._id });
    if (!oldStatement) return res.status(404).send('Income Statement not found');

    // Find the old recipe to restore stock values
    const oldRecipe = await Recipe.findOne({ recipeName: oldStatement.productName, user: req.user._id });
    if (oldRecipe) {
      for (const item of oldRecipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName, user: req.user._id });
        if (!stock) continue;

        // Initialize stock values if undefined
        stock.remaining = typeof stock.remaining === 'number' ? stock.remaining : stock.purchaseQuantity;
        stock.remainingValue = typeof stock.remainingValue === 'number' ? stock.remainingValue : stock.purchasePrice;

        // Revert stock quantities
        const newRemaining = stock.remaining + (item.amountUsage || 0);
        const newRemainingValue = stock.remainingValue + (item.amountFee || 0);

        stock.remaining = !isNaN(newRemaining) ? newRemaining : stock.purchaseQuantity;
        stock.remainingValue = !isNaN(newRemainingValue) ? newRemainingValue : stock.purchasePrice;

        await stock.save();
      }
    }

    // Deduct stock for the new selected recipe
    const newRecipe = await Recipe.findOne({ recipeName: data.productName, user: req.user._id });
    if (newRecipe) {
      for (const item of newRecipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName, user: req.user._id });
        if (!stock) continue;

        // Initialize stock values if undefined
        stock.remaining = typeof stock.remaining === 'number' ? stock.remaining : stock.purchaseQuantity;
        stock.remainingValue = typeof stock.remainingValue === 'number' ? stock.remainingValue : stock.purchasePrice;

        // Deduct stock quantities
        const newRemaining = stock.remaining - (item.amountUsage || 0);
        const newRemainingValue = stock.remainingValue - (item.amountFee || 0);

        stock.remaining = !isNaN(newRemaining) ? Math.max(newRemaining, 0) : stock.purchaseQuantity;
        stock.remainingValue = !isNaN(newRemainingValue) ? Math.max(newRemainingValue, 0) : stock.purchasePrice;

        await stock.save();
      }
    }

    // Update the IncomeStatement with the new data
    await IncomeStatement.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updatedData,
      { new: true }
    );

    res.redirect('/incomeStatements/soldInfor');
  } catch (error) {
    console.error('Error updating income statement:', error);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
