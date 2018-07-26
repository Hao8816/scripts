// 文件上传的情况
var app = angular.module('collector',['ngFileUpload']).run(function(){

});

var API_URL = 'http://127.0.0.1:8000';
// 文件上传
app.controller('uploadPageCtrl', function uploadPageCtrl($scope, $http,  Upload){

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
    $scope.getFileList = function(page){
        var url = API_URL+'/files/list/?page='+page+'&'+'size='+10;
        $http.get(url).then(function(res){
            var data = res['data']
            var files = data['files'];
            console.log('文件列表结果',files);

            $scope.files = files;
        })
    };

    // 默认获取
    $scope.getFileList(1);
});

app.controller('detailsPageCtrl', function uploadPageCtrl($scope, Upload){

    alert('我进来了')
});


