var request = require("request");
var async = require('async');
var _ = require("underscore");
var log = require('./logHelper').getLogger();
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
var teeHost = "http://teespring.com";




process.on("uncaughtException",function(err){
    log.error(err.stack || err);
});

function getMD5Sum(data){
    shasum.update(data);
    var d = shasum.digest('hex');
    return d;
}

function getPostData(req,res){
    var eUrl =  getHost(req) + req.url;
    var data = req.body;
    var dataStr = req._rawBody;
    log.debug(dataStr);
    var headers  = {"Content-type":"application/x-www-form-urlencoded; charset=utf-8"};
    var extReq = request({url:eUrl,headers:headers,body:dataStr,method:"POST"});
    extReq.pipe(res);

    return;
    var urlPath  =  req.url;
    var urlInfo = urlUtil.parse(urlPath);
    var filePath;
    var method = req.method;
    var data = "";
    req.on("data",function(chunk){
        data = data + chunk;
    });
    req.on("end",function(){

        var md5sum = getMD5Sum(data);
        filePath = execPath + prefix + urlInfo.pathname + "/" + md5sum;
        async.waterfall(
            [
                function(cb){
                    fs.exists(filePath, function (exists) {
                        if(exists){
                            cb(null);
                        }else{
                            var cmd = "wget  -x -nH --post-data=" + data + " --output-document=" + md5sum  + " http://teespring.com"  + prefix + urlInfo.pathname;
                            console.log(cmd);
                            var c =  exec(cmd,{cwd:execPath},function(){
                                cb(null);
                            });
                            c.stdout.pipe(process.stdout);
                            c.stderr.pipe(process.stderr);
                        }

                    });
                }
            ],
            function(error,result){
                fs.createReadStream(filePath).pipe(res);
            });
    });
}

var server = express();
server.use(express.bodyParser());





var basePath = "/development/fhao123";
var proxyHost = "2345.com";
var listenPort  = 8989;
var serverHost = "yunyie.com";

function getHost(req){
    var reqHost = req.host;
    log.debug(reqHost);
    //log.debug(req.headers);
    var reg = /([a-zA-Z0-9-]+)\.([a-zA-Z0-9-]+)$/ig;
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
    var regStr =  proxyHost.replace(/\./ig,function(a){
        return "\\.";
    });
    regStr  = "[a-zA-Z0-9-]+\\.(" + regStr + ")";
    var reg = new RegExp(regStr,"ig");
    var hosts = {};
    html = html.replace(reg,function(a,b){
        a = a.toLocaleLowerCase();

        var result =  a.replace(b,toHost);
        hosts[a] = result;
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
    var reg1 = /text\//ig;
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
function replaceHeaderEncoding(res){
    var reg = /charset="?([a-zA-Z0-9-]+)"?/ig;
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
    exec(cmd,{cwd:basePath},function(){
        cb(null);
    });

}

function getRequest(externalUrl,cb){
    var options =  {url:externalUrl,encoding:null,followRedirect:false};
    request(options,function(error,res,body){
        if(res.headers["Location"] || res.headers["location"]){
            var url = res.headers["Location"] || res.headers["location"];
            getRequest(url,cb);
        } else{
            cb(error,res,body);
        }
    });
}





server.use(function(req,res,next){
    var requestUrl  =  req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    var urlPath = urlInfo.pathname;
    var filePath =  basePath + prefix + urlInfo.pathname;
    filePath = decodeURIComponent(filePath);
    var urlQueryArr = urlPath.split("?");
    urlQueryArr.splice(0,1);
    var query = "";
    if(urlQueryArr.length > 0){
        query = "?" + urlQueryArr.join("?");
    }
    filePath = decodeURIComponent(filePath);
    if(/\/$/.test(filePath)){
        filePath = filePath + "index.html";

    }
    log.debug("file path = %s",filePath);
    //var host = "http://teespring.com";
    var host = getHost(req);
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
                    if(exists){
                        cb(null);
                    }else{

                        var externalUrl = host  + prefix + urlInfo.pathname + query;
                        log.debug(externalUrl);
                        getRequest(externalUrl,cb);
                    }

                });
            }
        ],
        function(error,pres,body){
            if(body){
                var result = body.toString();
                var isT = isText(pres);
                if(isT || /((\.(js|css|html|htm))|\/)$/.test(urlPath)){
                    var sourceEncoding = getEncoding(result,pres);
                    var toEncoding = "utf-8";
                    if(sourceEncoding){
                        if(sourceEncoding == "gb2312"){
                            sourceEncoding = "gbk";
                        }
                        log.debug("convert %s to %s",sourceEncoding,toEncoding);
                        var iconv = new Iconv(sourceEncoding, toEncoding);
                        var b =  iconv.convert(pres.body);
                        result = b.toString();
                        //replace meta encoding to utf-8 if exists
                        result = replaceEncoding(result,toEncoding);

                    }                   //
                    result   = replaceHost(result,serverHost);
                    //log.debug(result);
                } else{

                    result = body;

                }

                log.debug(typeof(result));
                //result = result.toString();

                res.write(result);
                res.end();
                var p  = pathUtil.dirname(filePath);
                mkDirP(p,function(){
                    var s = fs.createWriteStream(filePath);
                    s.write(result,function(){
                        log.debug("%s write complete",filePath);
                    });
                });

            }else{
                fs.createReadStream(decodeURIComponent(filePath)).pipe(res);
            }

        });




});
log.debug("started listen port %s",listenPort);
server.listen(listenPort);



