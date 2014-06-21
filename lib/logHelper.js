/*
 * author: mars
 *
 * help to use log class easy
 * create time: 2011-07-26 星期二 17:23:38
 */
var fs = require("fs");
var Log = require('log');
var LogExt = require('./logExt');

exports.getLogger = function (level, stream) {
    if(typeof(stream) == "string"){
        var path = stream;
        stream = fs.createWriteStream(path,{model:"0644"});
    }
    return new LogExt(new Log(level, stream));
};