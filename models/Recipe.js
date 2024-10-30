const mongoose = require('mongoose');

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

module.exports = mongoose.model('Recipe', recipeSchema);
