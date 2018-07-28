// ==UserScript==
// @name         爬虫启动
// @namespace    http://tampermonkey.net/
// @version      0.1.4
// @description  获取任务脚本
// @author       Vaster
// @match        http*://*/*
// @exclude      https://www.tianyancha.com/company/*
// @exclude      https://www.tianyancha.com/search*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370687-%E7%88%AC%E8%99%AB%E5%90%AF%E5%8A%A8/code/%E7%88%AC%E8%99%AB%E5%90%AF%E5%8A%A8.user.js
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
        responseType: 'json',
        onload: function(res) {
            // 解析返回信息
            console.log(res);
            var task = eval(res.response);
            var task_url = task['url'];
            window.open(task_url);
        }
    });
})();
