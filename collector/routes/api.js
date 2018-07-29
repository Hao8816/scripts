var express = require('express');
var router = express.Router();
var fs = require('fs');
var Model = require('./models');
var SHA1 = require('sha1');


// 任务分配的接口
router.get('/task/$', function(req, res, next) {
    // 处理一下
    var base_url = 'https://www.tianyancha.com/search?key=';

    Model.Task.find({'status':0}).limit(1).run(function(err,tasks){
        if(err || tasks.length == 0){
            console.log('初始化任务失败，暂无任务',err);
            return;
        }
        var task_name = tasks[0].name;
        var task_url = base_url+ encodeURIComponent(task_name);
        res.send({'url':task_url});
    });
});

// 结果详情的接口
router.post('/details/$', function(req, res, next) {
    // 处理一下
    console.log(req.body);
    res.send({'info':'OK'});
});

// 任务结果
router.post('/result/$', function(req, res, next) {
    // 处理一下
    var data = req.body;
    var task_info = data['task'];
    var result_list = data['result'];
    // 查询任务的信息
    Model.Task.find({'name':task_info['name']}).run(function(err,tasks){
        // 判断查询结果
        if (err || tasks.length==0){
            return;
        }
        console.log('任务查询结果',tasks);

        // 修改任务的状态和结果信息
        var task = tasks[0];
        task.status = 1;
        task.total = task_info['total'];
        task.current = task_info['current'];
        task.save();

        // 任务的结果
        var task_result_list = [];
        for (var i=0; i<result_list.length; i++){
            var result = result_list[i];
            var dateTime = new Date().getTime();
            var dic = {};
            dic['time'] = dateTime.toString();
            dic['task_sha1'] = task.sha1;
            dic['name'] = result['name'];
            dic['url'] = result['url'];
            dic['status'] = 0;
            task_result_list.push(dic);
        }
        // 存储结果
        Model.TaskResult.create(task_result_list,function(err,results){
            console.log(err);
            res.send({ info: 'OK'});
        });
    });

    ////现将json文件读出来
    //fs.readFile(json_fle_path, function(err,data){
    //    if(err){
    //        var item_hash = {};
    //    }else{
    //        var items = data.toString();
    //        item_hash = JSON.parse(items);
    //    }
    //    // 循环信息
    //    for (var i=0;i<company_list.length;i++){
    //        var name = company_list[i]['name'];
    //        var url = company_list[i]['url'];
    //        item_hash[name] = url;
    //    }
    //    var total_count = Object.keys(item_hash).length;
    //    console.log('一共存入条数为：',total_count);
    //    var str = JSON.stringify(item_hash);
    //    fs.writeFile(json_fle_path,str,function(err){
    //        if(err){
    //            console.error(err);
    //        }
    //        console.log('新增成功');
    //    })
    //});

    //console.log(req.body);
    //res.send({'info':'OK'})
});


module.exports = router;
