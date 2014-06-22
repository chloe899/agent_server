
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
    if($ && $.post){
      var originPost = $.post;
      var args = arguments;


    }


});