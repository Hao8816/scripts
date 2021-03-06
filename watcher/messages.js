var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8' });
// 处理客户端消息之后，消息通知客户端
var socket = require('socket.io-client')('http://127.0.0.1:3000');
socket.on('connect', function(){
    console.log("系统链接成功");
});
socket.on('disconnect', function(){});

function sendMessage(task){
    console.log('消息系统',task.payload);
    var data = JSON.parse(task.payload);
    socket.emit('task_update',data);
}
client.registerWorker("send_message", function(task) {
    task.end(sendMessage(task));
});