var _  = require("underscore");
var config = require("../config");
var that = {};


that.replaceCookieHost = function(pRes){
    var headers = pRes.headers;
    var cookieArr =    headers["set-cookie"];
    var reg = /domain=([^;]+)/i;
    var rootHost = config.accessHost;
    if(config.accessPort != 80){
        var b = 2;
        //rootHost = config.accessHost + ":" + config.accessPort;
    }
    _.each(cookieArr, function(v, i){
        v = v.replace(reg, function(a, b){
           return "Domain=" +  rootHost;
        });
        cookieArr[i] = v;
    });





};




module.exports = that;