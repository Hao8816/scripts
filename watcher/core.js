var server = require('http').createServer();
var io = require('socket.io')(server);
var SHA1 = require('sha1');
var SOCKETS = {};

io.on('connection', function(socket){
    console.log('客户端连接成功',socket.id);

    // 处理用户发送的消息，传递给好友
    socket.on('task_update', function(data){
        // 消息转发
        console.log(data);
        socket.broadcast.emit('task_update',data);
    });

    socket.on('disconnect', function(){});
});
server.listen(3000);