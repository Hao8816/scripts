// ==UserScript==
// @name         爬虫启动
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  获取任务脚本
// @author       Vaster
// @match        http*://*/*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370591-tyc-list/code/tyc-list.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 请求任务的url
    var task_url = 'http://127.0.0.1:8000/monkey/task/';
    // 发送请求
    GM_xmlhttpRequest({
        method: "GET",
        url: task_url,
        headers: {'Content-Type': 'application/json'},
        onload: function(response) {
            // 解析返回信息
            console.log(response)
        }
    });
})();
