/*定义数据操作的模型*/
// mongoose 链接
var mongoose = require('mongoose');
var db       = mongoose.createConnection('mongodb://127.0.0.1:27017/chat');

var Models = {};

// 链接错误
db.on('error', function(error) {
    console.log(error);
});

// 用户表 Schema 结构
var User = new mongoose.Schema({
    uid        : {type : String},                        // 用户的sha1
    username   : {type : String},   // 用户名
    password   : {type : String},                        // 用户的密码
    email      : {type : String},                        // 用户的油箱地址
    sex        : {type : String},                        // 用户的性别
    time       : {type : Date, default: Date.now},       // 用户注册的时间
    birthday   : {type : Number},                        // 用户的生日
    status     : {type : Number, default:0},             // 0 是非激活状态  1 是正常状态
    location   : {type : String},                        // 用户的位置信息
    avatar     : {type : String},                        // 用户头像的sha1信息
    note       : {type : String}                         // 用户个人签名
});
User.statics.getUser = function(uid, callback) {
    return this.model('user').find({uid: uid}, callback);
};


// 联系人关系表 Schema 结构
var Relation = new mongoose.Schema({
    uid_1      : {type : String},                        // 用户的uid 排序
    uid_2      : {type : String},                        // 用户的uid 排序
    time       : {type : Date, default: Date.now},       // 关系建立的时间
    status     : {type : Number, default:0}              // 0 是非激活状态  1 是正常状态
});

// 聊天消息的存储 Schema 结构
var Message = new mongoose.Schema({
    from       : {type : String},                        // 消息来源
    to         : {type : String},                        // 消息目的
    content    : {type : String},                        // 消息的内容 排序
    time       : {type : Date, default: Date.now},       // 消息存储的时间
    status     : {type : Number, default:0}              // 0 是未读  1 是已读
});

// 导出models
var userModel = db.model('user', User);
var relationModel = db.model('relation', Relation);
var messageModel = db.model('message', Message);


Models["userModel"] = userModel;
Models["relationModel"] = relationModel;
Models["messageModel"] = messageModel;

module.exports = Models;