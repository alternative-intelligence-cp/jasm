function Register(){
    let buffer = new ArrayBuffer(8);
    let asU8 = new Uint8Array(buffer,0,1);
    let asU16 = new Uint16Array(buffer,0,1);
    let asU32 = new Uint32Array(buffer,0,1);
    let asU64 = new BigUint64Array(buffer,0,1);
    let asI8 = new Int8Array(buffer,0,1);
    let asI16 = new Int16Array(buffer,0,1);
    let asI32 = new Int32Array(buffer,0,1);
    let asI64 = new BigInt64Array(buffer,0,1);
    let asF16 = new Float16Array(buffer,0,1);
    let asF32 = new Float32Array(buffer,0,1);
    let asF64 = new Float64Array(buffer,0,1);

    this.getValue = function(type){
        switch(type.toUpperCase()){
            case "U8":
                return asU8[0];
            case "U16":
                return asU16[0];
            case "U32":
                return asU32[0];
            case "U64":
                return asU64[0];
            case "I8":
                return asI8[0];
            case "I16":
                return asI16[0];
            case "I32":
                return asI32[0];
            case "I64":
                return asI64[0];
            case "F16":
                return asF16[0];
            case "F32":
                return asF32[0];
            case "F64":
                return asF64[0];
            default:
                console.error("invalid type: " + type);
                return null;
        }
    };
    this.setValue = function(type,value){
        switch(type.toUpperCase()){
            case "U8":
                asU8[0]=value;
                break;
            case "U16":
                asU16[0]=value;
                break;
            case "U32":
                asU32[0]=value;
                break;
            case "U64":
                asU64[0]=value;
                break;
            case "I8":
                asI8[0]=value;
                break;
            case "I16":
                asI16[0]=value;
                break;
            case "I32":
                asI32[0]=value;
                break;
            case "I64":
                asI64[0]=value;
                break;
            case "F16":
                asF16[0]=value;
                break;
            case "F32":
                asF32[0]=value;
                break;
            case "F64":
                asF64[0]=value;
                break;
            default:
                console.error("invalid type: " + type);
                return false;
        }
        return true;
    };
    this.incValue = function(type,amount=1){
        switch(type.toUpperCase()){
            case "U8":
                asU8[0] += amount;
                break;
            case "U16":
                asU16[0] += amount;
                break;
            case "U32":
                asU32[0] += amount;
                break;
            case "U64":
                asU64[0] += amount;
                break;
            case "I8":
                asI8[0] += amount;
                break;
            case "I16":
                asI16[0] += amount;
                break;
            case "I32":
                asI32[0] += amount;
                break;
            case "I64":
                asI64[0] += amount;
                break;
            case "F16":
                asF16[0] += amount;
                break;
            case "F32":
                asF32[0] += amount;
                break;
            case "F64":
                asF64[0] += amount;
                break;
            default:
                console.error("invalid type: " + type);
                return false;
        }
        return true;
    };
    this.decValue = function(type,amount=1){
        switch(type.toUpperCase()){
            case "U8":
                asU8[0] -= amount;
                break;
            case "U16":
                asU16[0] -= amount;
                break;
            case "U32":
                asU32[0] -= amount;
                break;
            case "U64":
                asU64[0] -= amount;
                break;
            case "I8":
                asI8[0] -= amount;
                break;
            case "I16":
                asI16[0] -= amount;
                break;
            case "I32":
                asI32[0] -= amount;
                break;
            case "I64":
                asI64[0] -= amount;
                break;
            case "F16":
                asF16[0] -= amount;
                break;
            case "F32":
                asF32[0] -= amount;
                break;
            case "F64":
                asF64[0] -= amount;
                break;
            default:
                console.error("invalid type: " + type);
                return false;
        }
        return true;
    };
}
function Registers(){
    this.RO1=new Register(); //operation operand 1 saved
    this.RO2=new Register(); //operation operand 2 saved  
    this.RO3=new Register(); //operation result clobber
    this.RS1=new Register(); //user saved
    this.RS2=new Register(); //user saved
    this.RS3=new Register(); //user saved
    this.RS4=new Register(); //user saved
    this.RS5=new Register(); //user saved
    this.RS6=new Register(); //user saved
    this.RS7=new Register(); //user saved 
    this.RS8=new Register();//user saved
    this.RC1=new Register(); //user clobber
    this.RC2=new Register(); //user clobber
    this.RC3=new Register(); //user clobber
    this.RC4=new Register(); //user clobber
    this.RC5=new Register(); //user clobber
    this.RC6=new Register(); //user clobber
    this.RC7=new Register(); //user clobber
    this.RC8=new Register(); //user clobber
    this.PRG=new Register(); //program counter
    this.SPT=new Register(); //stack pointer
    this.FPT=new Register(); //frame pointer
    this.FLG=new Register(); //flags
    this.ERR=new Register();  //error
    this.map = function(name){
        switch(name.toUpperCase()){
            case "RO1": return this.RO1;
            case "RO2": return this.RO2;
            case "RO3": return this.RO3;
            case "RC1": return this.RC1;
            case "RC2": return this.RC2;
            case "RC3": return this.RC3;
            case "RC4": return this.RC4;
            case "RC5": return this.RC5;
            case "RC6": return this.RC6;
            case "RC7": return this.RC7;
            case "RC8": return this.RC8;
            case "RS1": return this.RS1;
            case "RS2": return this.RS2;
            case "RS3": return this.RS3;
            case "RS4": return this.RS4;
            case "RS5": return this.RS5;
            case "RS6": return this.RS6;
            case "RS7": return this.RS7;
            case "RS8": return this.RS8;
            case "FLG": return this.FLG;
            case "PRG": return this.PRG;
            case "SPT": return this.SPT;
            case "FPT": return this.FPT;
            case "ERR": return this.ERR;
            default: return null;
        }
    }
    this.mapGet = function(name,type){
        let r = this.map(name);
        if(r != null){
            return r.getValue(type);
        }
        return null;
    };
    this.mapSet = function(name,type,value){
        let r = this.map(name);
        if(r != null){
            return r.setValue(type,value);
            return true;
        }
        return false;
    };
}
export {Register,Registers};

////////////////////////////////////////////////////////////////////////////////
/* let regs = new Registers(256);
regs.mapSet("RO1","I32",34);
console.log(regs.mapGet("RO1","I32"));  */