require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcryptjs');
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

// セッションの設定
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Passportの初期化
app.use(passport.initialize());
app.use(passport.session());

// EJSエンジンの設定
app.engine('ejs', engine);

// ユーザー情報をEJSテンプレートに渡すミドルウェア
app.use((req, res, next) => {
  res.locals.user = req.user;  // ログインしているユーザーがいる場合にuserオブジェクトを設定
  next();
});

// ユーザーのスキーマとモデル
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Passportのローカル戦略設定
passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await User.findOne({ username });
  if (!user) {
    return done(null, false, { message: 'Incorrect username.' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    return done(null, user);
  } else {
    return done(null, false, { message: 'Incorrect password.' });
  }
}));

// シリアライズとデシリアライズ
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ユーザー認証ルート
app.get('/register', (req, res) => {
  res.render('users/register');  // registerページをusersフォルダからレンダリング
});

app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // パスワードをハッシュ化
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.redirect('/login');  // 登録後、ログインページにリダイレクト
});

app.get('/login', (req, res) => {
  res.render('users/login');  // loginページをusersフォルダからレンダリング
});

app.post('/users/login', passport.authenticate('local', {
  successRedirect: '/', // ログイン成功後、recipeHomeページにリダイレクト
  failureRedirect: '/login'  // ログイン失敗時、ログインページにリダイレクト
}));

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');  // ログアウト後、ログインページにリダイレクト
  });
});

// ログイン必須のミドルウェア
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();  // 認証済みなら次のミドルウェアに進む
  }
  res.redirect('/login');  // 認証されていない場合、ログインページにリダイレクト
}




//home
// ホームページルート
app.get('/', isAuthenticated, async (req, res) => {
  try {
    // レシピ、在庫、経費、売上の総数を計算するためのデータを取得
    const totalRecipes = await Recipe.countDocuments();   // レシピの総数
    const totalStocks = await Stock.countDocuments();     // 在庫の総数
    const totalExpenses = await Expense.aggregate([{ $group: { _id: null, total: { $sum: "$purchase" } } }]); // 経費の合計
    const totalSales = await IncomeStatement.aggregate([{ $group: { _id: null, total: { $sum: "$productPrice" } } }]); // 売上の合計

    // 最近のアクティビティデータ (例えば、最新のレシピや売上の登録)
    const recentActivities = [
      { description: "New Recipe Registered: Tofu Salad", date: "2024-10-01" },
      { description: "Stock Updated: Soybean", date: "2024-10-05" },
      { description: "Expense Recorded: Packaging", date: "2024-10-10" },
      { description: "Sale Recorded: Tofu Burger", date: "2024-10-12" }
    ];

    // データを渡してhome.ejsをレンダリング
    res.render('home/home', { 
      totalRecipes, 
      totalStocks, 
      totalExpenses: totalExpenses[0] ? totalExpenses[0].total : 0, 
      totalSales: totalSales[0] ? totalSales[0].total : 0,
      recentActivities
    });
  } catch (error) {
    console.error("Error fetching data for home page:", error);
    res.status(500).send("Server Error");
  }
});



// 各モデルのスキーマ（既存のコード）
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
      amountUsage: { type: Number, default: 0 },
      amountFee: { type: Number, default: 0 }
    }
  ]
});

const Recipe = mongoose.model('Recipe', recipeSchema);

const stockSchema = new mongoose.Schema({
  date: Date,
  itemName: String,
  purchaseQuantity: Number,
  purchasePrice: Number,
  unitPrice: Number,
  remaining: Number,
  remainingValue: Number,
});

const Stock = mongoose.model('Stock', stockSchema);

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

// 経費関連のルート（ログイン必須）
app.get('/expenses', isAuthenticated, async (req, res) => {
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

app.post('/expenses', isAuthenticated, async (req, res) => {
  const newExpense = new Expense(req.body);
  await newExpense.save();
  res.redirect('/expenses');
});

app.delete('/expenses/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;
  await Expense.deleteMany({ _id: { $in: ids } });
  res.redirect('/expenses');
});

// レシピ関連のルート
app.get('/recipeHome', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // 現在のページ（デフォルトは1）
    const limit = 6; // 1ページあたりの表示件数
    const skip = (page - 1) * limit; // スキップするドキュメント数

    // MongoDBからページに応じたレシピデータを取得
    const recipes = await Recipe.find({})
      .skip(skip)
      .limit(limit);

    // 全てのレシピの数を取得
    const totalRecipes = await Recipe.countDocuments();

    // 総ページ数を計算
    const totalPages = Math.ceil(totalRecipes / limit);

    res.render('recipes/recipeHome', { recipes, currentPage: page, totalPages });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/recipes/recipeRegister', isAuthenticated, async (req, res) => {
  const stocks = await Stock.find();
  res.render('recipes/recipeRegister', { stocks });
});

app.post('/recipes', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipeImageUrl = req.file ? req.file.path : null;

    const newRecipe = {
      recipeName,
      recipeImage: recipeImageUrl,
      items: JSON.parse(items)
    };

    const recipe = await Recipe.create(newRecipe);
    res.json(recipe);
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).send('Error creating recipe');
  }
});

app.get('/recipes/edit/:id', isAuthenticated, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  const stocks = await Stock.find();
  res.render('recipes/recipeEdit', { recipe, stocks });
});

app.put('/recipes/:id', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    recipe.recipeName = recipeName;
    if (items) {
      recipe.items = JSON.parse(items);
    }

    if (req.file) {
      recipe.recipeImage = req.file.path;
    }

    await recipe.save();
    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

app.delete('/recipes/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);  // 該当するレシピを削除
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// 在庫関連のルート
app.get('/stockHome', isAuthenticated, async (req, res) => {
  try {
    const { sortField, sortOrder } = req.query;
    let sortOptions = {};

    if (sortField && sortOrder) {
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
    }

    const stocks = await Stock.find({}).sort(sortOptions);
    const stockData = stocks.map(stock => ({
      ...stock.toObject(),
      remaining: stock.remaining,
      remainingValue: stock.remainingValue
    }));

    res.render('stocks/stockHome', { stocks: stockData });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).send('Server Error');
  }
});

app.post('/stocks/add', isAuthenticated, async (req, res) => {
  const { date, itemName, purchaseQuantity, purchasePrice, unitPrice } = req.body;

  try {
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

app.delete('/stocks/delete', isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  try {
    await Stock.deleteMany({ _id: { $in: ids } });
    res.redirect('/stockHome');
  } catch (error) {
    console.error('Error deleting stocks:', error);
    res.status(500).send('Server Error');
  }
});

// 売上関連のルート
app.post('/incomeStatement/register', isAuthenticated, async (req, res) => {
  try {
    const { productName } = req.body;
    const recipe = await Recipe.findOne({ recipeName: productName });

    if (recipe) {
      for (const item of recipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName });
        if (!stock) {
          console.log("Stock not found for item:", item.itemName);
          continue;
        }

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
    res.redirect('/soldInfor');
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

app.get('/incomeStatement', isAuthenticated, async (req, res) => {
  const recipes = await Recipe.find();
  res.render('solds/incomeStatement', { recipes });
});

app.get('/soldInfor', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const incomeStatements = await IncomeStatement.find({})
      .skip(skip)
      .limit(limit);

    const totalDocuments = await IncomeStatement.countDocuments();
    const totalPages = Math.ceil(totalDocuments / limit);

    res.render('solds/soldInfor', { incomeStatements, currentPage: page, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

app.get('/soldEdit/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const statement = await IncomeStatement.findById(id);
    const recipes = await Recipe.find();

    if (!statement) {
      return res.status(404).send('Income Statement not found');
    }

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

app.put('/incomeStatement/update/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const depositAmount = sales - salesCommission - transferFee - shippingFee;

    const grossProfit = data.revenue - data.cogs;
    const netProfit = grossProfit - data.expenses;
    const netRatio = data.revenue != 0 ? ((netProfit / data.revenue) * 100).toFixed(2) : 0;

    const updatedData = {
      ...data,
      grossProfit,
      netProfit,
      ratio: netRatio,
      depositAmount
    };

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

