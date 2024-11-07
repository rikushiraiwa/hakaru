const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recipeSchema = new Schema({
  recipeName: String,
  recipeImage: String,
  items: [
    {
      itemName: String,
      content: String,
      unitPrice: Number,
      amountUsage: { type: Number, default: 0 },
      amountFee: { type: Number, default: 0 }
    }
  ],
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }  // ユーザーを参照するフィールド
});

module.exports = mongoose.model('Recipe', recipeSchema);
