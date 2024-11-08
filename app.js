require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const passport = require('passport');
const session = require('express-session');
const User = require('./models/User');
const flash = require('connect-flash');

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const recipeRoutes = require('./routes/recipes');
const stockRoutes = require('./routes/stocks');
const incomeStatementRoutes = require('./routes/incomeStatements');

const app = express();

// MongoDBへの接続
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hakaru')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// セッションの設定
const sessionConfig = {
  secret: process.env.SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  }
};
app.use(session(sessionConfig));

// フラッシュメッセージの設定
app.use(flash());

// Passportの初期化
app.use(passport.initialize());
app.use(passport.session());


// Passportのローカル戦略設定
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// フラッシュメッセージとユーザー情報をローカル変数に設定
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user;
  next();
});

// ルートの使用
app.use('/', homeRoutes);
app.use(authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/recipes', recipeRoutes);
app.use('/stocks', stockRoutes);
app.use('/incomeStatements', incomeStatementRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

