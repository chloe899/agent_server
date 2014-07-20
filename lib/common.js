
var urlUtil = require('url');
var qs = require("querystring");
var _ = require("underscore");

var request = require("request");
var config = require("../config");

var log = require('./logHelper').getLogger();

var that = {};




var  userList = {};

that.auth = function(req, res, next){
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
    log.debug("urlInfo is %s",urlInfo.pathname);
    var options;
    if(loginUrl && reg.test(urlInfo.pathname)){
        if(req.method == "POST"){
            var data = req.body;
            var dataStr =   qs.stringify(data);
            options =  {url:loginUrl,pool:false, headers:req.headers,encoding:null,followRedirect:false,body:dataStr,method:"POST"};
            request(options).pipe(res);
        }else{
            var toUrl = url.indexOf("?");
            toUrl = url.substr(toUrl+1);
            request(loginUrl + "?" + toUrl).pipe(res);
        }

    } else{
        var shouldVerify = true;
        var userName = req.cookies["SYKJ_User"];
        if(userName){
            var time = userList[userName];
            time = time || 0;
            var now = Date.now();
            var diff =  ((now - time ) /  1000);
            if(diff  < 600){
                shouldVerify = false;
            }
        }
        log.debug("shouldVerify is %s", shouldVerify);
        if(verifyUrl && shouldVerify){

            var  form = {};
            form.url = req.url;
            options = {url:verifyUrl,pool:{maxSockets:50},headers:req.headers,followRedirect:false,qs:form,method:"GET"};
            log.debug("verify options is %s", options);
            request(options, function(err, vRes, body){
                log.debug("verify body is %s", body);
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

}


/**
 *
 * @param req
 * @returns {*}
 */
that.getBaseAccessHostPort = function(req){
    var accessHost = config.accessHost;
    var accessPort = config.accessPort;
    var proxyHost = config.proxyHost;
    if(accessPort == "80"){
        return accessHost;
    }else{
        return accessHost + ":" + accessPort;
    }
};



that.getTargetRootHost = function(req){
    var rootReg = /(edu\.cn|com\.cn)/;
    var proxyHost = that.getTargetHost(req);
    var arr = proxyHost.split(".");
    var pattern = proxyHost;
    var start = arr.length - 2;
    if(rootReg.test(proxyHost)){
        start = arr.length - 3;
    }
    return arr.slice(start).join(".");


};

that.strToReg = function(str, options){
    str = str.replace(/[\.\+]/g, function(a){
        return "\\" + a;
    });
    return new RegExp(str, options);
};





that.getTargetHost = function(req){
    if(req.targetHost){
        return req.targetHost;
    }
    var requestUrl  =  req.url;
    var urlInfo = urlUtil.parse(requestUrl);
    var pathName = urlInfo.pathname;
    var hostReg = /\/(localhost|(\w+\.)+[^\/]+)/;
    var hostResult = hostReg.exec(pathName);
    var host = hostResult && hostResult[1];
    if(/(\.com|\.cn|\.net|\.org|\.me)/.test(host)){
        req.targetHost = host;
        return host;
    }
    var ipReg = /(\d+\.){3}\d+/;
    if(ipReg.test(host)){
        req.targetHost = host;
        return host;
    }


};



that.replaceFormValue  = function(req, res, next){
    var body = req.body;

    _.each(body, function(v, k){

    });





};

that.bodyParser = function(){

    return function(req, res, next){
        if (req._body) return next();
        if(req.method != "POST"){
            next();
            return;
        }

        var buffer = [];
        var bodyLen = 0;
        var len = 0;
        req.on('data', function(chunk){ buffer.push(chunk); bodyLen += chunk.length; });
        req.on('end', function() {
            if (buffer.length && Buffer.isBuffer(buffer[0])) {

                var body = new Buffer(bodyLen);
                var i = 0;
                buffer.forEach(function (chunk) {
                    chunk.copy(body, i, 0, chunk.length);
                    i += chunk.length
                });
                req.body = body;
                req._rawBody = body;

            }
            next();
        });


    };
};

module.exports = that;