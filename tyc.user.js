// ==UserScript==
// @name         tyc-list
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  [外网版]［天眼查］ 公司列表
// @author       Vaster
// @match        https://www.tianyancha.com/company/*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370150-tyc-details/code/tyc-details.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    var url_list = [];
    function getCompanyList(){
        
        // 获取列表
        var company_list = $('.search_result_container').find('.search_result_single');
        console.log(company_list);
        var link_list = [];
        for(var i=0;i<company_list.length;i++){
            var company_link = $(company_list[i]).find('.query_name').attr('href');
            link_list.push(company_link);
        }
        console.log(link_list);
        //return link_list;
        return [link_list[0]];
    } 
    
    
    url_list = getCompanyList();
    var max_count = parseInt($('.new-err.f14.in-block.vertival-middle.pt15.pb15').text() || 1) ;

    
    // 定时打开
    var total_count = 0;
    window.setInterval(function(){
        var url = url_list.pop();
        if (url){
            total_count = total_count + 1;
            window.open(url);
        }
        
        // 如果当前爬取过了，并且url列表为空，关闭当前页面
        if (max_count==total_count && url_list.length == 0){
             window.close();
        }
       
    },500);
    
})();
