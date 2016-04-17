var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/player1', function(req, res, next) {
  res.render('orientation', { player: 'player1' });
});

router.get('/player2', function(req, res, next) {
  res.render('orientation', { player: 'player2' });
});

module.exports = router;
