var express = require('express');

var proxyUtil = require("./lib/proxy");


var config = require("./config");
var log = require('./lib/logHelper').getLogger();


var server = express();

server.use(express.bodyParser());
server.disable("x-powered-by");


server.use(proxyUtil.handler);
var listenPort = config.accessPort;


log.debug("started listen port %s",listenPort);
server.listen(listenPort);