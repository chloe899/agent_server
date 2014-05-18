var request = require("request");
var async = require('async');
var _ = require("underscore");
var log = require('./lib/logHelper').getLogger();
var fs = require("fs");
var exec =  require("child_process").exec;
var crypto = require("crypto");
//var util = require('./util');
//var mustache = require("mustache");
var Iconv  = require('iconv').Iconv;
var sysUtil = require('util');
var http = require('http');
var express = require('express');
var execPath = process.cwd();

var urlUtil = require('url');
var prefix = "";
var shasum = crypto.createHash('md5');
var pathUtil = require('path');
var zlib = require('zlib');

var qs = require("querystring");




process.on("uncaughtException",function(err){
    log.error(err.stack || err);
});

function getMD5Sum(data){
    shasum.update(data);
    var d = shasum.digest('hex');
    return d;
}


function handlePostResponse(originReq,originRes, externalUrl,res){

}

function getPostData(req,res){
    var eUrl =  getHost(req) + req.url;
    var data = req.body;
    var contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";
    var dataStr = "";
    if(contentType == "application/x-www-form-urlencoded"){
        dataStr =   qs.stringify(data);
    }
    log.debug(data);
    var headers = req.headers;
    headers = replaceHeaderHost(headers);
    var options = {url:eUrl,headers:headers,encoding:null,body:dataStr,method:"POST"};
    log.debug(options);
    async.waterfall([
        function(cb){
            request(options, function(err, res, body){
                cb(err, res, body);
            });
        },
        function(serverRes, body, cb){
            var encoding = serverRes.headers['content-encoding'];
            log.debug(serverRes.headers);
            switch (encoding) {
                // or, just use zlib.createUnzip() to handle both cases
                case 'gzip':
                    zlib.unzip(serverRes.body, function(err, buffer) {
                        cb(err, serverRes, buffer);
                    });
                    break;
                case 'deflate':
                    zlib.inflate(serverRes.body, function(err, buffer) {
                        cb(err, serverRes,buffer);
                    });
                    break
                default :
                    cb(null,serverRes, body);

            }
        },
        function(serverRes, body, cb){

            var isT = isText(serverRes);
            log.debug("is test %s", isT);
            if(isT){
                var bodyStr = body.toString();
                var sourceEncoding = getEncoding(bodyStr, serverRes);
                var toEncoding = "utf-8";
                if(sourceEncoding && sourceEncoding != toEncoding){
                    if(sourceEncoding == "gb2312"){
                        sourceEncoding = "gbk";
                    }

                    log.debug("convert %s to %s",sourceEncoding,toEncoding);
                    log.debug(serverRes.headers);
                    var iconv = new Iconv(sourceEncoding, toEncoding);
                    var b =  iconv.convert(body);
                    bodyStr = b.toString();
                    //replace meta encoding to utf-8 if exists
                    bodyStr = replaceEncoding(bodyStr,toEncoding);


                } else{

                    bodyStr = body.toString();
                }             //
                bodyStr   = replaceHost(bodyStr);
                delete serverRes.headers["content-encoding"];
                delete serverRes.headers["content-length"];
                cb(null, serverRes, bodyStr);

            }else{
                cb(null, serverRes, body);
            }

        }
    ], function(err,serverRes, body){
        if(err){
            log.error(err);
        }else{
            log.debug(body);
            log.debug(serverRes.headers);
            res.set(serverRes.headers);
            res.write(body);
            res.end();
        }

    });

    //extReq.pipe(res);

    return;

}

var server = express();

server.use(express.bodyParser());
server.disable("x-powered-by");




var basePath = "tmp/cnki.net";
var proxyHost = "cnki.net";
var listenPort  = 8929;
var serverHost = "test.local";
var accessHost = "test.local";
var accessPort = "8929";

function getHost(req){
    var reqHost = req.host;
    log.debug(reqHost);
    //log.debug(req.headers);
    var pattern = accessHost.replace(/\./g, "\\.");
    pattern = pattern + "$";
    var reg =  new RegExp(pattern);
    var host = proxyHost;

    if(reg.test(reqHost)){
        var sub = reqHost.replace(reg,"");
        log.debug(sub);
        host = sub + proxyHost;
    }

    host = "http://" + host;
    return host;
}

function replaceHost(html,toHost){
    if(!html){
        return html;
    }
    if(!toHost){
        toHost = accessHost +  ":" + accessPort;
    }
    var regStr =  proxyHost.replace(/\./ig,function(a){
        return "\\.";
    });
    regStr  = "[a-zA-Z0-9-]+\\.(" + regStr + ")";
    var reg = new RegExp(regStr,"ig");
    var hosts = {};
    html = html.replace(reg,function(a,b){
        a = a.toLocaleLowerCase();
        var result =  a.replace(b,toHost);
        hosts[a] = a.replace(b, accessHost);
        return   result;


    });
    _.each(hosts,function(v,k){

        console.log("127.0.0.1 %s",v);
    });
    return html;

}



function parseArgv(){
    var pArgArr = process.argv;
    var result = {};
    var isPrevKey = false;
    _.each(pArgArr,function(v,i){
        if(/^-/.test(v)){
            isPrevKey = true;
            var keyName = pArgArr[i-1].replace(/^-/,"");
            result[keyName] = "";
        }else{
            if(isPrevKey){
                var keyName = pArgArr[i-1].replace(/^-/,"");
                result[keyName] = v;
            }
            isPrevKey = false;
        }
    });
    return result;
}

var argvObj = parseArgv();


if(argvObj["ep"]){
    basePath = argvObj["ep"];
    var reg = /([\/]*)$/;
    if(reg.test(basePath)){
        basePath = basePath.replace(reg,"");
    }
    log.debug(basePath);
}
if(argvObj["h"]){
    proxyHost = argvObj["h"];
    var reg = /([\/]*)$/;
    if(reg.test(proxyHost)){
        proxyHost = proxyHost.replace(reg,"");
    }
    log.debug("proxy host %s",proxyHost);
}
if(argvObj["sh"]){
    serverHost = argvObj["sh"];
    var reg = /([\/]*)$/;
    if(reg.test(serverHost)){
        serverHost = serverHost.replace(reg,"");
    }
    log.debug("server host %s",serverHost);
}



//port
if(argvObj["p"]){

    listenPort = +argvObj["p"];
}


function isText(res){
    var headerKeys = _.keys(res.headers);
    var contentType = "";
    var reg = /Content-Type/ig;
    var reg1 = /(text\/|application\/x-javascript)/ig;
    var contentTypeKey = _.find(headerKeys,function(key){
        var result = reg.test(key);
        reg.lastIndex = 0;
        return result;

    });
    if(contentTypeKey){
        contentType = res.headers[contentTypeKey];
    }
    return contentType && reg1.test(contentType);
}


function getEncoding(html,res){
    var encoding;
    var headerKeys = _.keys(res.headers);
    var contentType = "";
    var reg = /Content-Type/ig;
    var encodingReg = /<meta[^>]*charset="?([a-zA-Z0-9-]+)"?[^>]*\/?>/ig;
    var encodingReg1 = /charset="?([a-zA-Z0-9-]+)"?/ig;

    var contentTypeKey = _.find(headerKeys,function(key){
        var result = reg.test(key);
        reg.lastIndex = 0;
        return result;

    });
    if(contentTypeKey){
        contentType = res.headers[contentTypeKey];
    }
    if(contentType){
        var headerEncodingResult =    encodingReg1.exec(contentType);
        encoding = headerEncodingResult && headerEncodingResult[1];
    }
    if(!encoding){
        var result = encodingReg.exec(html);
        if(result && result[1]){
            encoding = result[1];
        }
    }

    return encoding && encoding.toLowerCase();

}

function replaceEncoding(html,toEncoding){
    toEncoding = toEncoding || "utf-8";
    var reg = /<meta[^>]*charset="?([a-zA-Z0-9-]+)"?[^>]*\/?>/ig;
    html =  html.replace(reg,function(all,b){
        log.debug(b);
        all =   all.replace(b,toEncoding);
        return all;
    });
    return html;

}






function mkDirP(path,cb){

    var cmd = "mkdir -p " + path;
    exec(cmd,function(){
        cb(null);
    });

}

function getBaseAccessUrl(){
    if(accessPort == "80"){
        return accessHost;
    }else{
        return accessHost + ":" + accessPort;
    }
}
function replaceBaseHost(originValue){
    if(!originValue){
        return originValue;
    }
    var pattern = getBaseAccessUrl();
    var  pattern1 = encodeURIComponent(pattern).replace(".", "\\.");
    pattern = pattern.replace(".", "\\.");

    log.debug(pattern);
    var reg = new RegExp(pattern, "ig");
    var reg1 = new RegExp(pattern1, "ig");
    originValue = originValue.replace(reg, proxyHost);
    originValue = originValue.replace(reg1, encodeURIComponent(proxyHost));
    return originValue;
}


function replaceHeaderHost(headers){
    var replaceArr = ["host", "cookie", "referer"];
    _.each(replaceArr, function(k){
        var value = headers[k];
        if(value){
            headers[k] = replaceBaseHost(value);
        }
    });
    return headers;

}

function getRequest(externalUrl,headers,cb){
    var referer   = headers.referer;
    headers = replaceHeaderHost(headers);
    var reg = /http(s)?:\/\/[^\/]+/;
    var baseUrl = reg.exec(externalUrl)[0];

    var options =  {url:externalUrl,encoding:null,followRedirect:false,headers:headers};
    request(options,function(err,res,body){
        if(err){
            cb(err);
            return;
        }
        if(res.headers["Location"] || res.headers["location"]){
            var url = res.headers["Location"] || res.headers["location"];
            log.debug(res.headers);;
            if(!/^http(s)?:\/\/?/i.test(url)){
                url = baseUrl + url;
            }
            getRequest(url,headers,cb);
        } else{
            cb(err,res,body);
        }
    });
}

function getTargetHostName(req){

}





server.use(function(req,res,next){

    var host = getHost(req);
    var requestUrl  =  req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    log.debug(urlInfo);
    var urlPath = urlInfo.pathname;
    var filePath =   basePath + "/" + req.host  +  prefix + urlInfo.pathname;
    filePath = decodeURIComponent(filePath);
    var urlQueryArr = urlPath.split("?");
    urlQueryArr.splice(0,1);
    var query = "";
    query = urlInfo.search;
    if(query){
        filePath = filePath + query;
    }

    filePath = decodeURIComponent(filePath);
    log.debug(req.host);

    if(/\/$/.test(filePath)){
        filePath = filePath + "index.html";

    }
    log.debug("file path = %s",filePath);
    //var host = "http://teespring.com";

    log.debug(filePath);
    var method = req.method;
    //log.debug(method);
    if(method == "POST"){
        getPostData(req,res);
        return;
    }
    async.waterfall(
        [
            function(cb){
                fs.exists(filePath, function (exists) {
                    if(exists && !urlInfo.search){
                        log.debug("file:%s found", filePath);
                        cb(null);
                    }else{
                        log.debug(urlQueryArr);
                        query = replaceBaseHost(query);
                        query = query || "";
                        var externalUrl = host  + prefix + urlInfo.pathname + query;
                        //log.debug(externalUrl);
                        getRequest(externalUrl,req.headers, function(err, res, body){
                            if(err){
                                log.error(err);
                            }
                            log.debug(res.headers);
                            cb(err, res, body);
                        });
                    }

                });
            }
        ],
        function(error,pres,body){
            if(body){
                async.waterfall([function(cb){
                    var encoding = pres.headers['content-encoding'];
                    log.debug(encoding);
                    switch (encoding) {
                        // or, just use zlib.createUnzip() to handle both cases
                        case 'gzip':
                            zlib.unzip(body, function(err, buffer) {
                                cb(err, buffer);
                            });
                            break;
                        case 'deflate':
                            zlib.inflate(body, function(err, buffer) {
                                cb(err, buffer);
                            });
                            break
                        default :
                            cb(error, body);

                    }
                }], function(err, body){
                    var result = body;
                    var isT = isText(pres);
                    if(isT || /((\.(js|css|html|htm))|\/)$/.test(urlPath)){

                        var sourceEncoding = getEncoding(result,pres);
                        var toEncoding = "utf-8";
                        if(sourceEncoding && sourceEncoding != toEncoding){
                            if(sourceEncoding == "gb2312"){
                                sourceEncoding = "gbk";
                            }

                            log.debug("convert %s to %s",sourceEncoding,toEncoding);
                            log.debug(pres.headers);
                            var iconv = new Iconv(sourceEncoding, toEncoding);
                            var b =  iconv.convert(body);
                            result = b.toString();
                            //replace meta encoding to utf-8 if exists
                            result = replaceEncoding(result,toEncoding);


                        } else{

                            result = body.toString();
                        }             //
                        result   = replaceHost(result);
                        delete pres.headers["content-encoding"];
                        delete pres.headers["content-length"];
                    }

                    log.debug(typeof(result));
                    //result = result.toString();
                    var status = pres.statusCode;
                    log.debug("response status is %s", status);
                    if(status != 304){
                        log.debug("is modified %s",req.headers["if-modified-since"] == pres.headers["last-modified"]);
                        if(req.headers["if-modified-since"] == pres.headers["last-modified"]){
                            res.send(304);
                        } else{
                            res.set(pres.headers);
                            res.write(result);
                            res.end();
                        }

                    } else{
                      res.send(304);
                    }

                    if(!query && !/(\.aspx|\.ashx)/ig.test(filePath)){
                        var p  = pathUtil.dirname(filePath);
                        if(result){
                            mkDirP(p,function(){
                                var s = fs.createWriteStream(filePath);
                                s.write(result,function(){
                                    log.debug("%s write complete",filePath);
                                });
                            });
                        }

                    }

                });


            }else{

                if(pres){
                    log.debug("not modified %s",req.headers["if-modified-since"] == pres.headers["last-modified"]);
                    if(pres.statusCode != 304){

                        if(req.headers["if-modified-since"] == pres.headers["last-modified"]){
                            res.send(304);
                        } else{
                            res.set(pres.headers);
                            res.write(result);
                            res.end();
                        }

                    } else{
                        res.send(304);
                    }

                }else{
                    filePath = decodeURIComponent(filePath);
                    log.debug(filePath);
                    var accept = req.headers["accept"];
                    var reg = /text\/[^,]+/;
                    var r = reg.exec(accept);
                    if(r){
                        res.set({"content-type":r[0]});
                    }
                    res.sendfile(filePath);
                }

                //fs.createReadStream(decodeURIComponent(filePath)).pipe(res);
            }

        });




});
log.debug("started listen port %s",listenPort);
server.listen(listenPort);



