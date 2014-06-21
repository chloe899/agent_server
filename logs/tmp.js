//window.onerror=function(){return true;};
String.prototype.trim = function() {
    return this.replace(/(^\s+)|(\s+$)/g, "");
}
function $(A){
    return document.getElementById(A)
}

function Cookie(){
    this.SetValue=function(name,value,hours,path,domain){
        var str=new String();
        var nextTime=new Date();
        nextTime.setHours(nextTime.getHours()+hours);
        str=name+"="+escape(value);
        if(hours)
            str+=";expires="+nextTime.toGMTString();
        if(path)
            str+=";path="+path;
        if(domain)
            str+=";domain="+domain;
        document.cookie=str;
    }
    this.GetValues=function(name){
        var rs=new RegExp("(^|)"+name+"=([^;]*)(;|$)","gi").exec(document.cookie),tmp;
        if(tmp=rs)
            return unescape(tmp[2]);
        return null;
    }

    this.GetValue=function(name){
        var cookies=this.GetValues("duxiu");
        if(cookies!=null){
            var arrCookie=cookies.split(",!");
            for(var i=0;i<arrCookie.length;i++){
                if((arrCookie[i].split(",=")[0])== name ){
                    return arrCookie[i].split(",=")[1];
                    break;
                }
            }
            return this.GetValues(name);
        }else{
            return this.GetValues(name);
        }

    }
}

String.prototype.replaceAll = function(search, replace){
    var regex = new RegExp(search, "g");
    return this.replace(regex, replace);
}

function selectall(box,checkboxid){
    var che;
    if(box.checked == false)
        che = false;
    else
        che =true;
    var checkbox = document.getElementsByName(checkboxid);
    for(var i = 0 ; i < checkbox.length ; i ++)
        checkbox[i].checked = che;
}

function isSearch(obj) {
    var s=$("sw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    if($("topchannel")){
        $("topchannel").value=$("topchannel").value.replaceAll("searchF","search");
        if($("topchannel").value=="searchBook"){
            $("topchannel").value = "search";
        }
    }
    if(s=='')
        return false
    else
        return true
}
function istopSearch(obj) {
    if($("topbCon").value!="y")
        $("topallsw").value="";
    var s=$("topsw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    $("topchannel").value=$("topchannel").value.replaceAll("searchF","search");
    if($("topchannel").value=="searchBook"){
        $("topchannel").value = "search";
    }
    if(s=='')
        return false
    else
        return true
}

function bSearch(fenlei){
    $("topfenleiID").value=fenlei;
    //$("topallsw").value+=" "+$("topsw").value;
    $("topbCon").value='y';
    setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
}
function seSearch(fenlei){
    $("topfenleiID").value=fenlei;
    //$("topallsw").value+=" "+$("topsw").value;
    $("topbCon").value='y';
    setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
}

function search(){
    $("topallsw").value='';
    var s=$("topsw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    $("topchannel").value=$("topchannel").value.replaceAll("searchF","search");
    if($("topchannel").value=="searchBook"){
        $("topchannel").value = "search";
    }
    if(!s=='')
        setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
}

function fsearch(){
    if($("topchannel").value=="search" || $("topchannel").value=="serchJour" || $("topchannel").value=="searchStd" || $("topchannel").value=="searchCP" || $("topchannel").value=="searchPatent"){
        if($("topchannel").value=="search"){
            $("topchannel").value="searchFBook";
        }else{
            $("topchannel").value="searchF"+$("topchannel").value.replaceAll("search","");
        }
        $("topuserinput").action="/gosearch.jsp";
        $("topallsw").value='';
        var s=$("topsw").value.trim();
        var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
        s=s.replaceAll(patrn,"");
        if(!s=='')
            setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
    }
}

function topsubmit(tag,servlet,tempservlet){
    var s=$("topsw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    if(s==""){
        changeTag(tag,servlet,tempservlet);
        return;
    }
    $("topchannel").value=tempservlet;
    $("topuserinput").action="gosearch.jsp";
    setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
}
function changeTag(tag,servlet,tempservlet){
    if(dftag==""){
        document.getElementById("me_"+servlet).style.display='none';
        document.getElementById("me_"+servlet+'_1').style.display='';
    }else{
        if(dftag!=tag){
            document.getElementById("me_"+servlet).style.display='none';
            document.getElementById("me_"+servlet+'_1').style.display='';
            document.getElementById(dftag).style.display='';
            document.getElementById(dftag+'_1').style.display='none';
        }
    }
    dftag="me_"+servlet;
    switch(servlet){
        case "search":{
            $("topuserinput").action="search";
            $("topchannel").value=tempservlet;
            break;
        }
        case "goqw.jsp":{
            $("topuserinput").action="/goqw.jsp";
            $("topchannel").value=tempservlet;
            break;
        }
        default:{
            $("topuserinput").action="gosearch.jsp";
            $("topchannel").value=tempservlet;
            break;
        }
    }
}
//----------
function bottomSearch(){
    $("topsw").value = $("bottomsw").value
    $("topallsw").value='';
    var s=$("topsw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    $("topchannel").value=$("topchannel").value.replaceAll("searchF","search");
    if(!s=='')
        setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
}

function bottomfSearch(){
    if($("topchannel").value=="search" || $("topchannel").value=="serchJour" || $("topchannel").value=="searchStd" || $("topchannel").value=="searchCP" || $("topchannel").value=="searchPatent"){
        if($("topchannel").value=="search"){
            $("topchannel").value="searchFBook";
        }else{
            $("topchannel").value="searchF"+$("topchannel").value.replaceAll("search","");
        }
        $("topuserinput").action="/gosearch.jsp";
        $("topallsw").value='';
        $("topsw").value = $("bottomsw").value
        var s=$("topsw").value.trim();
        var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
        s=s.replaceAll(patrn,"");
        if(!s=='')
            setAction($("topuserinput"),"www.duxiu.com");$("topuserinput").submit();
    }
}
function isbottomSearch(obj) {
    if($("bottombCon").value!="y")
        $("bottomallsw").value="";
    var s=$("bottomsw").value.trim();
    var patrn="\\||\\!|\\@|\\#|\\$|\\%|\\^|\\&|\\*|\\(|\\)|\\_|\\+|\\-|\\}|\\{|\\/|\\.|\\,|\\?|\\>|\\<|\\~|\\、|\\】|\\【|\\‘|\\；|\\’|\\、|\\。|\\，|\\￥|\\……|\\）|\\（|\\！";
    s=s.replaceAll(patrn,"");
    if(s=='')
        return false
    else
        return true
}
function bottomSeSearch(fenlei){
    $("bottomfenleiID").value=fenlei;
    //$("bottomallsw").value+=" "+$("bottomsw").value;
    $("bottombCon").value='y';
    if($("bottomsw").value!="")
        setAction($("bottominput"),"www.duxiu.com");$("bottominput").submit();
}
//----------
favPoster=function(A){function B(F,G,E){if(E){B(F,E)}if(F&&G&&typeof G=="object"){for(var D in G){F[D]=G[D]}}return F}function C(){var D=document.createElement("form");D.style.display="none";B(D,A,{method:"post",target:"_blank"});document.body.appendChild(D);D.addItem=function(G,E){var F=document.createElement("input");F.name=G;F.value=E;D.appendChild(F)};return D}return{list:function(){this.f=f=C();return{addItem:function(G,D){if(!D){if(!this.k){this.k=0}var F="f["+(this.k++)+"]";for(var E in G){f.addItem([F+"."+E],G[E])}}else{for(var E in G){f.addItem(E,G[E])}}}}}setAction(,open:function(){this.f,"www.duxiu.com");,open:function(){this.f.submit();document.body.removeChild(this.f)}}}

    var fav_poster;
    function checkSub_new(obj){

        fav_poster = new favPoster({
            action : 'http://202.121.241.70:8089/mylib.duxiu.com/a/f.action',
            method :'post',
            target : '_blank'
        });

        var check=0;
        var list = fav_poster.list();
        for (var i = 0; i < obj.b.length; i++) {
            if (obj.b[i].checked == true) {
                list.addItem({
                    title: document.getElementById("title" + i).value.replaceAll("<font color=Red>","").replaceAll("</font>",""),
                    url: document.getElementById("url" + i).value,
                    dxid: document.getElementById("dxid" + i).value,
                    memo: document.getElementById("memo" + i).value.replaceAll("<font color=Red>","").replaceAll("</font>","")
                });
                check++;
            }
        }
        list.addItem({
            ec : 'gbk'
        },true);

        if(check>0)
            fav_poster.open();
        else
            alert("请选择要收藏的内容");
        return false;
    }

    function subAdd_new(id){
        document.getElementById("titlefav").value=document.getElementById("title"+id).value.replaceAll("<font color=Red>","").replaceAll("</font>","");
        document.getElementById("urlfav").value=document.getElementById("url"+id).value;
        document.getElementById("memofav").value=document.getElementById("memo"+id).value.replaceAll("<font color=Red>","").replaceAll("</font>","");
        if(document.getElementById("dxid"+id))
            document.getElementById("dxidfav").value=document.getElementById("dxid"+id).value;
        setAction($("fav_one"),"www.duxiu.com");$("fav_one").submit();
    }

    var starobj,isdb=false;

    function dbclick(){
        isdb=true;
    }
    function recordobj(e){
        //starobj=event.srcElement;
//	starobj = event.srcElement || window.event.target;
        e = window.event || e;
        starobj = e.srcElement || e.target;
    }
    function showselect(e){
        var str="";
        e = window.event || e;
        var ex=e.clientX,ey=e.clientY;
        var srcel = e.srcElement || e.target;
        if(srcel.tagName!="IMG" && srcel.tagName!="A" && srcel.tagName!="INPUT" && !isdb && starobj.tagName!="IMG" && starobj.tagName!="A" && starobj.tagName!="INPUT"){
            //	var oText=document.selection.createRange();
            var oText,wordSearh;
            if (document.selection){
                oText = document.selection.createRange();wordSearh=oText.text;
            }else if (window.getSelection){
                oText = window.getSelection();wordSearh=oText.toString();
            }else if (document.getSelection){
                oText = document.getSelection();wordSearh=oText.toString();
            } else
                wordSearh = '';

            if(wordSearh.length>0){
                if(wordSearh.length>30)
                    str=wordSearh.substring(0,30);
                else
                    str=wordSearh;
            }
//		oText.select();
        }
        searchduxiu(str,ex,ey)
        isdb=false;
    }
    function searchduxiu(str,ex,ey){
        var obj;
        if(document.getElementById("searchduxiu"))
            obj=document.getElementById("searchduxiu");
        else{
            adddiv();
            obj=document.getElementById("searchduxiu");
        }
        if(str.length>0){
            obj.style.display="block";
            obj.style.position="absolute";
            obj.style.zindex=999;

            obj.style.top=(document.documentElement.scrollTop+ey)+'px';
            obj.style.left=(document.documentElement.scrollLeft+ex+5)+'px';
            obj.style.widht=80;

            var curl=location.href;
            curl=curl.substring(7,curl.indexOf("duxiu"));
            curl=curl.substring(curl.indexOf(".")+1);
            if(curl.indexOf("www")==-1 && curl.indexOf("edu")==-1)
                curl="";

            obj.innerHTML="<div style='height:20px;width:65px;'><a target=_blank href='http://qw."+curl+"duxiu.com/getPage?sw="+encodeURIComponent(str)+"&ecode=utf-8'><img src=\"images/hcico.gif\"  border=\"0\"></a><div>";
        }else{
            obj.style.display="none";
        }
    }
    function adddiv(){
        var mobj = document.createElement("div");
        mobj.id="searchduxiu";
        document.body.appendChild(mobj);
    }
//创建一个div
    function CreatDiv(){
        this.id="newDiv";
        this.width='100px';
        this.height='10px';
        this.backgroundColor='#FFFFFF';
        this.border='1px solid #83ABE9';
        this.top='0px';
        this.left='0px';
        this.position='absolute';
        this.filter="alpha(opacity=100)"
        this.innerHTML="";
    }
    CreatDiv.prototype.setId = function(id){
        this.id=id;
    }
    CreatDiv.prototype.setWidth = function(width){
        this.width=width;
    }
    CreatDiv.prototype.setHeight = function(height){
        this.height=height;
    }
    CreatDiv.prototype.setBgc = function(color){
        this.backgroundColor=color;
    }
    CreatDiv.prototype.setBorder = function(border){
        this.border=border;
    }
    CreatDiv.prototype.setTop = function(top){
        this.top=top;
    }
    CreatDiv.prototype.setLeft = function(left){
        this.left=left;
    }
    CreatDiv.prototype.setInnerHtml = function(innerHTML){
        this.innerHTML=innerHTML;
    }
    CreatDiv.prototype.setFilter = function(filter){
        this.filter=filter;
    }
    CreatDiv.prototype.getDiv = function(){

        var newDIV=document.createElement("div");
        newDIV.id=this.id;
        newDIV.style.width=this.width;
        newDIV.style.height=this.height;
        newDIV.style.backgroundColor=this.backgroundColor;
        newDIV.style.border=this.border;
        newDIV.style.top=this.top;
        newDIV.style.left=this.left;
        newDIV.style.position=this.position;
        newDIV.innerHTML=this.innerHTML;
        newDIV.style.filter=this.filter;
        document.body.appendChild(newDIV);
    }

    function showMore(e){
        if(document.getElementById("morediv"))
            return;
        var div = new CreatDiv();
        div.setBorder('1px solid #83ABE9');
        var e = window.event || e;
        var ex=e.clientX,ey=e.clientY;
        div.setId("morediv");
        div.setTop(ey+10);
        div.setLeft(ex-10);
        div.setWidth(80);
        div.setHeight("auto");

        div.setInnerHtml($("morelist").innerHTML);
        div.getDiv();
    }
    function listgotop(lid,sname,chaname){
        var topInfo =	gotop(lid,sname,chaname,sname);
        var topchaName=topInfo.substring(0,topInfo.indexOf("-"));
        topInfo=topInfo.substring(topInfo.indexOf("-")+1);
        $(lid).innerHTML="&nbsp;<a onClick=\"listgotop('"+lid+"','"+topInfo+"','"+topchaName+"');\" href=\"#\">"+topchaName+"</a>";
        divclose();
    }
    function showMoreTop(e){
        if(document.getElementById("morediv"))
            return;
        var div = new CreatDiv();
        div.setBorder('1px solid #83ABE9');
        var e = window.event || e;
        var ex=e.clientX,ey=e.clientY;
        div.setId("morediv");
        div.setTop(ey+10);
        div.setLeft(ex-10);
        div.setWidth(65);
        div.setHeight("auto");

        div.setInnerHtml("<div style=\"width:28px;height:14px;position:relative;left:43px;top:3px;font-size:12px;\"><a onclick='divclose();' href=\"#\"><img border=0 src='images/divclose.gif'></a></div>"
            +"<ul style=\"list-style-type:none ; text-align:left; margin:0; padding:0; line-height:18px; font-size:13px;\">"
            +"<li  id=\"more_1\">&nbsp;<a onClick=\"topsubmit('','searchgnbz','searchgnbz');\" href=\"#\">标&nbsp;准</a></li>"
            +"<li id=\"more_2\">&nbsp;<a onClick=\"topsubmit('','searchzl','searchzl');\" href=\"#\">专&nbsp;利</a></li></ul>");
        div.getDiv();
    }
    function divclose(){
        document.body.removeChild(document.getElementById("morediv"));
    }