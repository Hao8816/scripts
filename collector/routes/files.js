var express = require('express');
var router = express.Router();

/* 文件上传. */
router.post('/upload/', function(req, res, next) {
    console.log(req.body);
    res.send('respond with a resource');
});

router.post('/download/', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
