var iconv = require("iconv-lite");
var textUtil = require("../lib/text-util");
var log = require("../lib/logHelper").getLogger();
var charsetDetector = require("node-icu-charset-detector");




var buffer = "测试";
buffer = iconv.encode(buffer, "gbk");

var buffer1 = "测试";
buffer1 = iconv.encode(buffer1, "utf8");

//var e = textUtil.getTrueEncoding(buffer);
//log.debug("encoding is %s", e);


var e1  = charsetDetector.detectCharset(buffer1);
var e  = charsetDetector.detectCharset(buffer);

log.debug("encoding is %s", e.toString());
log.debug("encoding is %s", e1.toString());


var e3 = textUtil.isUTF8Encoding(buffer);
var e4 = textUtil.isUTF8Encoding(buffer1);
log.debug("encoding is %s", e3.toString());
log.debug("encoding is %s", e4.toString());

