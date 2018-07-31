var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8'});

// 实时消息更新
var params = {
    'docs':[],
    'query': ''
};
client.submitJob('calc_similarity', JSON.stringify({})).then(function (result) {
    console.log('发送更新消息',result);
});

