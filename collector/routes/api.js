var express = require('express');
var router = express.Router();
var fs = require('fs');
var Model = require('./models');
var SHA1 = require('sha1');
var moment = require('moment');

var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8'});

// 任务分配的接口
router.get('/task/', function(req, res, next) {
    // 处理一下
    var query = req.query;
    var type = query['type'];
    var dateTime = new Date().getTime();
    if (type == 'task'){
        var base_url = 'https://www.tianyancha.com/search?key=';
        Model.Task.find({'status':0}).limit(1).run(function(err,tasks){
            if(err || tasks.length == 0){
                console.log('初始化任务失败，暂无任务',err);
                return;
            }
            var task = tasks[0];
            //  标记任务正在进行
            task.status = 1;
            task.update_time = dateTime.toString();
            task.save();

            var task_url = base_url+ encodeURIComponent(task.name);
            res.send({'url':task_url});
        });
    }else if(type == 'result'){
        Model.TaskResult.find({'status':0}).limit(1).run(function(err,tasks){
            if(err || tasks.length == 0){
                console.log('初始化任务失败，暂无任务',err);
                return;
            }
            var task = tasks[0];
            task.status = 1;
            task.update_time = dateTime.toString();
            task.save();

            res.send({'url':task.url});
        });
    }
});

// 结果详情的接口
router.post('/details/$', function(req, res, next) {
    // 处理一下
    console.log(req.body);
    var data = req.body;
    var task_name = data['task'];
    var info = data['result'];
    console.log('任务信息',task_name);

    Model.TaskResult.find({'name':task_name}).run(function(err,results){
        // 判断查询结果
        if (err || results.length==0){
            return;
        }
        var dateTime = new Date().getTime();
        var docs = [];
        for(var i=0;i<results.length;i++){
            var result = results[i];
            result.update_time = dateTime.toString();
            result.status = 2; // 任务标记完成
            result.info = info;
            result.save()

            var dic = {};
            dic['sha1'] = SHA1(result.name);
            dic['name'] = result.name;
            dic['update_time'] = moment(Number(result.update_time)).format();
            dic['url'] = result.url;
            dic['info'] = result.info;
            dic['status'] = result.status;
            dic['suggest'] = {'input': [result.name]};
            docs.push(dic);
        }
        client.submitJob('index_doc', JSON.stringify({'docs':docs})).then(function (result) {
            console.log('发送更新消息',result);
        });

        res.send({'info':'OK'});
    });
});

// 任务结果
router.post('/result/$', function(req, res, next) {
    // 处理一下
    var data = req.body;
    console.log('爬虫返回数据',data);
    var task_info = data['task'];
    var result_list = data['result'];
    var total_page = task_info['total'];
    var current_page = task_info['current'];
    // 查询任务的信息
    Model.Task.find({'name':task_info['name']}).run(function(err,tasks){
        // 判断查询结果
        if (err || tasks.length==0){
            return;
        }
        var dateTime = new Date().getTime();
        task_info['update_time'] = dateTime.toString();

        // 实时消息更新
        client.submitJob('send_message', JSON.stringify(task_info)).then(function (result) {
            console.log('发送更新消息',result);
        });

        // 修改任务的状态和结果信息
        var task = tasks[0];
        if (total_page==current_page && current_page>0){
            task.status = 2;  // 任务标记完成
        }
        task.total = total_page;
        task.current = current_page;
        task.update_time = task_info['update_time'];
        task.save();

        // 任务的结果
        var task_result_list = [];
        for (var i=0; i<result_list.length; i++){
            var result = result_list[i];
            var dic = {};
            dic['time'] = dateTime.toString();
            dic['task_sha1'] = task.sha1;
            dic['name'] = result['name'];
            dic['url'] = result['url'];
            dic['status'] = 0;  // 任务标记待处理
            task_result_list.push(dic);
        }
        // 存储结果
        Model.TaskResult.create(task_result_list,function(err,results){
            console.log(err);
            res.send({ info: 'OK'});
        });
    });
});

// 任务结果
router.get('/options/', function(req, res, next) {
    // 处理一下
    var query = req.query;
    var name = query['name'];

    // 实时消息更新
    client.submitJob('suggest', JSON.stringify({'query':name})).then(function (result) {
        console.log('发送更新消息',result);
        var result = JSON.parse(result);
        var options = result['options'];
        res.send({ info: 'OK','options':options});
    });
});

// 检索任务结果
router.get('/search/', function(req, res, next) {
    // 处理一下
    var query = req.query;
    var name = query['key'];

    // 实时消息更新
    client.submitJob('search', JSON.stringify({'query':name})).then(function (result) {
        console.log('搜索插叙结果',result);
        var result = JSON.parse(result);
        res.send({ info: 'OK','result':result});
    });
});




module.exports = router;
