var settings = {}
var mysql_settings = {
    //host     : "onekoko.com",
    host     : "127.0.0.1",
    database : "collector",
    user     : "chenhao",
    password : "chenhao",
    //user     : "tao",
    //password : "pku123",
    protocol : "mysql",
    //socketPath: '/var/run/mysqld/mysqld.sock',
    //port     : "3305"
    port     : "3306"
};

var redis_settings = {

};



// 添加到settings的里面
settings['mysql'] = mysql_settings;
settings['redis'] = redis_settings;

module.exports = settings;
