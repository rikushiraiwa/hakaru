const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');

const app = express();

// MongoDBへの接続
mongoose.connect('mongodb://localhost:27017/hakaru')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // viewsフォルダをテンプレートの場所に指定
app.use(express.static(path.join(__dirname, 'public')));  // 静的ファイルの提供
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.engine('ejs', engine);

// 経費のスキーマとモデルを作成
const expenseSchema = new mongoose.Schema({
  date: String,
  content: String,
  supplier: Number,
  purchase: Number,
  consumable: Number,
  otherExpense: Number,
  shippingCost: Number,
  purchaseDiscount: Number,
  cash: Number,
  credit: Number,
});

const Expense = mongoose.model('Expense', expenseSchema);

// 経費一覧ページを表示
app.get('/expenses', async (req, res) => {
  const expenses = await Expense.find({});
  res.render('expenses/expense', { expenseData: expenses });  // views/pages/expense.ejsをレンダリング
});


// 経費を追加
app.post('/expenses', async (req, res) => {
  const newExpense = new Expense(req.body);
  await newExpense.save();
  res.redirect('/expenses');
});

// 経費を削除
app.delete('/expenses/delete', async (req, res) => {
  const { ids } = req.body;
  await Expense.deleteMany({ _id: { $in: ids } });
  res.redirect('/expenses');
});

//ダウンロード時にデータを消去
app.delete('/expenses/delete-all', async (req, res) => {
    try {
        await Expense.deleteMany({});  // Expenseコレクション内のすべてのデータを削除
        res.status(200).send('All expenses deleted');
    } catch (error) {
        console.error('Error deleting all expenses:', error);
        res.status(500).send('Failed to delete expenses');
    }
});



const recipeSchema = new mongoose.Schema({
    recipeName: String,
    itemName: String,
    content: Number,
    unitPrice: Number,
    amountUsage: Number,
    amountFee: Number,
});

const Recipe = mongoose.model('Recipe', recipeSchema);


// ルート定義（app.js）
app.get('/recipes', async (req, res) => {
    res.render('recipes/recipeHome');  // views/recipes/recipeHome.ejsをレンダリング
});

// レシピ登録ページの表示
app.get('/recipes/recipeRegister', async (req, res) => {
    const recipes = await Recipe.find({});
    res.render('recipes/recipeRegister', { recipeData: recipes });
});

// レシピを追加
app.post('/recipes', async (req, res) => {
    try {
        const {
            recipeName,
            itemName,
            content = 0,  // デフォルト値を設定
            unitPrice = 0, // デフォルト値を設定
            amountUsage = 0, // デフォルト値を設定
            amountFee = 0 // デフォルト値を設定
        } = req.body;

        const newRecipe = new Recipe({
            recipeName,
            itemName,
            content,
            unitPrice,
            amountUsage,
            amountFee
        });

        await newRecipe.save();
        res.redirect('/recipes/recipeRegister');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});



// レシピの削除
app.delete('/recipes/delete', async (req, res) => {
    const { ids } = req.body;
    await Recipe.deleteMany({ _id: { $in: ids } });
    res.redirect('/recipes/recipeRegister');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

