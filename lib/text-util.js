
var iconvLite = require("iconv-lite");
var _ = require("underscore");
var log = require("./logHelper").getLogger();
var commonUtil = require("./common");
var that = {};




that.isText = function(res){
    var headerKeys = _.keys(res.headers);
    var contentType = "";
    var reg = /Content-Type/ig;
    var reg1 = /(text\/|application\/(x-)?javascript)/ig;
    var contentTypeKey = _.find(headerKeys,function(key){
        var result = reg.test(key);
        reg.lastIndex = 0;
        return result;

    });
    if(contentTypeKey){
        contentType = res.headers[contentTypeKey];
    }
    return contentType && reg1.test(contentType);
};

that.isJS = function(res){
    var headerKeys = _.keys(res.headers);
    var contentType = "";
    var reg = /Content-Type/ig;
    var reg1 = /(application\/(x-)?javascript)/ig;
    var contentTypeKey = _.find(headerKeys,function(key){
        var result = reg.test(key);
        reg.lastIndex = 0;
        return result;

    });
    if(contentTypeKey){
        contentType = res.headers[contentTypeKey];
    }
    return contentType && reg1.test(contentType);
};



that.getEncoding = function(html,res){
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

};

that.replaceEncoding = function(html,toEncoding){
    toEncoding = toEncoding || "utf-8";
    var reg = /<meta[^>]*charset="?([a-zA-Z0-9-]+)"?[^>]*\/?>/ig;
    html =  html.replace(reg,function(all,b){
        all =   all.replace(b,toEncoding);
        return all;
    });
    return html;

};

that.serResponseFileHeader = function(headers){

    if(!headers){
        return;
    }
    var name = "content-disposition";
    var v = headers[name];
    v = v || "";
    var reg = /\.[^\.]+"?$/
    if(reg.test(v)){
        log.debug(v);
        var ext = reg.exec(v)[0];
        v = "attachment; filename=\"download" + ext  +"\"";
        headers[name] = v;
    }else{
        delete headers[name];
    }


};

that.getTrueEncoding = function(buffer){

    var arr = ["gbk", "gb2312", "utf8"];
    var lenArr = [];
    var e;
    log.debug(buffer);
    log.debug("buffer length is %s", buffer.length);
    e = _.find(arr, function(c){
        var str = iconvLite.decode(buffer, c);

        log.debug(str);
        var cBuffer = iconvLite.encode(str, c);
        log.debug(cBuffer);
        var resultStr = iconvLite.decode(cBuffer, c);
        return cBuffer.length == buffer.length && resultStr.length == str.length;
    });

    return e;



};

that.isUTF8Encoding = function(buffer){

    var arr = ["gbk", "gb2312", "utf8"];
    var lenArr = [];
    var e;
    var str = buffer.toString();
    var newBuffer = iconvLite.encode(str, "utf8");

    return newBuffer.length == buffer.length;



};




that.replaceJSAction = function(text, host) {
    var reg = /(([^{}\r\n\s;]+)[\r\n\s;]+)(([^(?!onLoad="){}\r\n\s;]+)\.submit\(\))/img;
    var isSet = false;
    text = text.replace(reg, function(a, pre, preSub, secAll, b) {
        if (/^(\/\/|\/\*)/img.test(b)) {
            return a;
        }
        var result = pre;
        if (/^if/.test(pre)) {
            if (!/}/.test(pre)) {
                result += "{setAction(" + b + ",\"" + host + "\");"
                result += secAll + "}";
                isSet = true;
            }

        } else {
            result += "setAction(" + b + ",\"" + host + "\");"
            result += secAll ;
            isSet = true;
        }

        return result;

    });
    return text;

};


function replaceSpecialCharacters(originValue){
    var reg = /&(#xD|#xa);?/img;
    originValue = originValue.replace(reg, "");
    return originValue;

}

/**
 * 替换目标服务的host
 * @param req  origin request from user
 * @param originValue
 * @param replaceAllHost 是否强制替换而不用匹配当前代理的域名
 * @returns {*}
 */
that.replaceProxyHost = function(req, originValue, replaceAllHost){
    if(!originValue){
        return originValue;
    }
    originValue = replaceSpecialCharacters(originValue);
    var rootReg = /(edu\.cn|com\.cn)/;
    var pattern = commonUtil.getTargetHost(req);

    var rootPattern = commonUtil.getTargetRootHost(req);
    rootPattern = rootPattern.replace(".", "\\.");
    log.debug(rootPattern);

    var baseURI = commonUtil.getBaseAccessHostPort(req);
    var  pattern1 = encodeURIComponent(pattern).replace(".", "\\.");
    log.debug(rootPattern);
    if(config.model == "single"){
        //不匹配当前代理的根域名
        if(replaceAllHost){
            pattern = "(http(s)?://)((\\w+\\.)*([^/]+))";
        }else{
            pattern = "(http(s)?://)((\\w+\\.)*(" + rootPattern + "))";
        }
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

module.exports = that;
