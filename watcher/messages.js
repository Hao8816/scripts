var DB = require('./models.js');
var async = require('async');
var SHA1 = require('sha1');

// 处理客户端消息之后，消息通知客户端
var socket = require('socket.io-client')('http://127.0.0.1:3000');
socket.on('connect', function(){
    console.log("系统链接成功")
});
socket.on('disconnect', function(){});

/*
*  不同类型的消息路由功能
*
* */

var MESSAGES = {
    'LOGIN' : 'login',
    'LOGIN_RES' : 'login_response',
    'REGISTER' : 'register',
    'REGISTER_RES' : 'register_response',
    'CONTACT_LIST' : 'contact_list',
    'RECENTLY_LIST' : 'recently_list',
    'RECENTLY_LIST_RES' : 'recently_list_response',
    'CHAT_MESSAGE' : 'chat_message',
    'CONTACT_LIST_RES' : 'contact_list_response',
    'MESSAGE_LIST' : 'message_list',
    'MESSAGE_LIST_RES' : 'message_list_response',
    'ADD_CONTACT': 'add_contact',
    'ADD_CONTACT_RES': 'add_contact_response'

};

// 登录消息  LOGIN
// 登录响应  LOGIN_RES
MESSAGES['USER_LOGIN'] = function(sid, data, callback){
    // 查询用户信息是不是正确
    var username = data['username'];
    var password = data['password'];
    var result = {'sid':sid};
    DB.userModel.findOne({'username':username,'password':password}).exec(function(err,res){
        if (err){
            result['status'] = 'ERROR';
            result['info'] = err;
            socket.emit(MESSAGES.LOGIN_RES,result);
            callback(null);
            return;
        }
        // 处理用户信息
        console.log('登录用户的信息',res);
        if (res){
            result['status'] = 'OK';
            result['user'] = res;
            callback(res);
        }else{
            result['status'] = 'ERROR';
            result['info'] = '用户名或者密码错误';
            callback(null);
        }
        socket.emit(MESSAGES.LOGIN_RES,result);
    });
};

// 用户注册 USER_REGISTER
MESSAGES['USER_REGISTER'] = function(sid, data){
    // 查询用户信息是不是正确
    var email = data['email'];
    var username = data['nick'];
    var password = data['password'];
    var result = {'sid':sid};
    var uid = SHA1(username);
    var doc = {
        'uid':uid,
        'email' : email,
        'username' : username,
        'password' : password
    };

    // 检查用户名是否有重复，或者邮箱已经被注册
    DB.userModel.findOne({ $or: [ {'email': email}, { 'username': username } ] }).exec(function(err,res){
        if (err){
            result['status'] = 'ERROR';
            result['info'] = err;
            socket.emit(MESSAGES.REGISTER_RES,result);
            return;
        }
        if(res){
            result['status'] = 'ERROR';
            result['info'] = '邮箱或者用户名已经被占用';
            socket.emit(MESSAGES.REGISTER_RES,result);
        }else{
            // 创建用户信息
            DB.userModel.create(doc, function(err, user){
                if(err) {
                    result['status'] = 'ERROR';
                    result['info'] = err;
                    socket.emit(MESSAGES.REGISTER_RES,result);
                    return;
                }
                result['status'] = 'OK';
                result['user'] = user;
                socket.emit(MESSAGES.REGISTER_RES,result);
            });
        }
    });
};


// 获取好友列表  CONTACT_LIST
// 获取好友列表响应  CONTACT_LIST_RES
MESSAGES['GET_CONTACT_LIST'] = function(sid, data){
    var uid = data['uid'];
    var keyword = data['keyword'];
    console.log('当前用户的id是:',uid)
    async.waterfall([
        function(callback){
            DB.relationModel.find({ $or: [ {'uid_1': uid}, { 'uid_2': uid } ] }).exec(function(err,res){
                if (err){
                    console.log(err);
                    return
                }
                // 显示好友列表
                var uid_list = res;

                // 循环好友列表
                var uids = [];
                for(var i=0;i<uid_list.length;i++){
                    if (uid_list[i]['uid_1']==uid){
                        uids.push(uid_list[i]['uid_2']);
                    }else if(uid_list[i]['uid_2']==uid){
                        uids.push(uid_list[i]['uid_1']);
                    }else{
                        console.log('不符合条件数据')
                    }
                }
                console.log('好友数量',uids.length);
                callback(null, uids);
            });
        },
        function(uids, callback){
            // 检查keyword
            var filters = {$or:[{ uid: { $in: uids} }]};
            if (keyword){
                filters['$or'].push({'username': {'$regex': keyword}})
            }

            // 查询批量用户的详细信息
            DB.userModel.find(filters).exec(function(err,res){
                if (err){
                    console.log(err);
                    return
                }
                console.log('好友列表详情',res);
                var contacts = res;
                callback(null, contacts);
            });
        }
    ], function (err, result) {
        console.log('查询好友列表成功');
        socket.emit(MESSAGES.CONTACT_LIST_RES,{'status': 'OK','contacts':result,'uid': uid,'sid':sid});
    });
};



// 最近聊天   RECENTLY_LIST
// 最近聊天响应  RECENTLY_LIST_RES
MESSAGES['GET_RECENTLY_LIST'] = function(sid, data){
    var uid = data['uid'];
    async.waterfall([
        function(callback){
            DB.relationModel.find({ $or: [ {'uid_1': uid}, { 'uid_2': uid } ] }).exec(function(err,res){
                if (err){
                    console.log(err);
                    return
                }
                // 显示好友列表
                var uid_list = res;

                // 循环好友列表
                var uids = [];
                for(var i=0;i<uid_list.length;i++){
                    if (uid_list[i]['uid_1']==uid){
                        uids.push(uid_list[i]['uid_2']);
                    }else if(uid_list[i]['uid_2']==uid){
                        uids.push(uid_list[i]['uid_1']);
                    }else{
                        console.log('不符合条件数据')
                    }
                }
                console.log('好友数量',uids.length);
                callback(null, uids);
            });
        },
        function(uids, callback){
            // 去重处理

            // 查询批量用户的详细信息
            DB.userModel.find({ uid: { $in: uids} }).exec(function(err,res){
                if (err){
                    console.log(err);
                    return
                }
                console.log('好友列表详情');
                var contacts = res;
                callback(null, contacts);
            });
        }
    ], function (err, result) {
        console.log('查询好友列表成功');
        socket.emit(MESSAGES.RECENTLY_LIST_RES,{'status': 'OK','recent_list':result,'uid': uid,'sid':sid});
    });
};

MESSAGES['SAVE_CHAT_MESSAGE'] = function(data){
    DB.messageModel.create(data, function(error){
        if(error) {
            console.log(error);
        } else {
            console.log('save ok');
        }
    });
};

MESSAGES['GET_MESSAGE_LIST'] = function(data){
    var uid_1 = data['uid_1'];
    var uid_2 = data['uid_2'];
    DB.messageModel.find({ $or: [ {'from': uid_1, 'to': uid_2}, {'from': uid_2, 'to': uid_1 } ] }).exec(function(err,res){
        if (err){
            console.log(err);
            return
        }
        // 消息列表
        var message_list = res;
        socket.emit(MESSAGES.MESSAGE_LIST_RES,{'status': 'OK','message_list':message_list,'uid': uid_1});
    });

};

MESSAGES['USER_ADD_CONTACT'] = function(sid, data){
    var uid_1 = data['uid_1'];
    var uid_2 = data['uid_2'];
    // 比较uid_1和uid_2的大小，小的为1，大的为2
    var from,to;
    if (uid_1>uid_2){
        from = uid_1;
        to = uid_2
    }else{
        from = uid_1;
        to = uid_2
    }
    DB.relationModel.find({'uid_1': from, 'uid_2': to }).exec(function(err,res){
        if (err){
            console.log(err);
            return
        }
        DB.relationModel.create({'uid_1': from, 'uid_2': to }, function(error){
            if(error) {
                console.log(error);
            } else {
                console.log('save ok');
            }
        });
        //socket.emit(MESSAGES.ADD_CONTACT_RES,{'status': 'OK','message_list':message_list,'uid': uid_1});
    });

};


// 退出消息  LOGOUT

module.exports = MESSAGES;
