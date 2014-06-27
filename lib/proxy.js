var async = require("async");
var qs = require("querystring");
var urlUtil = require('url');
var zlib = require("zlib");
//var Iconv  = require('iconv').Iconv;
var iconvLite  = require('iconv-lite');
var request = require("request");
var _ = require("underscore");

var cookieUtil = require("./cookie-util");
var txtUtil = require("./text-util");
var commonUtil = require("./common");
var config = require("../config");

var log;
if(config.logPath){
    log = require('./logHelper').getLogger(7, "logs/debug.log");
}else{
    log = require('./logHelper').getLogger();
}



var that = {};




that.getTargetBaseUrl =   function(req){
    var originAccessHost = req.host;
    var host = commonUtil.getTargetHost(req);
    host = "http://" + host;
    return host;

};

function getBaseAccessHostPort(){
    return commonUtil.getBaseAccessHostPort();
}


that.replaceAccessHost = function(req, originValue, parseValue){
    var proxyHost = that.getProxyHost(req);
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
    var baseURI = that.getTargetBaseUrl(req);
    var requestUrl  = url || req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    var resultUrl = "";
    if(config.model == "multi"){
        resultUrl = baseURI + urlInfo.href;
    }else{
        var hostReg = /\/([^\/]+)/;
        var host = that.getProxyHostFromUrl(requestUrl);
        if(host){
            baseURI = "http://" + host;
        }
        var href = urlInfo.path.replace(hostReg, "");
        resultUrl = baseURI + href;
    }
    //log.debug(req.headers);
    //log.debug("target Url is %s", requestUrl);
    return resultUrl;
};

that.getProxyHostFromUrl = function(url){
    var urlInfo = urlUtil.parse(url);
    var href = urlInfo.path;
    var hostReg = /^\/([^\/]+)/;
    var result = hostReg.exec(href);
    return result[1];
};


//获取最终服务器的host
that.getProxyHost = function(req){
    return commonUtil.getTargetHost(req);
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
    if(Buffer.isBuffer(data)){
        return data;
    }
    var contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";
    var dataStr = data;
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


function replaceASrc(req, originValue){

    var proxyHost = commonUtil.getTargetHost(req);
    var reg = /(src|href)=["']([^"']+)(["'])/img;
    originValue = originValue.replace(reg, function(a, tag, val){
        var b = /^[\s]*\//;
        if(b.test(val)){
            log.debug("replace src origin: %s, tag:%s", a, tag);
            return tag + "=\"/" + proxyHost + val + "\"";
        }else{
            return a;
        }

    });
    return originValue;



}

function replaceSpecialCharacters(originValue){

    var reg = /&(#xD|#xa);?/img;
    originValue = originValue.replace(reg, "");
    return originValue;

}




function replaceProxyHost(req, originValue){
    if(!originValue){
        return originValue;
    }
    originValue = replaceSpecialCharacters(originValue);
    var rootReg = /(edu\.cn|com\.cn)/;
    var pattern = commonUtil.getTargetHost(req);
    var hostPattern = commonUtil.getTargetRootHost(req);
    hostPattern = hostPattern.replace(".", "\\.");

    log.debug(hostPattern);
    var accessHost = config.accessHost;
    var accessPort = config.accessPort;
    var baseURI = accessHost;
    if(accessPort != 80){
        baseURI = accessHost + ":" + accessPort;
    }
    var  pattern1 = encodeURIComponent(pattern).replace(".", "\\.");



    log.debug(hostPattern);
    if(config.model == "single"){
        pattern = "(http(s)?://)((\\w+\\.)*(" + hostPattern + "))";

    }

    var reg = new RegExp(pattern, "ig");
    var reg1 = new RegExp(pattern1, "ig");

    if(config.model == "single"){
        originValue = originValue.replace(reg, function(a, protocol, httpS,  fullHost){

            return  protocol + baseURI + "/" + fullHost;
        });
    }else{
        originValue = originValue.replace(reg, baseURI);
        originValue = originValue.replace(reg1, encodeURIComponent(baseURI));
    }
    return originValue;
}

function replaceProxyRedirectHost(req, res){
    var url = res.headers["Location"] || res.headers["location"];
    log.debug(res.headers);
    if(/^http(s)?:\/\/?/i.test(url)){
        url = replaceProxyHost(req, url);
    }else{
        url =  "/" + commonUtil.getTargetHost(req) + url;
    }
    res.headers["Location"] = url;
    delete res.headers["location"];
}



function strToReg(str, options){
    str = str.replace(/[\.\+]/g, function(a){
        return "\\" + a;
    });
    return new RegExp(str, options);
}



function replaceSrc(html, host, req){

    var specialArr = [
        ["/kns/Request/login.aspx", "/epub.cnki.net"],
        ["/request/searchHandler.ashx", "/epub.cnki.net"],
        ["f+\"/request/getucHandler.ashx", "\"/epub.cnki.net\"+"],
    ];
    host = host.replace(/^[\s]*\//,"");

    var baseReg = /<base[\s]*href="([^"]+)"\s*\/?>/img;
    var hasBase = baseReg.test(html);
    log.debug("has base %s", hasBase);
    var targetRootHost = commonUtil.getTargetRootHost(req);
    log.debug("root host is %s", targetRootHost);
    var baseHost;
    if(hasBase){
        baseReg.lastIndex = 0;
        var baseUrl = baseReg.exec(html)[1];
        var pathInfo =  urlUtil.parse(baseUrl);
        baseHost = pathInfo.pathname;
        baseHost = baseHost.replace(/^\//, "");
        baseHost = baseHost.replace(/\/$/, "");
        log.debug("base host is %s", baseHost);
    }
    var reg = /<(src|href|action)=["']([^>"']+)["']/img;

    //patten must be //*.bing.com
    var rootHostPattern =   targetRootHost.replace(/\./g, "\\.");
    var  linkPattern = "//(([^/]*\\.)*" + rootHostPattern +")";
    var linkReg = new RegExp(linkPattern,"i");

    html =   html.replace(reg, function(all, attr, attrVal){
        if(/^[\s]*\//.test(attrVal)){
            var to;
            log.debug("replace src href action");
            log.debug(all);
            attrVal = attrVal.replace(/^[\s]*/,"");
            var replaceHost = host;
            if(baseHost){
                replaceHost = baseHost;
            }
            //var urlInfo = urlUtil.parse(originUrl);

            if(linkReg.test(attrVal)){
                attrVal = attrVal.substring(1);
                to =  attr + "=\"/" + replaceHost +  attrVal +"\"";
                log.debug("replace value:%s, to value: %s", all, to);

                return to;
            }
            //link start with //
            if(/^\/\//.test(attrVal)){
                return   all;
            }
            to =  attr + "=\"/" + replaceHost +  attrVal +"\"";
            log.debug("replace value:%s, to value: %s", all, to);
            return to;

        } else{
            return all;
        }
    });



    var cookieReg = /document\.domain\s*=\s*["']([^'"]+)['"]/img;
    html = html.replace(cookieReg, function(a, b){
        log.debug("replace cookie domain");
        return "document.domain = \""  + config.accessHost + "\"";
    });
    baseReg.lastIndex = 0;
    //html = html.replace(baseReg, "");

    _.each(specialArr, function(item){
        var pattern = item[0];
        var pre = item[1];
        var reg = strToReg(pattern, "gi");

        /* html = html.replace(reg, function(a){
         return  pre + a;
         });*/

    });

    var htmlReg = /<\/body>\s*<\/html>/img;
    var htmlReg1 = /<title>/img;
    if(htmlReg1.test(html) && htmlReg.test(html)){
        htmlReg.lastIndex = 0;
        html = html.replace(htmlReg, function(a){
            log.debug(a);
            log.debug("append script");
            var script = "<script type=\"text/javascript\" src=\"/js/agent_common_client.js\"></script>";
            if(baseHost){
                script += "<script type=\"text/javascript\"> var _agent_base_host  = '" + baseHost +  "' </script>";
            }

            return script + a;

        });
    }

    return html;

};




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
    log.debug("targetUrl is: %s", url);
    var proxyHeaders = req.headers;
    proxyHeaders =   that.replaceAccessHeaderHost(req, proxyHeaders);
    var pathInfo = urlUtil.parse(url);
    delete proxyHeaders.connection;
    delete proxyHeaders["content-length"];
    async.waterfall([
            function(cb){
                if(method == "POST"){
                    var data = that.preparePostData(req);

                    log.debug("post headers is %s", proxyHeaders);
                    getRequestPost(url, proxyHeaders, data, function(err, pRes, body){
                        cb(err, pRes, body);
                    });
                }else{
                    //log.debug(proxyHeaders);
                    var pathReg = /(downloadcdmd\.asp|pdfdownloadnew\.asp)/;

                    that.getRequestGet(url, proxyHeaders, function(err, pRes, body){
                        var key = "content-disposition";
                        if(!err){
                            txtUtil.serResponseFileHeader(pRes.headers);
                        }else{
                            log.debug("error url is %s", url);
                            log.debug("error  header is %s", proxyHeaders);
                        }

                        cb(err, pRes, body);
                    });

                }
            },
            function(pRes, body, cb){
                if(pRes.headers["location"] || pRes.headers["Location"]){
                    log.debug("res headers is %s", pRes.headers);
                    replaceProxyRedirectHost(req, pRes);
                }
                cb(null, pRes, body);

            },
            function(pRes, body, cb){
                cookieUtil.replaceCookieHost(pRes, req);
                cb(null, pRes, body);

            }],
        function(err, pRes, body){

            if(err){
                log.error(err);
                log.debug(body);
                log.debug(pRes);
                if(err != "handled"){
                    res.send(err);
                }

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
            var isT = txtUtil.isText(pRes);
            var encoding = pRes.headers['content-encoding'];
            if(isT){
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
            } else{
                cb(null, pRes.body);
            }

        }], function(err, bodyBuffer){
        if(err){
            res.send(err);
            return;
        }
        var result = bodyBuffer;
        var isT = txtUtil.isText(pRes);
        log.debug("isT %s", isT);
        if(isT){
            var sourceEncoding = txtUtil.getEncoding(result,pRes);
            var toEncoding = "utf-8";
            var convertEncoding = false;
            log.debug(sourceEncoding);
            if(!sourceEncoding && !txtUtil.isUTF8Encoding(bodyBuffer)){
                log.debug("use simple charset detect");
                sourceEncoding = "gbk";
            }

            if(sourceEncoding && sourceEncoding != toEncoding){
                if(sourceEncoding == "gb2312"){
                    sourceEncoding = "gbk";
                }
                try{
                    //var iconv = new Iconv(sourceEncoding, toEncoding);
                    //var b =  iconv.convert(bodyBuffer);
                    //result = b.toString();
                    result = iconvLite.decode(bodyBuffer, sourceEncoding);
                    convertEncoding = true;
                } catch (e){
                    log.debug("there is an error in convert the encoding");
                    result = bodyBuffer.toString();
                }
                //replace meta encoding to utf-8 if exists
                //result =txtUtil.replaceEncoding(result,toEncoding);
                //replaceHeaderEncoding(pRes);
            } else{
                result = bodyBuffer.toString();
            }


            //
            if(typeof(result) == "string"){
                result   = replaceProxyHost(req, result);
                var host = that.getProxyHost(req);
                if(!txtUtil.isJS(pRes)){
                    result   = replaceSrc(result, host, req);
                }
                result =  txtUtil.replaceJSAction(result, host);
            }

            if(convertEncoding){
                result = iconvLite.encode(result, sourceEncoding);
            }

            delete pRes.headers["content-encoding"];
            delete pRes.headers["content-length"];
        }

        var status = pRes.statusCode;
        log.debug(typeof(status));
        log.debug("response status is %s", status);


        var header = req.headers["if-modified-since"];
        log.debug("is modified %s" == pRes.headers["last-modified"]);
        if((header && header == pRes.headers["last-modified"]) || status == 304){
            res.send(304);
        } else if(status > 300 && status <= 302){
            log.debug("response headers is %s", pRes.headers);
            res.set(pRes.headers);
            res.send(status);
        } else{
            //log.debug(pRes.headers);
            res.set(pRes.headers);
            res.write(result);
            res.end();
        }
    });

};


module.exports = that;