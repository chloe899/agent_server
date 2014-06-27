
var iconvLite = require("iconv-lite");
var _ = require("underscore");
var log = require("./logHelper").getLogger();
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

module.exports = that;
