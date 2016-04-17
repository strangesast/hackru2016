var mongoose = require('mongoose');
var Schema = mongoose.Schema;

Highscore = new Schema({
  name: String,
  score: Number
});

module.exports = mongoose.model('Highscore', Highscore);
