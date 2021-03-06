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


// 任务表
var Task = db.define("task",{
    time          : String,    // 任务创建的时间
    sha1          : String,    // task的sha1
    name          : String,    // 文件名称
    total         : Number,    // 共多少条页记录
    current       : Number,    // 当前执行到多少个条记录
    status        : Number,    // [0 未启动， 1 已启动， 2 爬取完毕]
    update_time   : String,    // 最后更新时间
    file_sha1     : String,    // 所属文件的sha1
    priority      : Number     // 设置任务的优先级[9~0]

},{
    // with in model method
});


// 任务执行的结果
var TaskResult = db.define("task_result",{
    time          : String,    // 任务创建的时间
    task_sha1     : String,    // task的sha1
    name          : String,    // 文件名称
    url           : String,    // 任务下的url
    info          : Object,    // 存储字段
    status        : Number,    // 爬取状态
    update_time   : String     // 最后更新时间
},{
    // with in model method
});

db.sync();

models['File'] = File;
models['Task'] = Task;
models['TaskResult'] = TaskResult;
module.exports = models;
