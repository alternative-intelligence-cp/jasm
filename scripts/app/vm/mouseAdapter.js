import { BusAdapter as BusAdapter } from "./bus.js";

function MouseAdapter(bus) {
    let busAdapter = new BusAdapter(bus, 256);
    let mem = busAdapter.sharedMemory;
    let x_addr = 0; //x position
    let y_addr = 4; //y position
    let s_addr = 8; //scroll position
    let l_addr = 12; //left mouse button state
    let m_addr = 9; //middle mouse button state
    let r_addr = 10; //right mouse button state
    let e1_addr = 11; //extra button 1 state
    let e2_addr = 12; //extra button 2 state
    this.mouseMove = function (x, y) {
        mem.setUint32(x_addr, 1, x);
        mem.setUint32(y_addr, 1, y);
    };
    this.scrollUp = function (amount) {
        let pos = mem.getUint32(s_addr, 1);
        let new_pos = pos + amount;
        mem.setUint32(s_addr, 1, new_pos);
        busAdapter.sendMsg(JSON.stringify({
            sender: busAdapter.getId(),
            target: "ALL",
            type: "EVENT",
            name: "scroll_up",
            data: {
                amount: amount,
                position: new_pos
            }
        }));
    };
    this.scrollDown = function (amount) {
        let pos = mem.getUint32(s_addr, 1);
        let new_pos = pos - amount;
        mem.setUint32(s_addr, 1, new_pos);
        busAdapter.sendMsg(JSON.stringify({
            sender: busAdapter.getId(),
            target: "ALL",
            type: "EVENT",
            name: "scroll_down",
            data: {
                amount: amount,
                position: new_pos
            }
        }));
    };
    this.mouseDown = function (button) {
        let btn;
        if (typeof button == 'string') { button = button.toUpperCase() };
        switch (button) {
            case 1:
                btn = 1;
                mem.setUint8(l_addr, 1, 1);
                break;
            case 2:
                btn = 2;
                mem.setUint8(m_addr, 1, 1);
                break;
            case 3:
                btn = 3;
                mem.setUint8(r_addr, 1, 1);
                break;
            case 4:
                btn = 4;
                mem.setUint8(e1_addr, 1, 1);
                break;
            case 5:
                btn = 5;
                mem.setUint8(e2_addr, 1, 1);
                break;
            default:
                console.error("invalid button: " + button);
                return;
        };
        busAdapter.sendMsg(JSON.stringify({
            sender: busAdapter.getId(),
            target: "ALL",
            type: "EVENT",
            name: "mouse_down",
            data: btn
        }));
    };
    this.mouseUp = function (button) {
        let btn;
        switch (button) {
            case 1:
                btn = 1;
                mem.setUint8(l_addr, 1, 0);
                break;
            case 2:
                btn = 2;
                mem.setUint8(m_addr, 1, 0);
                break;
            case 3:
                btn = 3;
                mem.setUint8(r_addr, 1, 0);
                break;
            case 4:
                btn = 4;
                mem.setUint8(e1_addr, 1, 0);
                break;
            case 5:
                btn = 5;
                mem.setUint8(e2_addr, 1, 0);
                break;
            default:
                console.error("invalid button: " + button);
                return;
        };
        busAdapter.sendMsg(JSON.stringify({
            sender: busAdapter.getId(),
            target: "ALL",
            type: "EVENT",
            name: "mouse_up",
            data: btn
        }));
    };
    this.poll = function () {
        return {
            x: mem.getUint32(x_addr, 1),
            y: mem.getUint32(y_addr, 1),
            s: mem.getUint32(s_addr, 1),
            l: mem.getUint8(l_addr, 1),
            m: mem.getUint8(m_addr, 1),
            r: mem.getUint8(r_addr, 1),
            e1: mem.getUint8(e1_addr, 1),
            e2: mem.getUint8(e2_addr, 1)
        };
    }
    this.LEFT_BUTTON = 1;
    this.MIDDLE_BUTTON = 2;
    this.RIGHT_BUTTON = 3;
    this.EXTRA_1_BUTTON = 4;
    this.EXTRA_2_BUTTON = 5;
}
export default MouseAdapter;

////////////////////////////////////////////////////////////////////////////////
/* import { Bus as Bus } from "./bus.js";
let bus = new Bus();
let ma = new MouseAdapter(bus);
ma.mouseDown(1);
ma.mouseDown(ma.RIGHT_BUTTON);
ma.mouseUp(ma.LEFT_BUTTON);
ma.mouseMove(124, 234);
console.log(ma.poll()); */

