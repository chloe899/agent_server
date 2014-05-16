/**
 * Created by IntelliJ IDEA.
 * User: dsiu
 * Date: 1/22/11
 * Time: 11:44 AM
 * To change this template use File | Settings | File Templates.
 */


var Log = require('log');
var util = require('util');

function padZero(number) {
  var n = String(number);
  if (number < 10) {
    return '0' + n;
  } else {
    return n;
  }
}

function pad2Zeros(number) {
  var n = String(number);
  if (number < 10) {
    return '00' + n;
  } else if (number < 100) {
    return '0' + n;
  } else {
    return n;
  }
}

var tz = new Date().toString().split(' ')[5];

function getDate() {
  var now = new Date();
  return now.getFullYear() + '-' + padZero(now.getMonth() + 1) + '-' + padZero(now.getDate()) + ' ' + tz + ' ' +
         padZero(now.getHours()) + ':' + padZero(now.getMinutes()) + ':' + padZero(now.getSeconds()) + '.' + pad2Zeros(now.getMilliseconds());
}

function getLine(module) {
  try {
    throw new Error();
  } catch(e) {
    // now magic will happen: get line number from callstack
    var line = e.stack.split('\n')[4].split(':')[1];
    return line;
  }
}

function getClass(module) {
  if (module) {
    if (module.id) {
      if (module.id == '.') {
        return 'main';
      } else {
        return module.id.replace(process.cwd(), '.');
      }
    } else {
      return module;
    }
  } else {
    return '<unknown>';
  }
}

var levelsDecor =
{
  'EMERGENCY': ['EMERGENCY', 31],
  'ALERT'    : ['ALERT    ', 32],
  'CRITICAL' : ['CRITICAL ', 36],
  'ERROR'    : ['ERROR    ', 35],
  'WARNING'  : ['WARNING  ', 34],
  'NOTICE'   : ['NOTICE   ', 30],
  'INFO'     : ['INFO     ', 33],
  'DEBUG'    : ['DEBUG    ', 37]
};

function getMessage(msg) {
  // console.log(msg)
  if (typeof msg == 'string') {
    return msg;
  }
  else {
    return util.inspect(msg, false, 10, true);
  }
}


var LogExt = exports = module.exports = function LogExt(logInstance, theirModule) {
  this.logger = logInstance;
  // this.theirModule = theirModule;
  // this.theirClass = getClass(theirModule);
};

LogExt.prototype = {
  log: function(levelStr, args) {
    var prefix = this._getLineInfo();
    this.logOrig(levelStr, prefix + ' - ', args);
  },

  logOrig: function(levelStr, prefix, args) {
    if (Log[levelStr] <= this.logger.level) {
      var i = 1;
      var orig_msg = getMessage(args[0]);
      var msg = orig_msg.replace(/%s/g, function(){
        return getMessage(args[i++]);
      });
      msg = prefix + msg;
      var decor = levelsDecor[levelStr];
      this.logger.stream.write(
          '\x1B[' + decor[1] + 'm'
              +
          '[' + getDate() + ']'
              + ' ' + decor[0]
              + '\x1B[0m' + ' '
              + msg
              + '\n'
      );
    }
  },

    _getFilePath: function (stackLine) {
        if (this.fileInfo) {
            return this.fileInfo;
        }
        var fileInfo = stackLine.replace(/^    at /, '');
        fileInfo = fileInfo.replace(/^[^(]+\(([^)]+)\)/, '$1');
        fileInfo = fileInfo.split(':')[0];
        fileInfo = fileInfo.replace(process.cwd(), '.');
        this.fileInfo = fileInfo;
        return this.fileInfo;
    },

    _getLineInfo: function () {
        var error = new Error();
        var stackLine = error.stack.split('\n')[4];
        var fileInfo = this._getFilePath(stackLine);
        return fileInfo + ':' + stackLine.split(':')[1];
    }
};

LogExt.prototype.__proto__ = Log.prototype;