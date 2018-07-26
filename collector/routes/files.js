var express = require('express');
var router = express.Router();
var fs = require('fs');
var Model = require('./models');
var SHA1 = require('sha1');

var JFUM = require('jfum');
var jfum = new JFUM({
    minFileSize: 1,                      // 1kB
    maxFileSize: 5242880,                     // 5 mB
    acceptFileTypes: /\.(csv|xls|xlsx)$/i    // 支持表格样式
});

/* 文件上传. */
router.post('/upload/',jfum.postHandler.bind(jfum),function(req, res) {
    console.log(req.jfum.files)
    if (req.jfum.error) {
        // req.jfum.error
        console.log(req.jfum.error)
    } else {
        // Here are the uploaded files
        for (var i = 0; i < req.jfum.files.length; i++) {
            var file = req.jfum.files[i];
            // 读取文件，写到本地
            // Check if file has errors
            if (file.errors.length > 0) {
                for (var j = 0; i < file.errors.length; i++) {
                    // file.errors[j].code
                    // file.errors[j].message
                }
            } else {
                var tempFilePath = file.path;
                var fileName = file.name;
                var fileSize = file.size;
                var fileType = file.mime;
                var filePath = file.path;
                var tempFile = fs.readFileSync(tempFilePath);
                console.log(tempFile);
                console.log(fileName);
                var dateTime = new Date().getTime();
                var fileSha1 = SHA1(dateTime.toString()+fileName);
                // save file record
                // 将文件内容保存在mongodb
                // 将文件信息持久化到数据库
                Model.File.create([{
                    time          : dateTime.toString(),    // 微博创建的时间
                    sha1          : fileSha1,    // blog的sha1
                    name          : fileName,    // 文件名称
                    size          : fileSize,    // 文件的大小
                    type          : fileType,    // 文件类型
                    path          : filePath,    // 文件的存储路径
                    creator_sha1  : "",          // 创建者信息
                    content       : tempFile     //文件缩略图的内容

                }],function (err,item){
                    console.log(err);
                    res.send(file);
                });
            }

        }
    }
});

/* 获取文件列表 */
router.get('/list/', function(req, res, next) {
    var query = req.query;
    var page = query['page'];
    var size = query['size'];
    var start_num = (page-1)*size;
    console.log(query);
    Model.File.all().limit(size).offset(start_num).run(function (err, files) {
        console.log(files);
        res.send({'info':'OK','files': files});
    });

});

/* 文件详情 */
router.get('/details/', function(req, res, next) {
    var query = req.query;
    var file_sha1 = query['key'];
    var page = query['page'] || 1;
    var size = query['size'] || 10;
    var start_num = (page-1)*size;
    Model.File.find({'sha1': file_sha1}).run(function (err, files) {
        console.log('xxxxx',files);
        var file = files[0];

        res.render('details', { title: '数据收集器详情','content':file.content});
    });

});

/* 文件下载 */
router.post('/download/', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
