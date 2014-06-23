var express = require('express');
var urlUtil = require('url');
var qs = require("querystring");
var _ = require("underscore");

var request = require("request");
var config = require("../config");

var log = require('./logHelper').getLogger();

var that = {};




var  userList = {};

that.auth = function(req, res, next){
    var url = req.url;
    var loginPageName = config.loginPageName;
    var reg = /^\/(agent_login|userLogin)(\.html|\.aspx)?/i;
    if(loginPageName){
        loginPageName  = loginPageName.replace(".", "\\.");
        var pattern = "^/(agent_login(\\.html)?|" + loginPageName + ")";
        reg = new RegExp(pattern,"i");
    }

    var urlInfo = urlUtil.parse(url);
    var loginUrl = config.loginUrl;
    var verifyUrl = config.verifyUrl;
    log.debug("urlInfo is %s",urlInfo.pathname);
    var options;
    if(loginUrl && reg.test(urlInfo.pathname)){
        if(req.method == "POST"){
            var data = req.body;
            var dataStr =   qs.stringify(data);
            options =  {url:loginUrl,pool:false, headers:req.headers,encoding:null,followRedirect:false,body:dataStr,method:"POST"};
            request(options).pipe(res);
        }else{
            var toUrl = url.indexOf("?");
            toUrl = url.substr(toUrl+1);
            request(loginUrl + "?" + toUrl).pipe(res);
        }

    } else{
        var shouldVerify = true;
        var userName = req.cookies["SYKJ_User"];
        if(userName){
            var time = userList[userName];
            time = time || 0;
            var now = Date.now();
            var diff =  ((now - time ) /  1000);
            if(diff  < 600){
                shouldVerify = false;
            }
        }
        log.debug("shouldVerify is %s", shouldVerify);
        if(verifyUrl && shouldVerify){

            var  form = {};
            form.url = req.url;
            options = {url:verifyUrl,pool:false,headers:req.headers,followRedirect:false,qs:form,method:"GET"};
            log.debug("verify options is %s", options);
            request(options, function(err, vRes, body){
                log.debug("verify body is %s", body);
                if(body == "true"){
                    if(userName){
                        userList[userName] = Date.now();
                    }
                    next();
                }else{
                    res.redirect("/agent_login?" + url);
                }
            });
        }else{
            next();
        }

    }

}


that.getBaseAccessHostPort = function(){
    var accessHost = config.accessHost;
    var accessPort = config.accessPort;
    var proxyHost = config.proxyHost;
    if(accessPort == "80"){
        return accessHost;
    }else{
        return accessHost + ":" + accessPort;
    }
}


that.replaceFormValue  = function(req, res, next){
  var body = req.body;

    _.each(body, function(v, k){

    });





};

module.exports = that;