var net = require("net");
var log = require('./lib/logHelper').getLogger();

function test(req){
    var options = {
        allowHalfOpen: true,
        readable: true,
        writable: true
    };
    var socket = new net.Socket(options);
    var port = 80;
    var host = "www.baidu.com";
    var data = "GET / HTTP/1.0\nAccept:text/*\n\n";

    var client = net.connect({port: 80,host:host},
        function() { //'connect' listener
            console.log('client connected');
            client.write(data);

        });
    var bufferArr = [];
    var len = 0;
    client.on('data', function(data) {
        bufferArr.push(data);
        len += data.length;
    });
    client.on('end', function() {
        var buffer  = Buffer.concat(bufferArr,len);
        req.connection.write(buffer);
    });
}

/*
 socket.on("data", function(data){
 console.log("data is %s", data);

 });

 socket.on("error", function(data){
 log.debug("error is %s", data);

 });
 */


/*socket.write(data, "ASCII");
 socket.end();*/

