
function setAction(form){
    var action = form.getAttribute("action");
    var host = window._agent_base_host;
    if(!host){
        return;
    }

    action = action || "";
    action = action.toLowerCase();
    host = host.toLowerCase();
    var pathReg = /http(s)?:\/\/[^/]+(.*)/;
    var pathResult = pathReg.exec(action);
    var path = pathResult && pathResult[2];
    if(path){
        action = path;
    }
    if(action.indexOf("/") == 0 && action.indexOf(host) == -1){
        action = "/" + host  + action;
        form.setAttribute("action", action);
    }



}

(function(){
    function getProxyHost(path){
        var pathname = path ||  location.pathname;
        var reg = /\/[^\/]+/;
        var host = reg.exec(pathname);
        host  = host && host[0];
        if(host && /\./.test(host)){
            host = host.replace(/^\//,"");
        }
        return host;


    }
    var $ = window.$;

    if($ && $.ajax){
        var o = $.ajax;
        if(o){
            function fun(){
                var args = Array.prototype.slice.call(arguments);
                var options = args[0];
                var fun;
                if(options.url){
                    var urlHost = getProxyHost(options.url);
                    if(!urlHost && options.url.indexOf("/") == 0){
                        var pathHost =getProxyHost();
                        if(pathHost){
                            options.url = "/" + pathHost + urlHost;
                        }
                    }

                }
                o.apply($, args);

            }
            $.ajax = fun;

        }



    }


})();