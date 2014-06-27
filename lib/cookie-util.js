var _  = require("underscore");
var commonUtil = require("./common");
var config = require("../config");
var that = {};


that.replaceCookieHost = function(pRes, req){
    var headers = pRes.headers;
    var cookieArr =    headers["set-cookie"];
    var reg = /domain=([^;]+)/i;
    var rootHost = config.accessHost;
    if(config.accessPort != 80){
        var b = 2;
        //rootHost = config.accessHost + ":" + config.accessPort;
    }
    var targetHost = commonUtil.getTargetHost(req);
    var pathReg = /Path=([^;]+)/i;
    _.each(cookieArr, function(v, i){
        v = v.replace(reg, function(a, b){
           return "Domain=" +  rootHost;
        });
        v = v.replace(pathReg, function(a, b){
           return "path=/";
            //return "path=" +  "/" + targetHost + b;
        });
        cookieArr[i] = v;
    });







};




module.exports = that;