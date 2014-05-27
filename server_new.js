var express = require('express');
var urlUtil = require('url');


var proxyUtil = require("./lib/proxy");


var config = require("./config");
var log = require('./lib/logHelper').getLogger();


var server = express();

server.use(express.bodyParser());
server.disable("x-powered-by");

server.use(function(req, res ,next){
   var url = req.url;
   if(config.model == "single"){
       var pattern = config.proxyHost.replace(/\./ig, "\\.");
       var reg = new RegExp(pattern, "i");
       if(!reg.test(url)){
           var urlInfo = urlUtil.parse(url);
           var newUrl = "/" + config.proxyHost + urlInfo.href;
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