require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');


// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// MulterのCloudinaryストレージ設定
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipeImages', // アップロードするフォルダ名
    allowed_formats: ['jpg', 'png', 'jpeg']
  },
});

const upload = multer({ storage });

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

const recipeSchema = new mongoose.Schema({
  recipeName: String,
  recipeImage: String, 
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


// Stockスキーマに unitPrice と remaining を追加
const stockSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  itemName: { type: String, required: true },
  purchaseQuantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  unitPrice: { type: Number },  // 単価を追加
  remaining: { type: Number }   // 残量を追加 (必要に応じて)
});

const Stock = mongoose.model('Stock', stockSchema);


// IncomeStatementのスキーマを作成
const incomeStatementSchema = new mongoose.Schema({
  registerDate: String,
  customerName: String,
  productName: String,
  productPrice: Number,
  orderDate: String,
  shippingDate: String,
  payment: Number,
  uncollectedPrice: Number,
  sales: Number,
  salesCommission: Number,
  transferFee: Number,
  shippingFee: Number,
  depositAmount: Number,
  revenue: Number,
  cogs: Number,
  expenses: Number,
  grossProfit: Number,
  netProfit: Number,
  ratio: Number
});

const IncomeStatement = mongoose.model('IncomeStatement', incomeStatementSchema);


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






//Recipes


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
app.get('/recipes/recipeRegister', async (req, res) => {
  const stocks = await Stock.find();
  res.render('recipes/recipeRegister', { stocks });
});


// 既存のレシピ編集用のルート
app.get('/recipes/edit/:id', async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  res.render('recipes/recipeEdit', { recipe });
});


// 既存レシピの更新
app.put('/recipes/:id', upload.single('recipeImage'), async (req, res) => {
  try {
      const { recipeName, items } = req.body;
      const recipe = await Recipe.findById(req.params.id);

      // レシピ名の更新
      recipe.recipeName = recipeName;

      // アイテムリストが送信されている場合、新しいアイテムを追加する
      if (items) {
        recipe.items = JSON.parse(items); // 新しいアイテムリストで上書き
    }

      // 画像がアップロードされている場合、CloudinaryのURLを更新
      if (req.file) {
          recipe.recipeImage = req.file.path; // Cloudinaryにアップロードされた画像のURL
      }

      // レシピを保存
      await recipe.save();
      res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
      console.error('Error updating recipe:', error);
      res.status(500).json({ error: 'Failed to update recipe' });
  }
});




//Add Recipe
app.post('/recipes', upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipeImageUrl = req.file ? req.file.path : null; // 画像のURLを取得

    const newRecipe = {
      recipeName,
      recipeImage: recipeImageUrl,
      items: JSON.parse(items)  // itemsは文字列として送信されるので、パースします
    };

    const recipe = await Recipe.create(newRecipe);
    res.json(recipe);
    res.redirect('/recipeHome');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating recipe');
  }
});


// レシピの削除,いらないかも
app.delete('/recipes/delete', async (req, res) => {
    const { ids } = req.body;
    await Recipe.deleteMany({ _id: { $in: ids } });
    res.redirect('/recipes/recipeRegister');
});






//Stocks



// 在庫一覧ページの表示
app.get('/stockHome', async (req, res) => {
  try {
    const stocks = await Stock.find({});
    res.render('stocks/stockHome', { stocks });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).send('Server Error');
  }
});

// 在庫の追加処理
app.post('/stocks/add', async (req, res) => {
  const { date, itemName, purchaseQuantity, purchasePrice, unitPrice } = req.body;

  try {
    // 日付を日本標準時（JST）に調整
    const dateObj = new Date(date);
    const correctedDate = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000));

    const newStock = new Stock({
      date: correctedDate,
      itemName,
      purchaseQuantity,
      purchasePrice,
      unitPrice
    });

    await newStock.save();
    res.redirect('/stockHome');
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

// 在庫の削除処理 (削除された在庫データを処理)
app.delete('/stocks/delete', async (req, res) => {
  const { ids } = req.body;

  try {
    // 選択されたIDを持つ在庫を削除
    await Stock.deleteMany({ _id: { $in: ids } });
    res.redirect('/stockHome');
  } catch (error) {
    console.error('Error deleting stocks:', error);
    res.status(500).send('Server Error');
  }
});









//solds


// Registerボタンが押されたときにデータを保存
app.post('/incomeStatement/register', async (req, res) => {
  try {
    const { revenue, cogs, expenses } = req.body;

    // Gross Profit, Net Profit, Ratioの計算
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const ratio = revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;

    // データベースに保存
    const newIncomeStatement = new IncomeStatement({
      ...req.body,
      grossProfit,
      netProfit,
      ratio
    });

    await newIncomeStatement.save();
    res.redirect('/soldInfor'); // 保存後にリダイレクト
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});


//IncomeStatementページを表示
app.get('/incomeStatement', async (req, res) => {
  const recipes = await Recipe.find(); // 登録されている全てのレシピを取得
  res.render('solds/incomeStatement', { recipes });
});


// soldInforページを表示
app.get('/soldInfor', async (req, res) => {
  try {
    // MongoDBから全てのIncomeStatementデータを取得
    const incomeStatements = await IncomeStatement.find({});
    
    // soldInforテンプレートにデータを渡す
    res.render('solds/soldInfor', { incomeStatements });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});



// IncomeStatement編集用のルート
app.get('/soldEdit/edit/:id', async (req, res) => {
  try {
    // URLからIDを取得
    const { id } = req.params;

    // MongoDBからIDに基づいてIncomeStatementを取得
    const statement = await IncomeStatement.findById(id);

    // 登録されている全てのレシピを取得
    const recipes = await Recipe.find();
    

    if (!statement) {
      return res.status(404).send('Income Statement not found');
    }

    // 取得したデータをテンプレートに渡す
    res.render('solds/soldEdit', {
      registerDate: statement.registerDate,
      orderDate: statement.orderDate,
      shippingDate: statement.shippingDate,
      customerName: statement.customerName,
      productName: statement.productName,
      productPrice: statement.productPrice,
      payment: statement.payment,
      uncollectedPrice: statement.uncollectedPrice,
      sales: statement.sales,
      salesCommission: statement.salesCommission,
      transferFee: statement.transferFee,
      shippingFee: statement.shippingFee,
      depositAmount: statement.depositAmount,
      revenue: statement.revenue,
      cogs: statement.cogs,
      expenses: statement.expenses,
      grossProfit: statement.grossProfit,
      netProfit: statement.netProfit,
      netRatio: statement.ratio,
      id: statement._id,
      recipes
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});


// 編集用のPUTルート
app.put('/incomeStatement/update/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // フォームから送信されたデータをそのまま取得
    const data = req.body;

    // サーバーサイドで計算
    const grossProfit = data.revenue - data.cogs;
    const netProfit = grossProfit - data.expenses;
    const netRatio = data.revenue != 0 ? ((netProfit / data.revenue) * 100).toFixed(2) : 0;

    // 更新データ
    const updatedData = {
      ...data,  // フォームデータを展開
      grossProfit,  // 計算結果
      netProfit,    // 計算結果
      ratio: netRatio // 計算結果
    };

    // データベースを更新
    await IncomeStatement.findByIdAndUpdate(id, updatedData, { new: true });

    res.redirect('/soldInfor');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});









app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

