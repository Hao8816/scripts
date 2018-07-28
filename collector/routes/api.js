var express = require('express');
var router = express.Router();
var fs = require('fs');

// 任务分配的接口
router.get('/task/$', function(req, res, next) {
    // 处理一下
    console.log(req.body);
    res.send({'info':'OK','task':'xxxx'});
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


    // 存储任务的结果



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

    console.log(req.body);
    res.send({'info':'OK'})
});


module.exports = router;
