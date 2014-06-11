var express = require('express');
var urlUtil = require('url');
var qs = require("querystring");

var request = require("request");


var proxyUtil = require("./lib/proxy");


var config = require("./config");
var log = require('./lib/logHelper').getLogger();


var server = express();

server.use(express.bodyParser());
server.disable("x-powered-by");

function getHostFromReferer(req){
    var referer = req.headers["referer"];
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
    var reg = /(login|userLogin)(\.html|\.aspx)?$/i;
    var urlInfo = urlUtil.parse(url);
    var loginUrl = config.loginUrl;
    var verifyUrl = config.verifyUrl;
    if(loginUrl && reg.test(urlInfo.pathname)){
        if(req.method == "POST"){
            var data = req.body;
            var dataStr =   qs.stringify(data);
            var options = {url:loginUrl,headers:req.headers,encoding:null,followRedirect:false,body:dataStr,method:"POST"};
            request(options).pipe(res);
        }else{
            request(loginUrl).pipe(res);
        }

    } else{
        if(verifyUrl){
            request(verifyUrl, function(err, vRes, body){
                if(body == "true"){
                    next();
                }else{
                    res.redirect("/login?" + url);
                }
            });
        }else{
            next();
        }

    }

});

server.use(function(req, res ,next){
    var url = req.url;
    if(config.model == "single"){
        var host = proxyUtil.getTargetHost(req);

        if(!host){
            var urlInfo = urlUtil.parse(url);
            log.debug(urlInfo);
            var host = getHostFromReferer(req) || config.proxyHost;
            var newUrl = "/" + host + urlInfo.href;
            res.set({"Location": newUrl});
            res.send(302);

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