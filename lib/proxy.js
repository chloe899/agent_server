var qs = require("querystring");
var urlUtil = require('url');

var _ = require("underscore");
var log = require('./lib/logHelper').getLogger();


var that = {};
var config = require("../config");


that.getTargetHost =   function(req){
    var accessHost = config.accessHost;
    var proxyHost = config.proxyHost;

    var reqHost = req.host;
    var pattern = accessHost.replace(/\./g, "\\.");
    pattern = pattern + "$";
    var proxyRootReg =  new RegExp(pattern);
    var host = config.proxyHost;
    if(config.model == "multi"){
        if(proxyRootReg.test(reqHost)){
            var sub = reqHost.replace(proxyRootReg,"");
            host = sub + proxyHost;
        }
    }else{
        var requestUrl  =  req.url;
        var urlInfo = urlUtil.parse(requestUrl);
        var pathName = urlInfo.pathname;
        var hostReg = /\/([^\/]+)/;
        var hostResult = hostReg.exec(pathName);
        host = hostResult && hostResult[1];
    }

    host = "http://" + host;
    return host;

};

function getBaseAccessHostPort(){
    var accessHost = config.accessHost;
    var accessPort = config.accessPort;
    var proxyHost = config.proxyHost;
    if(accessPort == "80"){
        return accessHost;
    }else{
        return accessHost + ":" + accessPort;
    }
}


that.replaceAccessHost = function(originValue){
    var proxyHost = config.proxyHost;
    if(!originValue){
        return originValue;
    }
    var pattern = getBaseAccessHostPort();
    var pattern1 = encodeURIComponent(pattern).replace(".", "\\.");
    pattern = pattern.replace(".", "\\.");
    var reg = new RegExp(pattern, "ig");
    var reg1 = new RegExp(pattern1, "ig");
    originValue = originValue.replace(reg, proxyHost);
    originValue = originValue.replace(reg1, encodeURIComponent(proxyHost));
    return originValue;
};

that.replaceAccessHeaderHost = function(headers){

    var replaceArr = ["host", "cookie", "referer", "origin"];
    _.each(replaceArr, function(k){
        var value = headers[k];
        if(value){
            headers[k] = that.replaceAccessHost(value);
        }
    });
    return headers;
};


that.getProxyUrl = function(req){
    var baseURI = that.getTargetHost(req);
    var requestUrl  =  req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    var url = "";
    if(config.model == "multi"){
        url = baseURI + urlInfo.href;
    }else{
        var pathName = urlInfo.pathname;
        var hostReg = /\/([^\/]+)/;
        var href = urlInfo.href.replace(hostReg, "");
        url = baseURI + href;
    }
};


that.setRequestHeader = function(){



};


that.getRequestGet = function(externalUrl,headers,cb){
    var reg = /http(s)?:\/\/[^\/]+/;
    var baseUrl = reg.exec(externalUrl)[0];
    var options =  {url:externalUrl,encoding:null,followRedirect:false,headers:headers};
    request(options,function(err,res,body){
        cb(err,res,body);
    });
};

that.preparePostData = function(req){
    var data = req.body;
    var contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";
    var dataStr = "";
    if(contentType == "application/x-www-form-urlencoded"){
        dataStr =   qs.stringify(data);
    }
    return dataStr;
};

function getRequestPost(externalUrl, headers, dataStr, cb){

    var options = {url:externalUrl,headers:headers,encoding:null,followRedirect:false,body:dataStr,method:"POST"};
    request(options, function(err, res, body){
        cb(err, res, body);
    });

}





that.handler = function(req, res, next){







};