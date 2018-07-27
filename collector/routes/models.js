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
    status        : Number,     // 文件处理状态
    total         : Number      // 文件中记录的总条数

},{
    // with in model method
});


// 文件信息表
var Task = db.define("task",{
    time          : String,    // 任务创建的时间
    sha1          : String,    // task的sha1
    name          : String,    // 文件名称
    total         : Number,    // 共多少条页记录
    current       : Number,    // 当前执行到多少个条记录
    status        : Number,    // 爬取状态
    update_time   : String,    // 最后更新时间
    file_sha1     : String     // 所属文件的sha1
},{
    // with in model method
});


db.sync();

models['File'] = File;
models['Task'] = Task;
module.exports = models;
