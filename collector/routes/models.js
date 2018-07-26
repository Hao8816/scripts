var orm = require("orm");
var settings = require('../config/db-config');
var db = orm.connect(settings.mysql,function(err,db){
    if (err){
        console.log(err)
        console.log('Can not connect to mysql!');
    }else{
        console.log("Connect sucessfully!");
    }
});

var models = {};

// 文件信息表
var File = db.define("file",{
    time          : String,    // 微博创建的时间
    sha1          : String,    // blog的sha1
    name          : String,    // 文件名称
    size          : String,    // 文件的大小
    type          : String,    // 文件类型
    path          : String,    // 文件的存储路径
    creator_sha1  : String,    // 创建者信息
    content       : Buffer     // 文件内容
},{
    // with in model method
});

db.sync();

models['File'] = File;
module.exports = models;
