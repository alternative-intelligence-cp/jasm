import { Bus as Bus } from "./bus.js";
import { BusAdapter as BusAdapter } from "./bus.js";
import EventManager from "./event.js";
import Memory from "./memory.js";
import PortManager from "./port.js";
import { Registers as Registers } from "./registers.js";
import Stack from "./stack.js";

class VM {
    constructor() {
        this.PROG_SIZE = 24576
        this.MEM_SIZE = 24576;
        this.STACK_SIZE = 16384;
        
        this.events = new EventManager();
        this.registers = new Registers();
        this.memory = new Memory(this.MEM_SIZE);
        this.stack = new Stack(this.STACK_SIZE, this.registers.SPT, this.registers.FPT);
        this.bus = new Bus();
        this.program = []; // Using an array of structured instructions for now until Assembler handles binary output
        this.loaded = false;
        this.running = false;
        this.interval = null;
        this.interruptVector = 0;

        this.bus.onInterrupt((port, msg) => {
            if (this.running) {
                let senderId = 0;
                try {
                    let parsed = JSON.parse(msg);
                    senderId = parsed.sender;
                } catch(e) {}
                this.interrupted = true; 
                this.interruptVector = senderId;
            }
        });

        this.events.addEvent("started");
        this.events.addEvent("loaded");
        this.events.addEvent("step");
        this.events.addEvent("error");
        this.events.addEvent("halt");
        this.events.addEvent("done");
        this.events.addEvent("reset");
        this.events.addEvent("print");

        this.listenEvent = this.events.listenEvent;
        this.ignoreEvent = this.events.ignoreEvent;
        this.getEvents = this.events.getEvents;
        
        this.OPS = {
            NOP:0, SET:1, MOV:2, LOD:3, STR:4, INC:5, DEC:6, CMP:7, PSH:8, POP:9, 
            AND:10, IOR:11, XOR:12, NOT:13, NOR:14, ADD:15, SUB:16, MUL:17, DIV:18, MOD:19, 
            CAL:20, RET:21, JMP:22, JIE:23, JNE:24, JGT:25, JLT:26, JGE:27, JLE:28, SYS:29
        };
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    load(payload) {
        if (payload.data) {
            this.memory = new Memory(this.MEM_SIZE);
            this.memory.setUint8(0, payload.data.length, payload.data);
        }
        if (payload.text) {
            let buffer = payload.text.buffer || payload.text;
            let byteOffset = payload.text.byteOffset || 0;
            let byteLength = payload.text.byteLength || payload.text.length;
            this.programBuffer = buffer.slice(byteOffset, byteOffset + byteLength);
            this.programView = new DataView(this.programBuffer);
            this.programLength = byteLength / 16;
        }
        this.reset();
        this.loaded = true;
        this.events.raiseEvent("loaded", this.programLength);
    }
    
    start(mode) {
        if (!this.loaded) {
            this.events.raiseEvent("error", "Cannot start VM without loaded program.");
            return;
        }
        this.running = true;
        this.events.raiseEvent("started", mode);
        
        if (mode === "run") {
            this.run();
        } else if (mode === "step") {
            this.step();
            this.events.raiseEvent("step", this._getStats());
            this.running = false;
        }
    }
    
    halt() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.events.raiseEvent("halt");
    }
    
    reset() {
        this.halt();
        for (let i = 0; i < 25; i++) {
            this.registers.mapSet(this._getRegString(i), "U64", 0n);
        }
        // Force the PRG counter step trigger by emitting it manually or we wait for next step
        this.events.raiseEvent("reset");
    }
    
    _getTypeString(id) {
        const types = ["U8","U16","U32","U64","I8","I16","I32","I64","F16","F32","F64"];
        return types[id] || "U32";
    }
    
    _getRegString(id) {
        const regs = [
            "RO1","RO2","RO3","RS1","RS2","RS3","RS4","RS5","RS6","RS7","RS8",
            "RC1","RC2","RC3","RC4","RC5","RC6","RC7","RC8","PRG","SPT","FPT","FLG","ERR"
        ];
        return regs[id] || "RO1";
    }

    step() {   
        if (this.interrupted && (this.registers.mapGet("FLG", "U32") & 8)) {
            this.interrupted = false;
            let prg = this.registers.mapGet("PRG", "U32");
            let flg = this.registers.mapGet("FLG", "U32");
            
            // Push FLG and PRG to stack
            this.stack.push("U32", flg);
            this.stack.push("U32", prg);
            
            // Clear IE flag (bit 3)
            this.registers.mapSet("FLG", "U32", flg & ~8);
            
            // Jump to ISR Vector (address from IVT)
            let ivtBase = this.registers.mapGet("IVT", "U32");
            let isrAddr = this._memGet(ivtBase + (this.interruptVector * 4), "U32");
            
            this.registers.mapSet("PRG", "U32", isrAddr);
            return true;
        }

        let prg = this.registers.mapGet("PRG", "U32");
        if (prg >= this.programLength) {
            this.halt();
            this.events.raiseEvent("done", this.registers.mapGet("RO3", "I32") || 0);
            return false;
        }
        
        let offset = prg * 16;
        let op = this.programView.getUint8(offset);
        let typeId = this.programView.getUint8(offset + 1);
        let reg1 = this.programView.getUint8(offset + 2);
        let reg2 = this.programView.getUint8(offset + 3);
        let val = this.programView.getFloat64(offset + 4, true);

        let typeStr = this._getTypeString(typeId);
        let r1Str = this._getRegString(reg1);
        let r2Str = this._getRegString(reg2);

        this._executeInstruction(op, typeStr, r1Str, r2Str, val);
        
        // Auto increment PRG if it wasn't modified by a jump
        if (this.registers.mapGet("PRG", "U32") === prg) {
            this.registers.mapSet("PRG", "U32", prg + 1);
        }
        
        return true;
    }
    
    run() {
        if (this.interval) clearInterval(this.interval);
        
        let lastReport = performance.now();
        this.interval = setInterval(() => {
            if (this.running) {
                // Execute a batch of instructions to balance performance and unblocking event loop
                for (let i = 0; i < 25000; i++) {
                    if (!this.running) break;
                    this.step();
                }
                
                // Throttle UI updates to roughly ~20 FPS (50ms) to prevent freezing
                let now = performance.now();
                if (this.running && now - lastReport > 50) {
                    this.events.raiseEvent("step", this._getStats());
                    lastReport = now;
                }
            } else {
                clearInterval(this.interval);
            }
        }, 0);
    }

    _getStats() {
        return {
            PRG: this.registers.mapGet("PRG", "U32"),
            RO1: this.registers.mapGet("RO1", "I32"),
            RO2: this.registers.mapGet("RO2", "I32"),
            RO3: this.registers.mapGet("RO3", "I32")
        };
    }

    _executeInstruction(op, type, reg1, reg2, val) {
        switch(op) {
            case this.OPS.NOP:
                break;
            case this.OPS.SET:
                this.registers.mapSet(reg1, type, val);
                break;
            case this.OPS.MOV:
                this.registers.mapSet(reg1, type, this.registers.mapGet(reg2, type));
                break;
            case this.OPS.ADD:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) + this.registers.mapGet("RO2", type));
                break;
            case this.OPS.SUB:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) - this.registers.mapGet("RO2", type));
                break;
            case this.OPS.MUL:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) * this.registers.mapGet("RO2", type));
                break;
            case this.OPS.DIV:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) / this.registers.mapGet("RO2", type));
                break;
            case this.OPS.MOD:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) % this.registers.mapGet("RO2", type));
                break;
            case this.OPS.INC:
                this.registers.mapSet(reg1, type, this.registers.mapGet(reg1, type) + 1);
                break;
            case this.OPS.DEC:
                this.registers.mapSet(reg1, type, this.registers.mapGet(reg1, type) - 1);
                break;
            case this.OPS.AND:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) & this.registers.mapGet("RO2", type));
                break;
            case this.OPS.IOR:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) | this.registers.mapGet("RO2", type));
                break;
            case this.OPS.XOR:
                this.registers.mapSet("RO3", type, this.registers.mapGet("RO1", type) ^ this.registers.mapGet("RO2", type));
                break;
            case this.OPS.NOT:
                this.registers.mapSet("RO3", type, ~this.registers.mapGet("RO1", type));
                break;
            case this.OPS.NOR:
                this.registers.mapSet("RO3", type, ~(this.registers.mapGet("RO1", type) | this.registers.mapGet("RO2", type)));
                break;
            case this.OPS.CMP:
                {
                    let v1 = this.registers.mapGet(reg1, type);
                    let v2 = this.registers.mapGet(reg2, type);
                    let flg = 0;
                    if (v1 === v2) flg |= 1; // EQUAL
                    if (v1 > v2) flg |= 2; // GREATER
                    if (v1 < v2) flg |= 4; // LESS
                    this.registers.mapSet("FLG", "U32", flg);
                }
                break;
            case this.OPS.JMP:
                this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JIE:
                if (this.registers.mapGet("FLG", "U32") & 1) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JNE:
                if (!(this.registers.mapGet("FLG", "U32") & 1)) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JGT:
                if (this.registers.mapGet("FLG", "U32") & 2) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JLT:
                if (this.registers.mapGet("FLG", "U32") & 4) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JGE:
                if (this.registers.mapGet("FLG", "U32") & 3) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.JLE:
                if (this.registers.mapGet("FLG", "U32") & 5) this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.LOD:
                this.registers.mapSet(reg1, type, this._memGet(this.registers.mapGet(reg2, "U32"), type));
                break;
            case this.OPS.STR:
                this._memSet(this.registers.mapGet(reg2, "U32"), type, this.registers.mapGet(reg1, type));
                break;
            case this.OPS.PSH:
                this.stack.push(type, this.registers.mapGet(reg1, type));
                break;
            case this.OPS.POP:
                this.registers.mapSet(reg1, type, this.stack.pop(type));
                break;
            case this.OPS.CAL:
                this.stack.push("U32", this.registers.mapGet("PRG", "U32"));
                this.registers.mapSet("PRG", "U32", val);
                break;
            case this.OPS.RET:
                this.registers.mapSet("PRG", "U32", this.stack.pop("U32"));
                break;
            case this.OPS.SYS:
                this._sys();
                break;
            case 35: // IRET
                this.registers.mapSet("PRG", "U32", this.stack.pop("U32"));
                this.registers.mapSet("FLG", "U32", this.stack.pop("U32"));
                break;
            default:
                console.warn(`Unimplemented opcode: ${op}`);
                break;
        }
    }

    _sys() {
        let callNum = this.registers.mapGet("RO1", "U32");
        switch(callNum) {
            case 0: // PRINT INT
                this.events.raiseEvent("print", this.registers.mapGet("RO3", "I32"));
                break;
            case 1: // EXIT
                this.halt();
                this.events.raiseEvent("done", this.registers.mapGet("RO3", "I32"));
                break;
            case 2: // PRINT STRING
                let len = this.registers.mapGet("RS1", "U32");
                let addr = this.registers.mapGet("RS2", "U32");
                let str = "";
                if (len === 0) {
                    let i = 0;
                    while (true) {
                        let c = this.memory.getUint8(addr + i);
                        if (c === 0) break;
                        str += String.fromCharCode(c);
                        i++;
                    }
                } else {
                    for(let i=0; i<len; i++){
                        str += String.fromCharCode(this.memory.getUint8(addr + i));
                    }
                }
                this.events.raiseEvent("print", str);
                break;
            default:
                console.warn(`Unimplemented sys call: ${callNum}`);
                break;
        }
    }

    _memGet(address, type) {
        if (address >= 0x10000) {
            let resolved = this.bus.resolveDeviceAddress(address - 0x10000);
            if (resolved) {
                let devMem = this.bus.getDeviceMem(resolved.devId);
                let offset = resolved.localOffset;
                if (devMem) {
                    switch(type.toUpperCase()){
                        case "U8": return devMem.getUint8(offset);
                        case "U16": return devMem.getUint16(offset);
                        case "U32": return devMem.getUint32(offset);
                        case "U64": return devMem.getUint64(offset);
                        case "I8": return devMem.getInt8(offset);
                        case "I16": return devMem.getInt16(offset);
                        case "I32": return devMem.getInt32(offset);
                        case "I64": return devMem.getInt64(offset);
                        case "F16": return devMem.getFloat16(offset);
                        case "F32": return devMem.getFloat32(offset);
                        case "F64": return devMem.getFloat64(offset);
                        default: return 0;
                    }
                }
            }
            return 0; // Unmapped memory
        }

        switch(type.toUpperCase()){
            case "U8": return this.memory.getUint8(address);
            case "U16": return this.memory.getUint16(address);
            case "U32": return this.memory.getUint32(address);
            case "U64": return this.memory.getUint64(address);
            case "I8": return this.memory.getInt8(address);
            case "I16": return this.memory.getInt16(address);
            case "I32": return this.memory.getInt32(address);
            case "I64": return this.memory.getInt64(address);
            case "F16": return this.memory.getFloat16(address);
            case "F32": return this.memory.getFloat32(address);
            case "F64": return this.memory.getFloat64(address);
            default: return 0;
        }
    }

    _memSet(address, type, value) {
        if (address >= 0x10000) {
            let resolved = this.bus.resolveDeviceAddress(address - 0x10000);
            if (resolved) {
                let devMem = this.bus.getDeviceMem(resolved.devId);
                let offset = resolved.localOffset;
                if (devMem) {
                    switch(type.toUpperCase()){
                        case "U8": devMem.setUint8(offset, 1, value); break;
                        case "U16": devMem.setUint16(offset, 1, value); break;
                        case "U32": devMem.setUint32(offset, 1, value); break;
                        case "U64": devMem.setUint64(offset, 1, value); break;
                        case "I8": devMem.setInt8(offset, 1, value); break;
                        case "I16": devMem.setInt16(offset, 1, value); break;
                        case "I32": devMem.setInt32(offset, 1, value); break;
                        case "I64": devMem.setInt64(offset, 1, value); break;
                        case "F16": devMem.setFlt16(offset, value); break; // Memory.js typo setFlt16
                        case "F32": devMem.setFlt32(offset, 1, value); break;
                        case "F64": devMem.setFlt64(offset, 1, value); break;
                    }
                }
            }
            return;
        }

        switch(type.toUpperCase()){
            case "U8": this.memory.setUint8(address, 1, value); break;
            case "U16": this.memory.setUint16(address, 1, value); break;
            case "U32": this.memory.setUint32(address, 1, value); break;
            case "U64": this.memory.setUint64(address, 1, value); break;
            case "I8": this.memory.setInt8(address, 1, value); break;
            case "I16": this.memory.setInt16(address, 1, value); break;
            case "I32": this.memory.setInt32(address, 1, value); break;
            case "I64": this.memory.setInt64(address, 1, value); break;
            case "F16": this.memory.setFlt16(address, value); break;
            case "F32": this.memory.setFlt32(address, 1, value); break;
            case "F64": this.memory.setFlt64(address, 1, value); break;
        }
    }
}

export { VM };