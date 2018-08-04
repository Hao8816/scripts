// 文件上传的情况
var app = angular.module('collector',['ngFileUpload','angucomplete']).run(function(){

});

var FIELD_HASH = {
    'company_name':'公司全称',
    'company_phone':'公司电话',
    'company_email':'公司邮箱',
    'company_website':'公司网站',
    'company_status':'经营状态',
    'company_capital':'注册资本',
    'company_size':'人员规模',
    'company_time':'注册时间',
    'company_address':'公司地址',
    'company_id':'工商注册号',
    'organization_id':'组织机构代码',
    'tax_id':'纳税人识别号',
    'credit_id':'统一信用代码',
    'government_name':'登记机关',
    'company_type':'公司类型',
    'bussiness_scope':'经营范围'
};

var API_URL = 'http://127.0.0.1:8000';
// 文件上传
app.controller('uploadPageCtrl', function uploadPageCtrl($rootScope, $scope, $http,  Upload, Pager, $window){
    $rootScope.page_nav = 'upload';
    // 网页查询参数
    var query_params = $window.location.search;

    $scope.getParam = function (name) {
        var re = new RegExp("[&,?]" + name + "=([^//&]*)", "i");
        var a = re.exec(query_params);
        if (a == null)
            return "";
        return unescape(a[1]);
    };

    // 参数解析
    var page = $scope.getParam('page') || 1;
    var size = $scope.getParam('size') || 10;

    // 文件上传部分逻辑
    $scope.upload = function (file) {
        // 测试假数据
        Upload.upload({
            url: API_URL+'/files/upload/',
            data: {file: file},
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(function (resp) {
            // 刷新当前记录的显示
            console.log(resp);
            $scope.getFileList(1);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };
    // 多文件上传
    $scope.uploadFiles = function (files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                $scope.upload(files[i]);
            }
        }
    };

    // 获取文件列表
    var url = API_URL+'/files/list/?page='+page+'&'+'size='+size;
    $http.get(url).then(function(res){
        var data = res['data']
        var result = data['result'];
        var files = result['files'];
        var total = result['total'];
        console.log('文件列表结果',files);

        $scope.details = {'page': page,'size':10};

        // 构造翻页信息
        Pager.pages(page,result['max_page'],function(pages){
            $scope.pages = pages;
        });

        $scope.total = total;
        $scope.files = files;
    });
});

app.controller('detailsPageCtrl', function detailsPageCtrl($rootScope, $scope, $http, $window, Pager, socket, $timeout){
    $rootScope.page_nav = 'upload';
    var task_hash = {};
    // 接受socket的更新消息
    socket.on('task_update',function(res){
       console.log(res);
        var task_name = res['name'];
        $scope.notification = res;
        if (task_hash.hasOwnProperty(task_name)){
            var task_index = task_hash[task_name];
            var column = $scope.columns[task_index];
            column['总页数'] = res['total'];
            column['已完成'] = res['current'];
            column['最后更新时间'] = res['update_time'];
            $scope.columns[task_index] = column;
        }
    });

    // 网页查询参数
    var query_params = $window.location.search;

    $scope.getParam = function (name) {
        var re = new RegExp("[&,?]" + name + "=([^//&]*)", "i");
        var a = re.exec(query_params);
        if (a == null)
            return "";
        return unescape(a[1]);
    };

    // 参数解析
    var key = $scope.getParam('key');
    var page = $scope.getParam('page') || 1;
    var size = $scope.getParam('size') || 10;
    $scope.details = {'key': key, 'page': page,'size': size};

    // 获取文件列表
    var url = API_URL+'/files/details/?key='+key+'&page='+page+'&size='+size;
    $http.get(url).then(function(res){
        var data = res['data'];
        $scope.result = data['result'];

        var columns = $scope.result.columns;

        columns.forEach(function(item,index){
            task_hash[item['任务名称']] = index;
        });
        $scope.columns = columns;

        // 构造翻页信息
        Pager.pages(page,data['result']['max_page'],function(pages){
            $scope.pages = pages;
        });

        console.log('文件列表结果',data);
    });

    // 选择名称所在的列
    $scope.checkFile = function(){
        var column = $scope.column_name;
        var params = {
            'column_name': column,
            'file_sha1': key
        };
        var url = API_URL+'/files/check/';
        $http.post(url,params).then(function(res){
            var data = res['data'];
            console.log(data);
            location.href = '/details/?key='+key+'&page='+page+'&size='+size;
        });
    }
});


app.controller('taskPageCtrl', function detailsPageCtrl($rootScope, $scope, $http, $window, Pager, socket, $timeout){
    $rootScope.page_nav = 'upload';
    // 网页查询参数
    var query_params = $window.location.search;
    $scope.getParam = function (name) {
        var re = new RegExp("[&,?]" + name + "=([^//&]*)", "i");
        var a = re.exec(query_params);
        if (a == null)
            return "";
        return unescape(a[1]);
    };

    $scope.FIELD_HASH = FIELD_HASH;

    // 参数解析
    var key = $scope.getParam('key');
    var page = $scope.getParam('page') || 1;
    var size = $scope.getParam('size') || 10;
    var bpage =  $scope.getParam('bpage') || 1;
    $scope.details = {'key': key, 'page': page,'size': size,'bpage': bpage};

    // 获取文件列表
    var url = API_URL+'/files/task/details/?key='+key+'&page='+page+'&size='+size;
    $http.get(url).then(function(res){
        var data = res['data'];
        $scope.result = data['result'];
        var columns = $scope.result.columns;
        $scope.columns = columns;

        // 构造翻页信息
        Pager.pages(page,data['result']['max_page'],function(pages){
            $scope.pages = pages;
        });

        console.log('文件列表结果',data);
    });
});

app.controller('queryPageCtrl', function queryPageCtrl($rootScope, $scope, $http, $window, Pager, socket, $timeout){
    $rootScope.page_nav = 'query';
    $scope.FIELD_HASH = FIELD_HASH;
    // 搜索结果
    $scope.searchTask = function(){
        var page = 1;
        var keyword = $('#search').find('input').val();
        console.log(keyword);
        // 获取文件列表
        var url = API_URL+'/monkey/search/?key='+keyword+'&page='+page+'&size=10';
        $http.get(url).then(function(res){
            var data = res['data'];
            $scope.result = data['result'];
            var columns = $scope.result.options;
            $scope.columns = columns;

            // 构造翻页信息
            Pager.pages(page,data['result']['max_page'],function(pages){
                $scope.pages = pages;
            });

            console.log('文件列表结果',data);
        });
    };


});

app.service( 'Pager', [function() {
    var service = {
        pages: function (page,max_page,callback) {
            // 渲染页码
            var pages = [];
            // 分页的原则是保留前两页后两页，中间个显示前三页和后三页
            for(var i=1;i<=max_page;i++){
                if (i<=2 || i>max_page-2){
                    pages.push(i);
                }else if (i<=page+3 && i>=page-3){
                    pages.push(i);
                }
            }

            // 检查当前页码的完整性
            var insert_min = -1;
            var insert_max = -1;
            for (var j=0;j<pages.length;j++){
                if (pages[j+1]-pages[j]>1){
                    console.log('需要添加位置',j);
                    if (insert_min>=0){
                        insert_max = j+1
                    }else{
                        insert_min = j+1
                    }
                }
            }
            if (insert_max>0){
                pages.splice(insert_max,0,"...")
            }
            if (insert_min>0){
                pages.splice(insert_min,0,"..")
            }
            callback(pages);
        }
    };
    return service;
}]);


app.factory('socket', function ($rootScope) {
    //var socket = io('http://www.tihub.cn:3000');
    var socket = io('http://127.0.0.1:3000');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});


