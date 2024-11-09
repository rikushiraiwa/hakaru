const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('users/register');
});

// ユーザー登録処理
router.post('/register', async (req, res, next) => {  // パスを修正
  const { username, password } = req.body;
  try {
    const newUser = await User.register(new User({ username }), password);
    req.logIn(newUser, (err) => {
      if (err) return next(err);
      req.flash('success', 'ようこそ！登録およびログインが完了しました。');
      res.redirect('/');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/users/register'); // フラッシュメッセージと共にリダイレクト
  }
});

router.get('/login', (req, res) => {
  res.render('users/login');
});

// ログイン処理
router.post('/login', passport.authenticate('local', {
  failureFlash: 'ユーザー名またはパスワードが無効です',
  failureRedirect: '/users/login'
}), (req, res) => {
  res.redirect('/');
});

// ログアウト処理
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success', 'ログアウトしました！');
    res.redirect('/users/login');
  });
});

module.exports = router;
