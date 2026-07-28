import PortManager from "./port.js";
import Memory from "./memory.js";

function BusAdapter(bus,sharedMemSize){
    let connected = false;
    let memory = new Memory(sharedMemSize);
    let connection = bus.connectDevice(memory);
    if(connection != null){
        connection.onMsg((msg)=>{
            switch(msg.toUpperCase()){
                default:
                    console.log("[Device " +connection.getId() + "] Recieved msg from bus: " + msg);
                    break;
            }
        });
        connection.onErr((err)=>{
            switch(err.toUpperCase()){
                default:
                    console.error("[Device " +connection.getId() + "] Recieved error from bus: " + err);
                    break;
            }
        });
        connection.onCtrl((ctrl)=>{
            switch(ctrl.toUpperCase()){
                case "CONNECTED": 
                    connected = true;
                    console.warn("[Device " + connection.getId() + "] successfully connected to bus");
                    break;
                default:
                    console.warn("[Device " +connection.getId() + "] Recieved control message from bus: " + ctrl);
                    break;
            }
            
        });
        connection.sendCtrl("connect");
    }
    this.sendMsg = connection.sendMsg;
    this.sendErr = connection.sendErr;
    this.sendCtrl = connection.sendCtrl;
        this.onMsg = function(cb) {
        connection.onMsg(cb);
    };
    this.onErr = connection.onErr;
    this.onCtrl = connection.onCtrl;
    this.sharedMemory = memory;
    this.getId = connection.getId;
}

function Bus(){
    const pm = new PortManager();
    let devices = {};
    let interruptHandler = null;
        let msgHandler = function(port,msg){
        try {
            let data = JSON.parse(msg);
            let target = data.target;
            
            if (target === "ALL") {
                if (interruptHandler) interruptHandler(port, msg);
                for (let id in devices) {
                    if (id != port) {
                        pm.sendMsg(id, msg);
                    }
                }
            } else {
                if (target === "CPU") {
                    if (interruptHandler) interruptHandler(port, msg);
                } else if (devices[target]) {
                    pm.sendMsg(target, msg);
                }
            }
        } catch(e) {
            console.log("recieved non-json message '" + msg + "' from device : " + port);
            if (interruptHandler) interruptHandler(port, msg);
        }
    };
    let errHandler = function(port,err){
        switch(err.toUpperCase()){
            default:
                console.error("recieved error '" + err + "' from device : " + port);
                break;
        }
    };
    let ctrlHandler = function(port,ctrl){
        switch(ctrl.toUpperCase()){
            case "CONNECT":
                console.warn("recieved 'CONNECT' from device: " + port);
                pm.sendCtrl(port,"CONNECTED");
                break;
            default:
                console.warn("recieved control message '" + ctrl + "' from device : " + port);
                break;
        }
    };
    pm.onMsg(msgHandler);
    pm.onErr(errHandler);
    pm.onCtrl(ctrlHandler);
    let currentOffset = 0;
    this.connectDevice = function(sharedMem){
        let port = pm.createPort();
        let id = port.getId();
        let size = (sharedMem && sharedMem.getSize) ? sharedMem.getSize() : 256;
        devices[id]={
            id: id,
            port:port,
            mem:sharedMem,
            baseOffset: currentOffset,
            size: size
        };
        currentOffset += size;
        return {
            getId:port.getId,
            onMsg:port.onMsg,
            onErr:port.onErr,
            onCtrl:port.onCtrl,
            sendMsg:port.sendMsg,
            sendErr:port.sendErr,
            sendCtrl:port.sendCtrl
        };
    }
    this.getDeviceMem = function(id){
        if (devices[id]) {
            return devices[id].mem;
        }
        return null;
    }
    this.resolveDeviceAddress = function(offset) {
        for (let id in devices) {
            let dev = devices[id];
            if (offset >= dev.baseOffset && offset < dev.baseOffset + dev.size) {
                return { devId: dev.id, localOffset: offset - dev.baseOffset };
            }
        }
        return null;
    }
    this.onInterrupt = function(cb) {
        interruptHandler = cb;
    }
}
export {BusAdapter,Bus};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* let bus = new Bus(64);
let busDevice = new BusAdapter(bus,1024);

busDevice.sendMsg("yo yo yo");
busDevice.sendErr("ya ya ya");
busDevice.sendCtrl("ye ye ye"); */
