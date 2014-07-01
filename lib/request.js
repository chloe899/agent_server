var http = require("http");
var urlUtil = require("url");
var log = require("./logHelper").getLogger();
var that = {};

function buildRequest(options, callback){
    var param = {};
    var url = options.url;
    var headers = options.headers;
    var uri = urlUtil.parse(url);
    param.hostname = uri.hostname;
    if (uri.path) {
        param.path = uri.path
    } else {
        param.path = uri.pathname + (uri.search || "");
    }
    param.port = uri.port || 80;
    param.headers  = options.headers;

    var req = http.request(param, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var bufferArr = [];
        var len = 0;
        res.on('data', function (chunk) {
            bufferArr.push(chunk);
            len += chunk.length;
        });
        res.on('end', function(){
            var buffer = Buffer.concat(bufferArr, len);
            res.body = buffer;
            log.debug("buffer len is %s", len);
           callback(null, res, buffer);
        });
    });

    req.on('error', function(e) {
        log.debug(e);
        callback(e);
    });


    req.write('');
    req.end();


}


that.get = function(options, callback){

    buildRequest(options, callback);


};


module.exports  = that;