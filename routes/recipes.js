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

// レシピ一覧ページ
router.get('/recipeHome', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const recipes = await Recipe.find({}).skip(skip).limit(limit);
    const totalRecipes = await Recipe.countDocuments();
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

// レシピの新規登録
router.post('/', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
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

// レシピ編集ページ
router.get('/edit/:id', isAuthenticated, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  const stocks = await Stock.find();
  res.render('recipes/recipeEdit', { recipe, stocks });
});

// レシピの更新
router.put('/:id', isAuthenticated, upload.single('recipeImage'), async (req, res) => {
  try {
    const { recipeName, items } = req.body;
    const recipe = await Recipe.findById(req.params.id);

    recipe.recipeName = recipeName;
    if (items) {
        const newItems = JSON.parse(items);  // 新しいアイテムをパース
        recipe.items.push(...newItems);      // 既存のitemsに新しいitemsを追加
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

// レシピの削除
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

module.exports = router;
