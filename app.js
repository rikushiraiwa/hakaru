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
const flash = require('connect-flash');

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
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
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
  } catch (err) {
    return done(err);
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

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
