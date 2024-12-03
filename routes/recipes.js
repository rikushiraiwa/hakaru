const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Stock = require('../models/Stock');
const { isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;


// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipeImages',
    allowed_formats: ['jpg', 'png', 'jpeg']
  },
});

const upload = multer({ storage });

// レシピ一覧ページ（ユーザーごとにフィルタリング）
router.get('/recipeHome', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    // 現在のユーザーが作成したレシピのみを取得
    const recipes = await Recipe.find({ user: req.user._id }).skip(skip).limit(limit);
    const totalRecipes = await Recipe.countDocuments({ user: req.user._id }); // ユーザーのレシピのみカウント
    const totalPages = Math.ceil(totalRecipes / limit);

    res.render('recipes/recipeHome', { recipes, currentPage: page, totalPages });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Server Error');
  }
});

// レシピ登録ページ
router.get('/recipeRegister', isAuthenticated, async (req, res) => {
  const stocks = await Stock.find();
  res.render('recipes/recipeRegister', { stocks });
});

// レシピの新規登録（ログイン中のユーザーに関連付け）
router.post('/', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipeImageUrl = req.file ? req.file.path : null;

    const newRecipe = new Recipe({
      recipeName,
      recipeImage: recipeImageUrl,
      items: JSON.parse(items), // JSONパースして保存
      user: req.user._id
    });
    await newRecipe.save();
    res.json(newRecipe);
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).send('Error creating recipe');
  }
});


// レシピ編集ページ（ユーザーが作成したレシピのみ表示）
router.get('/edit/:id', isAuthenticated, async (req, res) => {
  try {
      const recipe = await Recipe.findOne({ _id: req.params.id, user: req.user._id });
      const stocks = await Stock.find();

      if (!recipe) {
          return res.status(404).send('Recipe not found or you do not have permission to view this recipe');
      }

      res.render('recipes/recipeEdit', { recipe, stocks });
  } catch (error) {
      console.error("Error in recipe edit route:", error);
      res.status(500).send('Internal Server Error');
  }
});



// レシピの更新（ユーザーのレシピのみ更新可能）
router.put('/:id', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipe = await Recipe.findOne({ _id: req.params.id, user: req.user._id }); // ユーザーのレシピを取得

    if (!recipe) {
      return res.status(404).send('Recipe not found or you do not have permission to update this recipe');
    }

    // 新しいレシピ名があれば更新
    recipe.recipeName = recipeName;

    // 受け取ったアイテムをパースして、既存の items に上書きする
    recipe.items = JSON.parse(items);

    // 画像が更新された場合
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


// レシピの削除（ユーザーのレシピのみ削除可能）
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, user: req.user._id }); // ユーザーのレシピを削除

    if (!recipe) {
      return res.status(404).send('Recipe not found or you do not have permission to delete this recipe');
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

module.exports = router;
