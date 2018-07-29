// ==UserScript==
// @name         任务结果列表
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  [外网版]［天眼查］ 公司列表
// @author       Vaster
// @match        https://www.tianyancha.com/search*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370688-%E4%BB%BB%E5%8A%A1%E7%BB%93%E6%9E%9C%E5%88%97%E8%A1%A8/code/%E4%BB%BB%E5%8A%A1%E7%BB%93%E6%9E%9C%E5%88%97%E8%A1%A8.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 解析当前的页码数
    var current_url = window.location.pathname;
    var location_search = window.location.search;
    var current_page_array = current_url.split('/search/p');
    var current_page_num = 1;
    if (current_page_array.length>1){
        current_page_num = parseInt(current_page_array[1]);
    }

    function getParam (name) {
        var re = new RegExp("[&,?]" + name + "=([^//&]*)", "i");
        var a = re.exec(location_search);
        if (a == null)
            return "";
        return unescape(a[1]);
    }
    
    function getCompanyList(){
        // 解析网页内容
        var doc = document.getElementsByTagName('html')[0].innerHTML;
        var DOM = $(doc);

        // 获取列表
        var company_list = DOM.find('.result-list').find('.search-result-single');
        console.log(company_list);
        var link_list = [];
        for(var i=0;i<company_list.length;i++){
            var company_link = $(company_list[i]).find('.name').attr('href');
            var company_name_dom = '<div>'+$(company_list[i]).find('.left-item .expand-img').attr('alt')+'</div>';
            var company_name = $(company_name_dom).text();
            link_list.push({'name':company_name,'url':company_link});
        }
        return link_list;
    }
    
    // 解析公司信息 
    var info_list = getCompanyList();
    console.log(info_list);
    
    var monkey_url = 'http://127.0.0.1:8000/monkey/result/';

    var max_page_size = 1;
    var pager_items = $('.result-footer .pagination li').find('.num');
    var page_num_list = [];
    for(var i=0;i<pager_items.length;i++){
        // 判断每个按钮上的东西
        var page_num_text = $(pager_items[i]).text();
        page_num_list = page_num_list.concat(page_num_text.split('...'));
    }
    
    // 去掉非数字的部分
    page_num_list.forEach(function(item){
        var num = parseInt(item);
        if (num && num>max_page_size){
            max_page_size = num;
        }
    });
    console.log(max_page_size);
   
    // 自动翻页并解析当前的页面
    var next_page_num = current_page_num+1;
    var task_info = {'name':decodeURIComponent(escape(getParam('key'))),'total': max_page_size,'current': current_page_num}
    var next_page_url = 'https://www.tianyancha.com/search/p'+next_page_num+location_search;
    console.log('下一个页面的url是',next_page_url);
     
    // 发送请求
    GM_xmlhttpRequest({
      method: "POST",
      url: monkey_url,
      headers: {'Content-Type': 'application/json'},
      data : JSON.stringify({'task': task_info,'result':info_list}),
      onload: function(response) {
         //这里写处理函数
         console.log(response);
          if (next_page_num>max_page_size){
              console.log('数据爬取完毕');
              // 自动启动下一个任务
              if(max_page_size >1){
                  window.location.href = 'https://www.baidu.com';
              }else{
                  console.log('可能出现异常，需要确认处理');
              }
          }else{
              setTimeout(function () {
                  window.location.href = next_page_url;
              },3000);
          }
      }
    });
})();
