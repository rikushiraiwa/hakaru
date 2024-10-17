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
      amountUsage: { type: Number, default: 0 }, // デフォルト値を0に設定
      amountFee: { type: Number, default: 0 }    // デフォルト値を0に設定
    }
  ]
});

const Recipe = mongoose.model('Recipe', recipeSchema);


// Stockスキーマに unitPrice, remaining, remainingValue を追加
const stockSchema = new mongoose.Schema({
  date: Date,
  itemName: String,
  purchaseQuantity: Number,
  purchasePrice: Number,
  unitPrice: Number, // 単価を追加
  remaining: Number,   // 残量を追加 (初期値を0に設定)
  remainingValue: Number, 
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
  const { sortField, sortOrder } = req.query;
  let sortOptions = {};

  // ソートフィールドとソート順が指定されている場合、それに基づいてソート
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

    // レシピデータとページネーションの情報をテンプレートに渡す
    res.render('recipes/recipeHome', { recipes, currentPage: page, totalPages });
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
  const stocks = await Stock.find();
  res.render('recipes/recipeEdit', { recipe, stocks });
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
    res.json(recipe);  // レスポンスとしてJSONを返す
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).send('Error creating recipe');
  }
});




// レシピを削除するルート
app.delete('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);  // 該当するレシピを削除
    res.json({ message: 'Recipe deleted successfully' });  // レスポンスとして削除成功を返す
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});







//Stocks



// 在庫一覧ページの表示
app.get('/stockHome', async (req, res) => {
  try {
    // クエリパラメータからsortFieldとsortOrderを取得
    const { sortField, sortOrder } = req.query;
    let sortOptions = {};

    // sortFieldとsortOrderが指定されていれば、そのフィールドでソートする
    if (sortField && sortOrder) {
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;  // 昇順なら1、降順なら-1
    }

    // ソートオプションを使ってデータを取得
    const stocks = await Stock.find({}).sort(sortOptions);

    // 各在庫に対して、残量と残量高を計算せず、データベースから取得した値を使用する
    const stockData = stocks.map(stock => {
      return {
        ...stock.toObject(),
        remaining: stock.remaining,      // そのままデータベースから取得した値を使用
        remainingValue: stock.remainingValue // そのままデータベースから取得した値を使用
      };
    });

    // 取得した在庫データを `stockHome.ejs` テンプレートに渡す
    res.render('stocks/stockHome', { stocks: stockData });
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
    const { productName } = req.body;

    // 選択されたレシピに基づいてStockの更新
    const recipe = await Recipe.findOne({ recipeName: productName });

    if (recipe) {
      // レシピの各アイテムについてStockを更新
      for (const item of recipe.items) {
        const stock = await Stock.findOne({ itemName: item.itemName });
        if (!stock) {
          console.log("Stock not found for item:", item.itemName);
          continue;  // Stockが見つからなかった場合、次のアイテムに進む
        }

        // 現在の残量と残量高が未定義の場合は、購入数量・購入価格で初期化
        stock.remaining = typeof stock.remaining === 'number' ? stock.remaining : stock.purchaseQuantity;
        stock.remainingValue = typeof stock.remainingValue === 'number' ? stock.remainingValue : stock.purchasePrice;

        // 残量と残量高の計算
        const newRemaining = stock.remaining - item.amountUsage;
        const newRemainingValue = stock.remainingValue - item.amountFee;

        // 残量や残量高がNaNにならないようチェックし、負の値にならないよう調整
        stock.remaining = !isNaN(newRemaining) ? Math.max(newRemaining, 0) : stock.purchaseQuantity;
        stock.remainingValue = !isNaN(newRemainingValue) ? Math.max(newRemainingValue, 0) : stock.purchasePrice;

        await stock.save();  // Stockの保存
      }
    }


    // Gross Profit, Net Profit, Ratioの計算
    const { revenue, cogs, expenses, sales, salesCommission, transferFee, shippingFee } = req.body;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const ratio = revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;
    const depositAmount = sales - salesCommission - transferFee - shippingFee;


    // データベースに保存
    const newIncomeStatement = new IncomeStatement({
      ...req.body,
      grossProfit,
      netProfit,
      ratio,
      depositAmount
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
// soldInforページを表示
app.get('/soldInfor', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // 現在のページ（デフォルトは1）
    const limit = 6; // 1ページあたりの表示件数
    const skip = (page - 1) * limit; // スキップするドキュメント数

    // MongoDBからページに応じたIncomeStatementデータを取得
    const incomeStatements = await IncomeStatement.find({})
      .skip(skip)
      .limit(limit);

    // 全てのIncomeStatementの数を取得
    const totalDocuments = await IncomeStatement.countDocuments();

    // 総ページ数を計算
    const totalPages = Math.ceil(totalDocuments / limit);

    // soldInforテンプレートにデータを渡す
    res.render('solds/soldInfor', { incomeStatements, currentPage: page, totalPages });
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

    const depositAmount = sales - salesCommission - transferFee - shippingFee;

    // サーバーサイドで計算
    const grossProfit = data.revenue - data.cogs;
    const netProfit = grossProfit - data.expenses;
    const netRatio = data.revenue != 0 ? ((netProfit / data.revenue) * 100).toFixed(2) : 0;

    // 更新データ
    const updatedData = {
      ...data,  // フォームデータを展開
      grossProfit,  // 計算結果
      netProfit,    // 計算結果
      ratio: netRatio,
      depositAmount 
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

