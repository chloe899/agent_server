var express = require('express');
var urlUtil = require('url');
var qs = require("querystring");
var net = require("net");

var request = require("request");


var proxyUtil = require("./lib/proxy");
var commonUtil = require("./lib/common");


var config = require("./config");

var log = require('./lib/logHelper').getLogger();


process.on("uncaughtException", function(err){
    if(err){
        log.error(err.stack || err);
    }

});




var server = express();
/*server.use(function(req, res,next){
   test(req);

});*/


server.use(commonUtil.bodyParser());
server.use(express.cookieParser());
server.use(express.logger("dev"));
server.use("/agent_static_file/", express.static(__dirname + '/static'));
server.disable("x-powered-by");

/*
server.use(function(req, res, next){
    if(req.url.indexOf("aa.html") != -1){
        res.send("123123");
        return;
    }
    res.set({Location:"aa.html"});
    res.send(302);
});
*/

function getHostFromReferer(req){
    var referer = req.headers["is_referer"] || req.headers["referer"];
    var host = "";
    if(referer){
        var urlInfo = urlUtil.parse(referer);
        var path = urlInfo.pathname;
        var reg = /^\/([^/]+)/;
        if(reg.test(path)){
            host = reg.exec(path)[1];
        }

    }
    return host;
}






server.use(function(req, res, next){
    var url = req.url;

    var reg = /favicon\.ico$/;
    if(reg.test(url)){
        res.sendfile("images/favicon.ico");
    } else{
        next();
    }
});
server.use(function(req, res, next){
    var url = req.url;

    var reg = /^\/js\/agent_common_client\.js$/;
    if(reg.test(url)){
        res.sendfile("js/agent_common_client.js");
    } else{
        next();
    }
});





server.use(commonUtil.auth);

server.use(function(req, res ,next){
    var url = req.url;
    if(config.model == "single"){
        var host = commonUtil.getTargetHost(req);
        log.debug(host);
        if(!host){
            var urlInfo = urlUtil.parse(url);
            log.debug(urlInfo);
            host = getHostFromReferer(req) || config.proxyHost;
            var newUrl = "/" + host + urlInfo.href;
            if(req.method == "POST"){
                req.url = newUrl;
                next();
            }else{
                res.set({"Location": newUrl});
                res.send(302);
            }


        }else{
            next();
        }

    }else{
        next();
    }

});

server.use(proxyUtil.handler);
var listenPort = config.accessPort;


log.debug("started listen port %s",listenPort);
server.listen(listenPort);