
function setAction(form, host){
    var action = form.action;
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

        action = "/" + host + "/" + action;
    }
    form.action = action;


}