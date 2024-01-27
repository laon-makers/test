
Note: As of May 17,2020: it is no longer seperately used. It has been moved into login.html.


const WIFI_CMD_LOGIN_TSID_REQ          = 1;
//const INVALID_USER_WIFI_STATUS         = 0xFF;
const UNKNOWN_USER__USR_ST             = 0x86;
const MAX_NOF_USER_IN_STORAGE          = 3;

class WifiUsers {
    constructor() {
        this.id = UNKNOWN_USER__USR_ST; //INVALID_USER_WIFI_STATUS;
        this.name = '';
        this.pw = '';
    }
};

var waitingRspId = 0;            
var maxTimerRptCnt;
var myRspTimer;
var xmlQueryCnt = 0;
var xmlResponse;

let users = [];
let tsid = new Uint16Array(1);
let lgiCode = new Uint16Array(1);
let key = new Uint8Array(2);
let failcnt = 0;

var xmlHttp = new CreateXmlHttpObject();
var $ = function(id) { return document.getElementById(id);}


function CreateXmlHttpObject() {
    var xHttp;
    if(window.XMLHttpRequest){
        xHttp = new XMLHttpRequest();
    }else{
        xHttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
    return xHttp;
}


function ClearReqRespondTimer() {
    if (xmlQueryCnt === maxTimerRptCnt) {
        clearInterval(myRspTimer);
        xmlQueryCnt = 10 + maxTimerRptCnt;
        setButtonByIdx(waitingRspId, false, true);
        waitingRspId = 0;
    }
}


var handleServerResponse = function() {
    if( xmlHttp.readyState == 4 && xmlHttp.status == 200 ){
        var message = "";
        if (xmlQueryCnt <= maxTimerRptCnt) {
            //if( xmlHttp.responseXML ) $('msgwin').innerHTML = "No responseXML found!";
            if (xmlHttp.responseXML) $('msgwin').textContent = "No responseXML found!";
                        
            xmlResponse = xmlHttp.responseXML;
                        
            xmldoc = xmlResponse.getElementsByTagName('rlt');
                        
            //if (xmldoc[0].innerHTML.toString() === 'ok') { // got rid of toString() since it doesn't work in IE.
            //if (xmldoc[0].firstChild.nodeValue === 'ok') {
            if (xmldoc[0].textContent === 'ok') {
                var cmd;
                var sel;
                var n, i, ln;

                xmldoc = xmlResponse.getElementsByTagName('cmd');
                //cmd = xmldoc[0].innerHTML.toString(); // got rid of toString() since it doesn't work in IE.
                cmd = parseInt(xmldoc[0].textContent); //firstChild.nodeValue;

                switch (cmd) {
                    case WIFI_CMD_LOGIN_TSID_REQ:
                        //sel = $('user');
                        xmldoc = xmlResponse.getElementsByTagName('tsid');
                        tsid[0] = parseInt(xmldoc[0].textContent, 16);

                        xmldoc = xmlResponse.getElementsByTagName('gx1');
                        key[0] = parseInt(xmldoc[0].textContent);
                        xmldoc = xmlResponse.getElementsByTagName('gx2');
                        key[1] = parseInt(xmldoc[0].textContent);

                        if (xmlQueryCnt < maxTimerRptCnt) xmlQueryCnt = maxTimerRptCnt;                        

                        ShowResult("  It is ready !", true);
                        
                        setButtonByIdx(1, false, false);

                        break;

                    default:
                        break;
                }
            //} else if (xmldoc[0].innerHTML.toString() === 'ng') {
            } else if (xmldoc[0].textContent === 'ng') { // replaced innerHTML.toString() with firstChild.nodeValue for IE.
                            
                message = "   Failed !";
                xmlQueryCnt = maxTimerRptCnt;
                xmldoc = xmlResponse.getElementsByTagName('cmd');
                setButtonByIdx(1, false, false);
                
                ShowResult(message, false);

                xmldoc = xmlResponse.getElementsByTagName('err');
                            
                if (xmldoc == undefined) {
                    message = "Error Code: n/a";
                } else {
                    cmd = xmldoc[0].textContent;
                    message = "Error Code: " + cmd;
                }

            } else {
                message = "   please wait! count: " + xmlQueryCnt;
            }
        } else {
            message = "   please try it again !";
        }

        //$('msgwin').innerHTML = message;
        $('msgwin').textContent = message;

        ClearReqRespondTimer();
    }
}



var reqRespond = function() {
    if( xmlHttp.readyState === 0 || xmlHttp.readyState === 4 ){
        if (xmlQueryCnt < maxTimerRptCnt) {
            var cnt;
            var arg;
            xmlQueryCnt++;
            cnt = maxTimerRptCnt - xmlQueryCnt;
            arg = '/xml?ULGI=' + waitingRspId + '&NOFU=' + users.length + '&CDN=' + cnt; //.toString(16).toUpperCase();
            xmlHttp.open('PUT',arg,true);
            xmlHttp.onreadystatechange = handleServerResponse;
            xmlHttp.send(null);
            
        } else {
            ClearReqRespondTimer();
        }
    }
}

var startReqRespond = function(cmd, tInt) {
            
    if (waitingRspId === 0) {
        if (cmd > 0) {
            waitingRspId = cmd;
            myRspTimer = setInterval(reqRespond, tInt);
            return 0;
        }
    } else $('msgwin').textContent = "There is a pending command " + waitingRspId;

    return 1;
}

var restartReqResponse = function (cmd, tIntv, rpt) {
    var r;
    maxTimerRptCnt = rpt;
    xmlQueryCnt = 0;

    r = startReqRespond(cmd, tIntv);

    if (r == 0) id = setButtonByIdx(cmd, true, true);
    else id = setButtonByIdx(cmd, false, true);
}


var initMsgWindow = function () {
    $('resultMsg').innerHTML = "";
    $('msgwin').innerHTML = "";
}

function ShowResult(msg, pass) {
    var r = $('resultMsg');
    if (pass == true) {
        r.style.color = 'green';
    } else {
        r.style.color = 'red';
    }
    r.innerHTML = msg;

    //$('msgwin').style.fontcolor('red');
    //$('resultMsg').innerHTML = "<span style='color:red'>Update Failed!</span>";
}

function initPageOnLoad() {
    let j, cnt = 0;

    if (typeof (Storage) !== "undefined") {
        
        if (localStorage.userCount) {
            let i, n, uid, idl;

            uid = localStorage.getItem('uid');

            if (uid !== null) {
                cnt = parseInt(localStorage.userCount);

                if (cnt === 1) {

                    n = localStorage.getItem('name');

                    if (n !== null) {

                        users[0] = new WifiUsers();
                        users[0].id = parseInt(uid);
                        users[0].name = n;

                        n = localStorage.getItem('pw');

                        if (n !== null) {
                            users[0].pw = n;
                        }
                    }
                } else if (cnt > 1) {

                    idl = uid.split(',');

                    for (i = 0; i < idl.length; i++) {
                        n = localStorage.getItem(idl[i] + "_name");
                        if (n !== null) {
                            users[i] = new WifiUsers();
                            users[i].id = parseInt(idl[i]);
                            users[i].name = n;

                            n = localStorage.getItem(idl[i] + "_pw");
                            if (n !== null) {
                                users[i].pw = n;
                            }

                            //if (i < MAX_NOF_USER_IN_STORAGE) {
                            //    $('un' + i.toString()).innerHTML = users[i].name;
                            //    $('usr' + i.toString()).value = users[i].id;
                            //}
                        }
                    }
                }

                //for (i = 0; i < cnt; i++) {
                //    if (i >= MAX_NOF_USER_IN_STORAGE) break;
                //    $('un' + i.toString()).innerHTML = users[i].name;
                //    $('usr' + i.toString()).innerHTML = users[i].id;
                //}
                //$('un' + i.toString()).innerHTML = users[i].name;
                ////pw.value = '';



                //if (cnt < 2) {
                //    let j = MAX_NOF_USER_IN_STORAGE - 1;
                //    for (i = 1; i < j; i++) {
                //        $('un' + i.toString()).style.display = 'none';
                //        $('usr' + i.toString()).hidden = true;
                //    }
                //}


            } else $('uname').disabled = false;

            //if (cnt > 0) {
            //    $('uname').value = users[0].name;
            //} else {
            //    //$('un' + i.toString()).innerHTML = "admin";
            //    //pw.value = '';
            //    $('usr0').checked = true;
            //    $('un1').style.display = 'none';
            //    $('usr1').hidden = true;
            //}

        } else {
            $('msgwin').innerHTML = "Info: no valid user in the localStorage !";
            $('uname').disabled = false;
        }

        restartReqResponse(WIFI_CMD_LOGIN_TSID_REQ, 1000, 3);

    } else {
        $('msgwin').innerHTML = "Info: this browser doesn't support 'localStorage'";

        //$('usr0').checked = true;
        //$('un1').style.display = 'none';
        //$('usr1').hidden = true;
    }

    if (cnt > 0) {
        $('uname').value = users[0].name;
        $('usr0').checked = true;
        for (i = 0; i < cnt; i++) {
            if (i >= MAX_NOF_USER_IN_STORAGE) break;
            $('un' + i.toString()).innerHTML = users[i].name;
            $('usr' + i.toString()).innerHTML = users[i].id;
        }
    } else {
        //$('usr2').checked = true;
        $('un1').style.display = 'none';
        $('usr1').hidden = true;
    }

    j = MAX_NOF_USER_IN_STORAGE - 1;
    for (i = cnt; i < j; i++) {
        $('un' + i.toString()).style.display = 'none';
        $('usr' + i.toString()).hidden = true;
    }
}

function SendLoginKey(e) {
    let i, j, id, n, dt, str, nm;
    
    if (!e) {
        e = window.event; // for IE
        e.returnValue = false;
    } else {
        e.preventDefault();
    }

    initMsgWindow();

    //if (waitingRspId == 0) {

    if (typeof (Storage) !== 'undefined') {

        if (localStorage.userCount) {
            
            n = parseInt(localStorage.userCount);

            if (n > 0) {
                nm = $('uname').value;
                for (i = 0; i < users.length; i++) {
                    if (nm === users[i].name) break;
                }

                if (i < users.length) {

                    if (n == 1) {
                        str = localStorage.getItem('codeGrp' + key[0].toString());
                        if (str !== null) {
                            dt = str.toString().split(',');

                            i = (tsid[0] >> 8) & 0xFF;
                            lgiCode[0] = (parseInt(dt[i].toString())) << 8;

                            str = localStorage.getItem('codeGrp' + key[1].toString());

                            if (str !== null) {
                                dt = str.toString().split(',');

                                i = tsid[0] & 0xFF;
                                lgiCode[0] += (parseInt(dt[i].toString()));

                                $('keycode').value = lgiCode[0].toString(16).toUpperCase();

                                $('tmpid').value = tsid[0].toString(16).toUpperCase();
                            }
                        }
                    } else if (n > 0) {
                        //id = localStorage.getItem('uid');

                        //if (id != null) {
                        //    idl = id.split(',');
                        //    if (idl != null) {
                        //        //nm = $('uname').value;
                        //        for (i = 0; i < idl.length; i++) {
                        //            if (nm === localStorage.getItem(idl[i] + '_name')) break;
                        //        }

                        //        if (i < idl.length) {
                        //            str = localStorage.getItem(idl[i] + '_codeGrp' + key[0].toString());
                        //            if (str !== null) {
                        //                dt = str.toString().split(',');

                        //                j = (tsid[0] >> 8) & 0xFF;
                        //                lgiCode[0] = (parseInt(dt[j].toString())) << 8;

                        //                str = localStorage.getItem(idl[i] + '_codeGrp' + key[1].toString());

                        //                if (str !== null) {
                        //                    dt = str.toString().split(',');

                        //                    j = tsid[0] & 0xFF;
                        //                    lgiCode[0] += (parseInt(dt[j].toString()));

                        //                    $('keycode').value = lgiCode[0].toString(16).toUpperCase();

                        //                    $('tmpid').value = tsid[0].toString(16).toUpperCase();
                        //                }
                        //            }
                        //        }
                        //    }
                        //}

                        str = localStorage.getItem(users[i].id.toString() + '_codeGrp' + key[0].toString());
                        if (str !== null) {
                            dt = str.toString().split(',');

                            j = (tsid[0] >> 8) & 0xFF;
                            lgiCode[0] = (parseInt(dt[j].toString())) << 8;

                            str = localStorage.getItem(users[i].id.toString() + '_codeGrp' + key[1].toString());

                            if (str !== null) {
                                dt = str.toString().split(',');

                                j = tsid[0] & 0xFF;
                                lgiCode[0] += (parseInt(dt[j].toString()));

                                $('keycode').value = lgiCode[0].toString(16).toUpperCase();

                                $('tmpid').value = tsid[0].toString(16).toUpperCase();
                            }
                        }
                    }

                    if (!($('usr2').checked || $('usr3').checked)) {

                        for (i = 0; i < users.length; i++) {
                            if (users[i].name == nm) {
                                str = $('pwd').value;
                                if (users[i].pw === str) {

                                    $('pwd').disabled = true; // not to send.
                                    $('pwd').value = '';      // just in case.

                                    $('uid').value = users[i].id.toString(16);
                                } else i = users.length;

                                break;
                            }
                        }

                        if (i >= users.length) {

                            if (failcnt < 5) {

                                failcnt++;

                                ShowResult("  Wrong password (" + failcnt.toString() + " times) ! Please try again.", false);
                                //setButtonByIdx(1, false, false);
                                $('pwd').value = '';
                            } else {
                                ShowResult("  Login Failed (wrong password more than 5 times) !", false);
                                $('smit').disabled = true;
                            }

                        } else if (failcnt < 5) {
                            $('uname').disabled = true; // not to send.
                            $('keycode').disabled = false;

                            $('login').submit();

                            $('uname').disabled = false;
                            //$('pwd').value = str;
                            $('pwd').disabled = false;

                            $('uid').value = '';
                        }

                        return;
                    }
                }
            }
        }
        
    } else $('msgwin').innerHTML = "Warning: this browser doesn't support 'localStorage'";    
    
    $('uname').disabled = false;
    $('uid').disabled = true; // not to send.
    $('keycode').disabled = true;
    
    $('login').submit();

    $('uid').disabled = false;
    ShowResult("  Login Failed !", false); // if no direction due to failure, this message will notify login failure.
}


function radioBtnClick(e) {
    let un = $('uname');
    let pw = $('pwd');

    if (e == '2') {
        un.value = '';
        pw.value = '';
        $('smit').disabled = false;
        $('uname').disabled = false;
        $('pwd').disabled = false;
    } else if (e == '3') {
        ////$('msgwin').innerHTML = "User 2 clicked";
        //$('uname').disabled = true;
        //$('pwd').disabled = true;
        ////var c = document.getElementsByClassName('idpw');
        ////for (let i = 0; i < c.length - 1; i++) {
        ////    c[i].style.display = 'none';
        ////}

        un.value = "admin"; //$('un2').innerHTML;
        pw.value = "admin";
        $('smit').disabled = false;
        $('uname').disabled = true;
        $('pwd').disabled = false;
    } else {
        ////$('msgwin').innerHTML = "User 1 clicked";
        //$('uname').disabled = false;
        //$('pwd').disabled = false;
        ////var c = document.getElementsByClassName('idpw');
        ////for (let i = 0; i < c.length - 1; i++) {
        ////    c[i].style.display = 'block'; //'none'
        ////}
        un.value = $('un'+ e).innerHTML;
        pw.value = '';
        $('uname').disabled = true;
        $('pwd').disabled = false;
    }
}

// Do NOT change the order of 'case' unless you know what you are doing.
function setButtonByIdx(idx, bDis, bBrk) {
    switch(idx) {
    case 1:
        $("smit").disabled = bDis;
        //if (bBrk == false) break;
        if (bBrk == true) break;
    //case 2:
    //    $("readUser").disabled = bDis;
    //    //if (bBrk == false) break;
    //    if (bBrk == true) break;    
        break;
    default:
        idx = 0;
        break;
    }
    return idx;
}

function CheckDataValidation(tbl, bFormat, cmd) {
    //var msg = $('resultMsg');
                
    var v;
    var bVd = true;
                        
    return true;
}

