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
const User = require('./models/User'); 

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const recipeRoutes = require('./routes/recipes');
const stockRoutes = require('./routes/stocks');
const incomeStatementRoutes = require('./routes/incomeStatements');

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

// ルートの使用
app.use('/', homeRoutes);
app.use(authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/recipes', recipeRoutes);
app.use('/stocks', stockRoutes);
app.use('/incomeStatements', incomeStatementRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
