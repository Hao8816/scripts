// ==UserScript==
// @name         [外网版]［天眼查］ 获取公司详情 2018-07-09
// @namespace    https://github.com/Hao8816/scripts/
// @version      0.8
// @description  [外网版]［天眼查］ 获取公司详情
// @author       Vaster
// @match        https://www.tianyancha.com/company/*
// @require      http://cdn.bootcss.com/jquery/1.11.2/jquery.js
// @grant        GM_xmlhttpRequest
// @updateURL    https://greasyfork.org/scripts/370150-tyc-details/code/tyc-details.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 小王小王你真棒哈哈哈哈哈

    String.prototype.startWith=function(str){
        if(str==null||str==""||this.length==0||str.length>this.length){
            return false;
        }
    	if(this.substr(0,str.length)==str){
            return true;
        }else{
            return false;
        }
    	return true;
    }


    var monkey_url = 'http://113.57.174.82:10080/flow/api/v1/monkey/';
    
    // 获取公司名称
    var company_name = $('.company-header-block').find('.name').text();
    
    // 循环公司的
    
    var lines = $('#_container_baseInfo>table').find('tr').find('td');
    var company_infos = $('.company_header_interior').find('div>div');
    
    var company_address = '';
    var company_status = '';
    var company_id = '';
    var organization_id = '';
    var tax_id = '';
    var credit_id = '';
    var government_name = '';
    var company_type = '';
    var company_phone = '';
    var company_email = '';
    var company_website = '';
    var bussiness_scope = '';
    
    // 解析公司的基本信息
    for(var j=0;j<company_infos.length;j++){
        var info = $(company_infos[j]).text();
        if (info.startWith('电话：')){
        	company_phone = info.split('编辑')[0].replace('电话：','');
            company_phone = company_phone.replace('添加','');
        }
        
        if (info.startWith('邮箱：')){
        	company_email = info.split('编辑')[0].replace('邮箱：','');
            company_email = company_email.replace('添加','');
        }
        
        if (info.startWith('网址：')){
        	company_website = info.split('编辑')[0].replace('网址：','');
            company_website = company_website.replace('添加','');
        }
    }
    
    
    // 解析公司的详细信息
    for(var i=0; i<lines.length; i++){
        var text = $(lines[i]).text();
        
        // 抽取公司或者机构的地址信息
        if (text.indexOf('附近公司')>=0){
        	company_address = text.replace('附近公司','');
        }else if (text.indexOf('住所')>=0){
        	company_address = $(lines[i+1]).text();
        }
            
        // 抽取公司经营状态
        if (text.indexOf('公司状态')>0){
            company_status = text.split('公司状态')[1];
        }
        
        // 抽取工商注册号
        if (text.indexOf('工商注册号')>=0){
        	company_id = $(lines[i+1]).text();
        }
        
        // 抽取组织机构代码
        if (text.indexOf('组织机构代码')>=0){
        	organization_id = $(lines[i+1]).text();
        }
        
        // 抽取统一信用代码
        if (text.indexOf('统一信用代码')>=0){
        	credit_id = $(lines[i+1]).text();
        }
        
        // 抽取纳税人识别号
        if (text.indexOf('纳税人识别号')>=0){
        	tax_id = $(lines[i+1]).text();
        }
        
        // 抽取登证机关
        if (text.startWith('登记机关')){
        	government_name = $(lines[i+1]).text();
        }
        
        // 抽取公司类型
        if (text.startWith('公司类型')){
        	company_type = $(lines[i+1]).text();
        }
        
        // 抽取经营范围
        if (text.startWith('经营范围')){
        	bussiness_scope = $(lines[i+1]).text();
        }
              
    }
    
    console.log('电话:',company_phone);
    console.log('邮箱:',company_email);
    console.log('网址:',company_website);
    console.log('公司状态:',company_status);
    console.log('公司地址:',company_address);
    console.log('工商注册号:',company_id);
    console.log('组织机构代码:',organization_id);
    console.log('纳税人识别号:',tax_id);
    console.log('统一信用代码:',credit_id);
    console.log('登记机关:',government_name);
    console.log('公司类型:',company_type);
    console.log('经营范围:',bussiness_scope);
    
    // 滴滴答答滴滴答答滴滴答答的傻逼
   
    GM_xmlhttpRequest({
      method: "POST",
      url: monkey_url,
      data : JSON.stringify({'name':company_name,'address':company_address}),
      onload: function(response) {
         //这里写处理函数
         console.log(response);
         window.close();
      }
    });
})();
