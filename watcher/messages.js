// 处理客户端消息之后，消息通知客户端
var socket = require('socket.io-client')('http://127.0.0.1:3000');
socket.on('connect', function(){
    console.log("系统链接成功");
    socket.emit('task_update',{'name':'大参林医药集团股份有限公司','total':'1112','current':'323'})
});
socket.on('disconnect', function(){});
