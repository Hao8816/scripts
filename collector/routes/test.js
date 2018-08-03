var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8'});
var SHA1 = require('sha1');
var moment = require('moment');
//
//// 实时消息更新
//var params = {
//    'docs':[],
//    'query': ''
//};
//client.submitJob('calc_similarity', JSON.stringify({})).then(function (result) {
//    console.log('发送更新消息',result);
//});


var Model = require('./models');

Model.TaskResult.find().run(function(err,results){
    // 循环结果，构造信息
    var docs = [];
    for(var i=0;i<results.length;i++){
        var result = results[i];
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
});


