const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  // `password` フィールドは不要です
});

// `passport-local-mongoose` をプラグインとして追加
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
