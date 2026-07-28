import Memory from "./memory.js";
function Stack(size,stackPointerRegister,framePointerRegister){
    if(size <= 0 || size % 8 != 0){
        console.error("invalid size '" + size + "',size must be a postive number that is a multiple of 8");
    }
    let mem = new Memory(size);
    let stp = stackPointerRegister;
    let frp = framePointerRegister;

    this.push = function(type,value){
        let ptr = this.getStackPointer();
        if(ptr + 8 > size){
            console.error("stack is full");
            return false; 
        }
        switch(type.toUpperCase()){
            case "U8":
                mem.setUint8(ptr,1,value);
                break;
            case "U16":
                mem.setUint16(ptr,1,value);
                break;
            case "U32":
                mem.setUint32(ptr,1,value);
                break;
            case "U64":
                mem.setUint64(ptr,1,value);
                break;
            case "I8":
                mem.setInt8(ptr,1,value);
                break;
            case "I16":
                mem.setInt16(ptr,1,value);
                break;
            case "I32":
                mem.setInt32(ptr,1,value);
                break;
            case "I64":
                mem.setInt64(ptr,1,value);
                break;
            case "F16":
                mem.setFlt16(ptr,1,value);
                break;
            case "F32":
                mem.setFlt32(ptr,1,value);
                break;
            case "F64":
                mem.setFlt64(ptr,1,value);
                break;
            default:
                console.error("Invalid value for type: " + type);
                return false;
        }
        this.setStackPointer(ptr + 8);
        return true;
    };
    this.pop = function(type){
        let res;
        let ptr = this.getStackPointer()-8;
        if(ptr < 0){
            console.error("stack is empty");
            return null;
        }
        switch(type.toUpperCase()){
            case "U8":
            res = mem.getUint8(ptr);
            break;
        case "U16":
            res = mem.getUint16(ptr);
            break;
        case "U32":
            res = mem.getUint32(ptr);
            break;
        case "U64":
            res = mem.getUint64(ptr);
            break;
        case "I8":
            res = mem.getInt8(ptr);
            break;
        case "I16":
            res = mem.getInt16(ptr);
            break;
        case "I32":
            res = mem.getInt32(ptr);
            break;
        case "I64":
            res = mem.getInt64(ptr);
            break;
        case "F16":
            res = mem.getFlt16(ptr);
            break;
        case "F32":
            res = mem.getFlt32(ptr);
            break;
        case "F64":
            res = mem.getFlt64(ptr);
            break;
        default:
            console.error("Invalid value for type: " + type);
            return false;
        }
        this.setStackPointer(ptr);
        return res;
    };
    this.peek = function(type){
        let res;
        let ptr = stp.getValue("U32") - 8;
        if(ptr < 0){
            console.error("stack is empty");
            return null;
        }
        switch(type.toUpperCase()){
            case "U8":
            res = mem.getUint8(ptr);
            break;
        case "U16":
            res = mem.getUint16(ptr);
            break;
        case "U32":
            res = mem.getUint32(ptr);
            break;
        case "U64":
            res = mem.getUint64(ptr);
            break;
        case "I8":
            res = mem.getInt8(ptr);
            break;
        case "I16":
            res = mem.getInt16(ptr);
            break;
        case "I32":
            res = mem.getInt32(ptr);
            break;
        case "I64":
            res = mem.getInt64(ptr);
            break;
        case "F16":
            res = mem.getFlt16(ptr);
            break;
        case "F32":
            res = mem.getFlt32(ptr);
            break;
        case "F64":
            res = mem.getFlt64(ptr);
            break;
        default:
            console.error("Invalid value for type: " + type);
            return false;
        }
        return res;
    };
    this.getStackPointer = function(){
        return stp.getValue("U32");
    };
    this.getFramePointer = function(){
        return frp.getValue("U32");
    };
    this.setStackPointer = function(stackAddress){
        if(stackAddress % 8 !== 0){
            console.error("Invalid stack address '" + stackAddress + "', address must be a multiple of 8");
            return false;
        }
        if(stackAddress < 0 || stackAddress >= size){
            console.error("Stack address '" + stackAddress + "' out of bounds. Min address: 0, Max address: " + (size - 1));
            return false;
        }
        return stp.setValue("U32",stackAddress)
    };
    this.setFramePointer = function(stackAddress){
        if(stackAddress % 8 !== 0){
            console.error("Invalid stack address '" + stackAddress + "', address must be a multiple of 8");
            return false;
        }
        if(stackAddress < 0 || stackAddress >= size){
            console.error("Stack address '" + stackAddress + "' out of bounds. Min address:0, Max address: " + (size - 1));
            return false;
        }
        return frp.setValue("U32",stackAddress);
    };

}
export default Stack;

////////////////////////////////////////////////////////////////////////////////
/* import { Registers as Registers } from "./registers";
let registers = new Registers();
let stk = new Stack(1024,registers.SPT,registers.FPT);

stk.push("U32",29);
stk.push("U8",33);
console.log("peek U8: " + stk.peek("U8"));
console.log("pop U8: " + stk.pop("U8"));
console.log("pop U32: " + stk.pop("U32")); */