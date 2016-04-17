var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var Highscore = require('../models/highscore');

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

router.get('/instructions', function(req, res, next) {
  res.render('instructions');
});

router.get('/high-scores', function(req, res, next) {
  Highscore.find({}).then(function(docs) {
    return res.render('high-scores', {scores: docs});
  }).catch(function(err) {
    return next(err);
  });
});
router.post('/high-scores', upload.array(), function(req, res, next) {
  var hs = new Highscore(req.body);
  hs.save().then(function(doc) {
    //return res.json(doc);
    return res.redirect('/high-scores');
  }).catch(function(err) {
    return next(err);
  });
});

module.exports = router;
