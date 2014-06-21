
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



that.replaceJSAction = function(text, host) {
    var reg = /(([^{}\r\n\s;]+)[\r\n\s;]+)(([^{}\r\n\s;]+)\.submit\(\))/img;
    var isSet = false;
    text = text.replace(reg, function(a, pre, preSub, secAll, b) {
        if (/^(\/\/|\/\*)/img.test(b)) {
            return a;
        }
        var result = pre;
        console.log(pre);
        if (/^if/.test(pre)) {
            if (!/}/.test(pre)) {
                result += "{setAction(" + b + ",\"" + host + "\");"
                result += a + "}";
                isSet = true;
            }

        } else {
            result += "setAction(" + b + ",\"" + host + "\");"
            result += a;
            isSet = true;
        }

        return result;

    });
    return text;

};

module.exports = that;
