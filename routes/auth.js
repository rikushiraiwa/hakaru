const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('users/register');
});

router.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  // req.flash('error', 'This is a test error message');
  res.render('users/login');
});



// ログイン処理
router.post('/users/login', passport.authenticate('local', {
  failureFlash: 'Invalid username or password',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});



module.exports = router;
