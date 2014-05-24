

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


