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
app.use(express.json());
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
    items: [
      {
        itemName: String,
        content: Number,
        unitPrice: Number,
        amountUsage: Number,
        amountFee: Number,
      }
    ]
});

const Recipe = mongoose.model('Recipe', recipeSchema);



// ルート定義（app.js）
app.get('/recipeHome', async (req, res) => {
  try {
      // MongoDBから全てのレシピを取得
      const recipes = await Recipe.find({});
      
      // 取得したレシピを `recipeHome.ejs` テンプレートに渡す
      res.render('recipes/recipeHome', { recipes });
  } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).send('Server Error');
  }
});


// レシピ登録ページの表示
// app.get('/recipes/recipeRegister', async (req, res) => {
//     const recipes = await Recipe.find({});
//     res.render('recipes/recipeRegister', { recipeData: recipes });
// });
// 新しいレシピ登録用のルート (空のフォームを表示)
app.get('/recipes/recipeRegister', (req, res) => {
  // 空のデータを渡す
  res.render('recipes/recipeRegister', { recipeData: [] });
});

// 既存のレシピ編集用のルート
app.get('/recipes/edit/:id', async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  res.render('recipes/recipeEdit', { recipe });
});

// 既存レシピの更新
app.put('/recipes/edit/:id', async (req, res) => {
  try {
      console.log('Request body:', req.body);  // 送信されたデータを確認
      const { recipeName, items } = req.body;

      // itemsが配列として送信されているか確認
      if (!Array.isArray(items)) {
          throw new Error('Items should be an array');
      }

      // レシピを更新
      const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, { recipeName, items }, { new: true });

      if (!updatedRecipe) {
          throw new Error('Recipe not found');
      }

      console.log('Recipe updated successfully:', updatedRecipe);
      res.redirect('/recipeHome');
  } catch (error) {
      console.error('Error updating recipe:', error.message);
      res.status(500).send('Server Error: ' + error.message);
  }
});





// レシピを追加
app.post('/recipes', async (req, res) => {
  try {
      const { recipeName, items } = req.body;

      if (!recipeName || !items || items.length === 0) {
          return res.status(400).json({ message: 'Recipe name and items are required' });
      }

      // 既存のレシピがあるか確認
      let recipe = await Recipe.findOne({ recipeName });

      if (!recipe) {
          // 既存のレシピがなければ新規作成
          recipe = new Recipe({ recipeName, items: [] });
      }

      // 新しいアイテムを追加
      recipe.items = items;

      // 保存
      await recipe.save();
      res.status(200).json({ message: 'Recipe saved successfully', recipe }); // JSONレスポンスを返す
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
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

