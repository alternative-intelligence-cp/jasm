
function Port(id,I,O){
    let _id = id;
    let _onMsg=()=>{};
    let _onErr=()=>{};
    let _onCtrl=()=>{};

    I.setMsgHandler(function(msg){
        _onMsg(msg);
    });
    I.setErrHandler(function(err){
        _onErr(err);
    });
    I.setCtrlHandler(function(ctrl){
        _onCtrl(ctrl);
    });
    this.getId=function(){return _id;};
    this.onErr=function(cb){
        _onErr=cb;
    };
    this.onMsg=function(cb){
        _onMsg=cb;
    };
    this.onCtrl=function(cb){
        _onCtrl=cb;
    };
    this.sendMsg=function(msg){
        O.sendMsg(msg);
    };
    this.sendErr=function(err){
        O.sendErr(err);
    };
    this.sendCtrl=function(ctrl){
        O.sendCtrl(ctrl);
    };
}

function PortManager(){
    let ports = {};
    let next_id = 0;
    let _onMsg = function(port,msg){console.log("port[" + port + "] --> sent a message: " + msg);};
    let _onErr = function(port,err){console.error("ports[" + port + "] --> sent an error: " + err);};
    let _onCtrl = function(port,ctrl){console.log("ports[" + port + "] --> sent a control message: " + ctrl);};
    this.createPort = function(){
        let id = next_id;
        next_id++;
        ports[id] = {
            oput:{},
            iput:{
                onMsg:function(port,msg){
                    _onMsg(port,msg);
                },
                onErr:function(port,err){
                    _onErr(port,err);
                },
                onCtrl:function(port,ctrl){
                    _onCtrl(port,ctrl);
                }
            }
        }
        let I = {
            setMsgHandler:function(cb){
                ports[id].oput.sendMsg=cb;
            },
            setErrHandler:function(cb){
                ports[id].oput.sendErr=cb;
            },
            setCtrlHandler:function(cb){
                ports[id].oput.sendCtrl=cb;
            }
        };
        let O = {
            sendMsg:function(msg){
                ports[id].iput.onMsg(id,msg);
            },
            sendErr:function(err){
                ports[id].iput.onErr(id,err);
            },
            sendCtrl:function(ctrl){
                ports[id].iput.onCtrl(id,ctrl);
            }
        };

        return new Port(id,I,O);
    };
    this.getPort = function(id){
        return ports[id] || null;
    };
    this.sendMsg=function(portId,msg){
        let port = this.getPort(portId);
        if(port != null){
            port.oput.sendMsg(msg);
            return true;
        }
        return false;
    };
    this.sendErr=function(portId,err){
        let port = this.getPort(portId);
        if(port != null){
            port.oput.sendErr(err);
            return true;
        }
        return false;
    };
    this.sendCtrl=function(portId,ctrl){
        let port = this.getPort(portId);
        if(port != null){
            port.oput.sendCtrl(ctrl);
            return true;
        }
        return false;
    }
    this.onMsg=function(cb){
        _onMsg=cb;
    };
    this.onErr=function(cb){
        _onErr=cb;
    };
    this.onCtrl=function(cb){
        _onCtrl=cb;
    };
}
export default PortManager;

////////////////////////////////////////////////////////////////////////////////
/*
//get port from system

let pm = new PortManager();
let port = pm.createPort();
port.onMsg(function(msg){console.log("port " + port.getId() + " --> got a message: " + JSON.stringify(msg));});
port.onErr(function(msg){console.log("port " + port.getId() + " --> got an error: " + JSON.stringify(msg));});
port.onCtrl(function(msg){console.log("port " + port.getId() + " --> got a control signal: " + JSON.stringify(msg));});
port.sendMsg("message");
port.sendErr("error");
port.sendCtrl("control");
pm.sendMsg(0,"message");
pm.sendErr(0,"error");
pm.sendCtrl(0,"control");
pm.onMsg(function(port,msg){console.log("port " + port + " is still the same but I changed the handler lol: " + msg)});
port.sendMsg("message");
*/