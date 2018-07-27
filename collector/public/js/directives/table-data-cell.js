/*
* 使用示例
* <table-data-cell-item name="column[header.key]" type="location"></table-data-cell-item>
* */

// 省市区县三级选择的控件
app.directive('tableDataCellItem', ['$filter',function($filter){
    return {
        restrict: 'E',
        template: '<div class="table-data-cell-item"><span>{{label}}</span></div>',
        scope : {
            name : '=',
            header : '@'
        },
        replace: true,
        transclude: false,
        link: function(scope, elem, attrs, controllerInstance) {
            // header 表头文本
            var data_type = scope.header;
            scope.$watch('name',function(newValue, oldValue){
                if (data_type.indexOf('时间')>=0){
                    scope.label = $filter('date')(scope.name,'yyyy-MM-dd HH:mm:ss');
                }else{
                    scope.label = scope.name;
                }
            });
        }
    };
}]);