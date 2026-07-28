import { BusAdapter as BusAdapter } from "./bus.js";

function KeyboardAdapter(bus){
    let busAdapter = new BusAdapter(bus,256);
    let mem = busAdapter.sharedMemory;

    this.key_down = function(keycode){
        mem.setUint8(keycode,1,1);
        busAdapter.sendMsg(JSON.stringify({
            sender:busAdapter.getId(),
            target:"ALL",
            type:"EVENT",
            name:"key_down",
            data:keycode
        }));
    };
    this.key_up = function(keycode){
        mem.setUint8(keycode,1,0);
        busAdapter.sendMsg(JSON.stringify({
            sender:busAdapter.getId(),
            target:"ALL",
            type:"EVENT",
            name:"key_up",
            data:keycode
        }));
    };
    this.poll=function(){
        return new Uint8Array(mem.getUint8(0,256));
    };
}
export default KeyboardAdapter;

////////////////////////////////////////////////////////////////////////////////
/* import { Bus as Bus } from "./bus.js";
let bus = new Bus();
let kb = new KeyboardAdapter(bus);

kb.key_down(4);
kb.key_down(6);
kb.key_down(7);
kb.key_up(7);
console.log(kb.poll()) */