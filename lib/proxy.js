var async = require("async");
var qs = require("querystring");
var urlUtil = require('url');
var zlib = require("zlib");
var Iconv  = require('iconv').Iconv;
var request = require("request");



var txtUtil = require("./text-util");

var _ = require("underscore");
var log = require('./logHelper').getLogger();


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
        host = host || proxyHost;
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


that.replaceAccessHost = function(req, originValue, parseValue){
    var proxyHost = config.proxyHost;
    if(config.model == "single"){
        proxyHost =  (parseValue  && that.getProxyHostFromUrl(parseValue)) ||  proxyHost;

    }
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

that.replaceAccessHeaderHost = function(req, headers){

    var replaceArr = ["host", "cookie", "referer", "origin"];
    _.each(replaceArr, function(k){
        var value = headers[k];

        if(value){
            if(k == "referer"){
                headers[k] = that.getProxyUrl(req, value);
            }else{
                headers[k] = that.replaceAccessHost(req, value, req.url);
            }

        }
    });
    return headers;
};


function getBaseAccessHost(){
    var host = config.accessHost;
    if(config.accessPort != "80"){
        host = host + ":" + config.accessPort;
    }
    return host;

}
that.getProxyUrl = function(req, url){
    var baseURI = that.getTargetHost(req);
    var requestUrl  = url || req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    log.debug(urlInfo);
    var resultUrl = "";
    if(config.model == "multi"){
        resultUrl = baseURI + urlInfo.href;
    }else{
        var hostReg = /\/([^\/]+)/;
        var href = urlInfo.href.replace(hostReg, "");
        log.debug(baseURI);
        resultUrl = baseURI + href;
    }
    log.debug(requestUrl);
    return resultUrl;
};

that.getProxyHostFromUrl = function(url){
    var urlInfo = urlUtil.parse(url);
    var href = urlInfo.href;
    var hostReg = /^\/([^\/]+)/;
    var result = hostReg.exec(href);
    return result[1];
};

that.getProxyHost = function(req){
    var baseURI = that.getTargetHost(req);
    var requestUrl  =  req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    var host  = req.host;
    var hostReg = /^\/([^\/]+)/;
    if(config.model == "multi"){
        host = host.replace(getBaseAccessHost(), config.proxyHost);
    }else{
        var result = hostReg.exec(urlInfo.href);
        host = result[0];
    }
    return host;
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

function replaceProxyHost(originValue){

    if(!originValue){
        return originValue;
    }
    var proxyHost = config.proxyHost;
    var accessHost = config.accessHost;
    var accessPort = config.accessPort;
    var baseURI = accessHost;
    if(accessPort != 80){
        baseURI = accessHost + ":" + accessPort;
    }
    var pattern = proxyHost;
    var  pattern1 = encodeURIComponent(pattern).replace(".", "\\.");
    pattern = pattern.replace(".", "\\.");
    if(config.model == "single"){
        pattern = "(http(s)?://)((\\w+\\.)*(" + proxyHost + "))";
    }

    var reg = new RegExp(pattern, "ig");
    var reg1 = new RegExp(pattern1, "ig");
    if(config.model == "single"){
        originValue = originValue.replace(reg, function(a, protocol, httpS,  fullHost){
            log.debug(arguments);
            return  protocol + baseURI + "/" + fullHost;
        });
    }else{
        originValue = originValue.replace(reg, baseURI);
        originValue = originValue.replace(reg1, encodeURIComponent(baseURI));
    }
    return originValue;
}

function replaceProxyRedirectHost(res){
    var url = res.headers["Location"] || res.headers["location"];
    log.debug(res.headers);;
    if(/^http(s)?:\/\/?/i.test(url)){
        url = replaceProxyHost(url);
    }
    res.headers["Location"] = url;
    delete res.headers["location"];
}


}
function replaceHeaderEncoding(res){
    var charsetReg = /(charset="?)([a-zA-Z0-9-]+)("?)/ig;
    var headerKeys = _.keys(res.headers);
    var contentType = "";
    var reg = /Content-Type/ig;
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
       res.headers[contentTypeKey] = contentType.replace(charsetReg, function(a, b, c, d){
           d = d || "";
           return b + "utf-8" + d;
       });
    }

}




that.handler = function(req, res, next){

    var method = req.method;
    var url = that.getProxyUrl(req);
    log.debug(url);
    var proxyHeaders = req.headers;
    proxyHeaders =   that.replaceAccessHeaderHost(req, proxyHeaders);
    async.waterfall([
        function(cb){
            if(method == "POST"){
                var data = that.preparePostData(req);
                getRequestPost(url, proxyHeaders, data, function(err, pRes, body){
                    cb(err, pRes, body);
                });
            }else{
                log.debug(proxyHeaders);
                that.getRequestGet(url, proxyHeaders, function(err, pRes, body){
                    cb(err, pRes, body);
                });
            }
        },function(pRes, body, cb){
            if(pRes.headers["location"] || pRes.headers["Location"]){
                log.debug(pRes.headers);
                replaceProxyRedirectHost(pRes);
            }
            cb(null, pRes, body);

        }], function(err, pRes, body){

        if(err){
            log.error(err);
            res.send(err);
        }else{
            that.handleResponse(req, res, pRes, function(){
                log.debug(arguments);
            });
        }

    });


};




that.handleResponse = function(originReq, originRes, pRes, callback){
    var res = originRes;
    var req = originReq;
    async.waterfall([
        function(cb){
            var body = pRes.body;
            var encoding = pRes.headers['content-encoding'];
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
                    cb(null, pRes.body);

            }
        }], function(err, bodyBuffer){
        if(err){
            res.send(err);
            return;
        }
        var result = bodyBuffer;
        var isT = txtUtil.isText(pRes)
        if(isT){
            var sourceEncoding = txtUtil.getEncoding(result,pRes);
            var toEncoding = "utf-8";
            if(sourceEncoding && sourceEncoding != toEncoding){
                if(sourceEncoding == "gb2312"){
                    sourceEncoding = "gbk";
                }
                var iconv = new Iconv(sourceEncoding, toEncoding);
                var b =  iconv.convert(bodyBuffer);
                result = b.toString();

                //replace meta encoding to utf-8 if exists
                result =txtUtil.replaceEncoding(result,toEncoding);

            } else{
                result = bodyBuffer.toString();
            }             //
            result   = replaceProxyHost(result);
            delete pRes.headers["content-encoding"];
            delete pRes.headers["content-length"];
        }

        var status = pRes.statusCode;
        log.debug(typeof(status));
        log.debug("response status is %s", status);


        var header = req.headers["if-modified-since"];
        log.debug("is modified %s" == pRes.headers["last-modified"]);
        if(header && header == pRes.headers["last-modified"]){
            res.send(304);
        } else if(status > 300 && status <= 302){
            log.debug(pRes.headers);
            res.set(pRes.headers);
            res.send(status);
        } else{
            log.debug(pRes.headers);
            res.set(pRes.headers);
            res.write(result);
            res.end();
        }
    });

};


module.exports = that;