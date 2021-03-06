var express = require('express');
var router = express.Router();
var fs = require('fs');
var Model = require('./models');
var SHA1 = require('sha1');

var JFUM = require('jfum');
var jfum = new JFUM({
    minFileSize: 1,                      // 1kB
    maxFileSize: 10242880,                     // 5 mB
    acceptFileTypes: /\.(csv|xls|xlsx)$/i    // 支持表格样式
});

var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8'});

// 文件处理状态描述
var FileStatusType = {
    0 : '待处理',
    1 : '正在处理',
    2 : '已处理'
}


// 文件尺寸计算
function size_format(b){
    if (b < 1000){
        return b + 'B'
    }else if(1000 <= b < 1000000){
        return parseFloat(b/1000) + 'KB'
    }else if(1000000 <= b < 1000000000){
        return parseFloat(b/1000000) + 'MB'
    }else if(1000000000 <= b < 1000000000000){
        return parseFloat(b/1000000000) + 'GB'
    }else if(1000000000000 <= b ){
        return parseFloat(b/1000000000000) + 'TB'
    }
}

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
                console.log(fileName);
                var dateTime = new Date().getTime();
                var fileSha1 = SHA1(dateTime.toString()+fileName);

                // 存储csv
                var data = {
                    'path': file.path,
                    'sha1': fileSha1
                };
                client.submitJob('save_file', JSON.stringify(data)).then(function (result) {
                    var result = JSON.parse(result);
                    console.log('文件',result);
                    if (result['file_status'] == 1){
                        var csvPath = result['csv_path'];
                        // 将文件信息持久化到数据库
                        Model.File.create([{
                            time          : dateTime.toString(),    // 微博创建的时间
                            sha1          : fileSha1,    // blog的sha1
                            name          : fileName,    // 文件名称
                            size          : fileSize,    // 文件的大小
                            type          : fileType,    // 文件类型
                            path          : csvPath,     // 文件的存储路径
                            creator_sha1  : "",          // 创建者信息
                            status        : 0            //文件状态

                        }],function (err,item){
                            if (err){
                                console.log(err);
                                return res.send({'info':'ERROR'});
                            }

                            console.log('文件保存成功');
                            res.send(file);
                        });
                    }else{
                        res.send({ info: 'ERROR','result':result});
                    }
                });
            }
        }
    }
});

/* 获取文件列表 */
router.get('/list/', function(req, res, next) {
    var query = req.query;
    var page = parseInt(query['page']) || 1;
    var size = parseInt(query['size']) || 10;
    var start_num = (page-1)*size;
    console.log(query);
    Model.File.all().limit(size).offset(start_num).run(function (err, files) {
        Model.File.count(function (err, total_counts) {
            console.log(files);
            var file_list = [];
            for(var i=0;i<files.length;i++){
                var file = files[i];
                file['size_label'] = size_format(file.size);
                file['status_label'] = FileStatusType[file.status] || '未知状态';
                file_list.push(file)
            }
            if (total_counts % size == 0){
                var max_page = total_counts/size;
            }else{
                var max_page = total_counts/size + 1;
            }
            var result = {
                'max_page': max_page,
                'total': total_counts,
                'files': files
            };
            res.send({'info':'OK','result': result});
        });
    });
});

/* 文件详情 */
router.get('/details/', function(req, res, next) {
    var query = req.query;
    console.log('xxxxx',query);
    var file_sha1 = query['key'];
    var page = parseInt(query['page']) || 1;
    var size = parseInt(query['size']) || 10;
    var start_num = (page-1)*size;
    Model.File.find({'sha1': file_sha1}).run(function (err, files) {
        console.log('xxxxx',files);
        if(err || files.length==0){
            res.send({'info':'OK','result': {}});
            return;
        }

        var file = files[0];
        if (file.status == 0){
            var data = {
                'path': file.path,
                'page': page,
                'size': size
            };
            client.submitJob('read_file', JSON.stringify(data)).then(function (result) {
                var result = JSON.parse(result);
                result['details'] = file;
                res.send({ info: 'OK','result':result});
            });
        }else{
            Model.Task.find({'file_sha1':file_sha1}).limit(size).offset(start_num).run(function (err, tasks) {
                console.log(tasks);
                var headers = ['任务名称','创建时间','总页数','已完成','状态','最后更新时间'];
                var columns = [];
                for (var i=0;i<tasks.length;i++){
                    var dic = {};
                    var task = tasks[i];
                    dic['任务名称'] = task.name;
                    dic['总页数'] = task.total;
                    dic['已完成'] = task.current;
                    dic['创建时间'] = task.time;
                    dic['最后更新时间'] = task.update_time;
                    dic['状态'] = FileStatusType[task.status] || '未知状态';
                    dic['sha1'] = task.sha1;
                    dic['name'] = task.name;
                    columns.push(dic);
                }

                var total_counts = parseInt(file.total);
                if (total_counts % size == 0){
                    var max_page = total_counts/size;
                }else{
                    var max_page = total_counts/size + 1;
                }
                var result = {
                    'headers': headers,
                    'columns': columns,
                    'max_page': max_page,
                    'total': total_counts,
                    'details': file
                };
                res.send({'info':'OK','result': result});
            });
        }
    });
});


/* 文件详情（处理任务） */
router.post('/check/', function(req, res, next) {
    var data = req.body;
    console.log('xxxxx',data);
    var column_name = data['column_name'];
    var file_sha1 = data['file_sha1'];
    Model.File.find({'sha1': file_sha1}).run(function (err, files) {
        console.log('xxxxx',files);
        var file = files[0];
        var data = {
            'path': file.path,
            'size': -1,
            'column': column_name
        };
        client.submitJob('read_file', JSON.stringify(data)).then(function (result) {
            var result = JSON.parse(result);
            console.log('文件截取后内容',result);
            var columns = result['columns'];
            var dateTime = new Date().getTime();
            var task_list = [];
            for (var i=0;i<columns.length;i++){
                console.log(columns[i],column_name);
                var taskName = columns[i][column_name];
                console.log('任务名称',taskName);
                if (!taskName){
                    continue;
                }
                var taskSha1 = SHA1(taskName);
                var task = {
                    time          : dateTime.toString(),
                    sha1          : taskSha1,
                    name          : taskName,
                    total         : 0,
                    current       : 0,
                    update_time   : dateTime.toString(),
                    file_sha1     : file_sha1,
                    status        : 0
                };
                task_list.push(task);
            }
            Model.Task.create(task_list,function (err,items){
                console.log(err);
                res.send({ info: 'OK'});
            });

            // 修改文件的处理状态
            file.status = 1;
            file.total = result['total'];
            file.save();
        });

    });
});

/* 修改任务信息 */
router.post('/task/modify/', function(req, res, next) {
    var data = req.body;
    console.log('xxxxx',data);
    var task_name = data['name'];
    var task_priority = data['priority'];
    var task_sha1 = data['task_sha1'];
    Model.Task.find({'sha1': task_sha1}).run(function (err, tasks) {
        console.log('xxxxx',tasks);
        if(err || tasks.length==0){
            res.send({'info':'OK','result': {}});
            return;
        }
        var task = tasks[0];
        // 修改文件的处理状态
        task.priority = task_priority;
        task.name = task_name;
        task.save();
    });
});

/* 任务详情 */
router.get('/task/details/', function(req, res, next) {
    var query = req.query;
    var task_sha1 = query['key'];
    var page = parseInt(query['page']) || 1;
    var size = parseInt(query['size']) || 10;
    var start_num = (page-1)*size;
    Model.Task.find({'sha1': task_sha1}).run(function (err, tasks) {
        console.log('xxxxx',tasks);
        if(err || tasks.length==0){
            res.send({'info':'OK','result': {}});
            return;
        }
        var task = tasks[0];

        // 修改文件的处理状态
        Model.TaskResult.find({'task_sha1': task.sha1}).limit(size).offset(start_num).run(function(err, results){
            var headers = ['子任务名称','创建时间','链接地址','其他信息','状态','最后更新时间'];
            var columns = [];
            // 统计数量
            Model.TaskResult.count({'task_sha1': task.sha1}, function (err, total_counts) {
                console.log("We have %d Does in our db", total_counts);
                if (total_counts % size == 0){
                    var max_page = total_counts/size;
                }else{
                    var max_page = parseInt(total_counts/size) + 1;
                }
                var result = {
                    'results': results,
                    'max_page': max_page,
                    'total': total_counts,
                    'details': task
                };
                res.send({'info':'OK','result': result});
            });
        });
    });
});

/* 任务详情 */
router.get('/task/details/', function(req, res, next) {
    var query = req.query;
    var task_sha1 = query['key'];
    var page = parseInt(query['page']) || 1;
    var size = parseInt(query['size']) || 10;
    var start_num = (page-1)*size;
    Model.Task.find({'sha1': task_sha1}).run(function (err, tasks) {
        console.log('xxxxx',tasks);
        if(err || tasks.length==0){
            res.send({'info':'OK','result': {}});
            return;
        }
        var task = tasks[0];

        // 修改文件的处理状态
        Model.TaskResult.find({'task_sha1': task.sha1}).limit(size).offset(start_num).run(function(err, results){
            var headers = ['子任务名称','创建时间','链接地址','其他信息','状态','最后更新时间'];
            var columns = [];
            // 统计数量
            Model.TaskResult.count({'task_sha1': task.sha1}, function (err, total_counts) {
                console.log("We have %d Does in our db", total_counts);
                if (total_counts % size == 0){
                    var max_page = total_counts/size;
                }else{
                    var max_page = parseInt(total_counts/size) + 1;
                }
                var result = {
                    'results': results,
                    'max_page': max_page,
                    'total': total_counts,
                    'details': task
                };
                res.send({'info':'OK','result': result});
            });
        });
    });
});


/* 文件下载 */
router.post('/download/', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
