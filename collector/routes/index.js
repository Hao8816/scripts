var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '数据收集器' });
});

router.get('/details/', function(req, res, next) {
  res.render('details', { title: '数据收集器详情' });
});

router.get('/task/', function(req, res, next) {
    res.render('task', { title: '任务详情' });
});

module.exports = router;
