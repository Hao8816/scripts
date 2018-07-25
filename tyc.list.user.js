// ==UserScript==
// @name         tyc-list
// @namespace    http://tampermonkey.net/
// @version      0.2.3
// @description  [外网版]［天眼查］ 公司列表
// @author       Vaster
// @match        https://www.tianyancha.com/search*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370591-tyc-list/code/tyc-list.user.js
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
    
    function getCompanyList(){
        // 获取列表
        var company_list = $('.result-list').find('.search_result_single');
        console.log(company_list);
        var link_list = [];
        for(var i=0;i<company_list.length;i++){
            var company_link = $(company_list[i]).find('.query_name').attr('href');
            var company_name = $(company_list[i]).find('.name').text();
            link_list.push({'name':company_name,'url':company_link});
        }
        return link_list;
    }; 
    
    // 解析公司信息 
    var info_list = getCompanyList();
    console.log(info_list);
    
    var monkey_url = 'http://127.0.0.1:8000/flow/api/v1/monkey/list/';

    var max_page_size = 1;
    var pager_items = $('.result-footer .pagination li').find('.num');
    var page_num_list = [];
    for(var i=0;i<pager_items.length;i++){
        // 判断每个按钮上的东西
        var page_num_text = $(pager_items[i]).text();
        page_num_list = page_num_list.concat(page_num_text.split('...'));
    };
    
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
    if (next_page_num>max_page_size){
        console.log('数据爬取完毕');
        return;
    }
    var next_page_url = 'https://www.tianyancha.com/search/p'+next_page_num+location_search
    console.log('下一个页面的url是',next_page_url);
     
    // 发送请求
    GM_xmlhttpRequest({
      method: "POST",
      url: monkey_url,
      data : JSON.stringify({'company_list':info_list}),
      onload: function(response) {
         //这里写处理函数
         console.log(response);
         //window.close();
      }
    });
})();
