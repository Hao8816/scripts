var Gearman = require('abraxas');
var client = Gearman.Client.connect({ servers: ['127.0.0.1:4730'], defaultEncoding:'utf8', timeout: 120 });

// or promises
var data = {
    'path': '/Users/chenhao/Devlop/scripts/collector/data/test.xls',
    'page': 1,
    'size': 10
};
client.submitJob('read_file', JSON.stringify(data)).then(function (result) {
    var data = JSON.parse(result);
    var headers = data['headers'];
    var columns = data['columns'];
    for(var i=0;i<headers.length;i++){
        console.log(headers[i]);
    }
    for(var j=0;j<columns.length;j++){
        for(var key in columns[j]){
            console.log(key,columns[j][key])
        }
    }
});
