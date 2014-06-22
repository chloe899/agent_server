var express = require('express');
var urlUtil = require('url');
var qs = require("querystring");

var request = require("request");


var proxyUtil = require("./lib/proxy");


var config = require("./config");

var log = require('./lib/logHelper').getLogger();


var server = express();

server.use(express.bodyParser());
server.use(express.cookieParser());
server.use(express.logger("dev"));
server.use("/agent_static_file/", express.static(__dirname + '/static'));
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

    var reg = /^\/js\/agent_common_client\.js$/;
    if(reg.test(url)){
        res.sendfile("js/agent_common_client.js");
    } else{
        next();
    }
});


var  userList = {};


server.use(function(req, res, next){
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
    log.debug(urlInfo.pathname);
    var options = {url:loginUrl,pool:false, headers:req.headers,encoding:null,followRedirect:false,body:dataStr,method:"POST"};
    if(loginUrl && reg.test(urlInfo.pathname)){
        if(req.method == "POST"){
            var data = req.body;
            var dataStr =   qs.stringify(data);
            request(options).pipe(res);
        }else{
            var toUrl = url.indexOf("?");
            toUrl = url.substr(toUrl+1);
            request(loginUrl + "?" + toUrl).pipe(res);
        }

    } else{
        var shouldVerify = true;
        var userName = req.cookies["sykj_user"];
        if(userName){
            var time = userList[userName];
            time = time || 0;
            var now = Date.now();
           var diff =  ((now - time ) /  1000);
            if(diff  < 600){
                shouldVerify = false;
            }
        }
        if(verifyUrl && shouldVerify){

            var  form = {};
            form.url = req.url;
            options = {url:verifyUrl,pool:false,headers:req.headers,encoding:null,followRedirect:false,form:form,method:"POST"};
            request(options, function(err, vRes, body){
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