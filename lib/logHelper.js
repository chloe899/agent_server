/*
 * author: mars
 *
 * help to use log class easy
 * create time: 2011-07-26 星期二 17:23:38
 */

var Log = require('log');
var LogExt = require('./logExt');

exports.getLogger = function (level, stream) {
	return new LogExt(new Log(level, stream));
};