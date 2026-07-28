
function Memory(size){
    let mem = new ArrayBuffer(size);
    let view = new DataView(mem);
    
    this.buffer = mem;

    this.setUint8 = function(address, number, values){
        if(number == 1){ 
            view.setUint8(address, values);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setUint8(address + i, values[i]);
            }
        }
        return true;
    };
    this.setUint16 = function(address, number, values){
        if(number == 1){ 
            view.setUint16(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setUint16(address + (i * 2), values[i], true);
            }
        }
        return true;
    };
    this.setUint32 = function(address, number, values){
        if(number == 1){ 
            view.setUint32(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setUint32(address + (i * 4), values[i], true);
            }
        }
        return true;
    };
    this.setUint64 = function(address, number, values){
        if(number == 1){ 
            view.setBigUint64(address, BigInt(values), true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setBigUint64(address + (i * 8), BigInt(values[i]), true);
            }
        }
        return true;
    };
    this.setInt8 = function(address, number, values){
        if(number == 1){ 
            view.setInt8(address, values);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setInt8(address + i, values[i]);
            }
        }
        return true;
    };
    this.setInt16 = function(address, number, values){
        if(number == 1){ 
            view.setInt16(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setInt16(address + (i * 2), values[i], true);
            }
        }
        return true;
    };
    this.setInt32 = function(address, number, values){
        if(number == 1){ 
            view.setInt32(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setInt32(address + (i * 4), values[i], true);
            }
        }
        return true;
    };
    this.setInt64 = function(address, number, values){
        if(number == 1){ 
            view.setBigInt64(address, BigInt(values), true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setBigInt64(address + (i * 8), BigInt(values[i]), true);
            }
        }
        return true;
    };
    this.setFlt32 = function(address, number, values){
        if(number == 1){ 
            view.setFloat32(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setFloat32(address + (i * 4), values[i], true);
            }
        }
        return true;
    };
    this.setFlt64 = function(address, number, values){
        if(number == 1){ 
            view.setFloat64(address, values, true);
        } else {
            for (let i = 0; i < number && i < values.length; i++) {
                view.setFloat64(address + (i * 8), values[i], true);
            }
        }
        return true;
    };

    this.getUint8 = function(address, number=1){
        if(number == 1){ 
            return view.getUint8(address);
        }
        let arr = new Uint8Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getUint8(address + i);
        return arr;
    };
    this.getUint16 = function(address, number=1){
        if(number == 1){ 
            return view.getUint16(address, true);
        }
        let arr = new Uint16Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getUint16(address + (i * 2), true);
        return arr;
    };
    this.getUint32 = function(address, number=1){
        if(number == 1){ 
            return view.getUint32(address, true);
        }
        let arr = new Uint32Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getUint32(address + (i * 4), true);
        return arr;
    };
    this.getUint64 = function(address, number=1){
        if(number == 1){ 
            return view.getBigUint64(address, true);
        }
        let arr = new BigUint64Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getBigUint64(address + (i * 8), true);
        return arr;
    };
    this.getInt8 = function(address, number=1){
        if(number == 1){ 
            return view.getInt8(address);
        }
        let arr = new Int8Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getInt8(address + i);
        return arr;
    };
    this.getInt16 = function(address, number=1){
        if(number == 1){ 
            return view.getInt16(address, true);
        }
        let arr = new Int16Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getInt16(address + (i * 2), true);
        return arr;
    };
    this.getInt32 = function(address, number=1){
        if(number == 1){ 
            return view.getInt32(address, true);
        }
        let arr = new Int32Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getInt32(address + (i * 4), true);
        return arr;
    };
    this.getInt64 = function(address, number=1){
        if(number == 1){ 
            return view.getBigInt64(address, true);
        }
        let arr = new BigInt64Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getBigInt64(address + (i * 8), true);
        return arr;
    };
    this.getFloat32 = function(address, number=1){
        if(number == 1){ 
            return view.getFloat32(address, true);
        }
        let arr = new Float32Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getFloat32(address + (i * 4), true);
        return arr;
    };
    this.getFloat64 = function(address, number=1){
        if(number == 1){ 
            return view.getFloat64(address, true);
        }
        let arr = new Float64Array(number);
        for(let i = 0; i < number; i++) arr[i] = view.getFloat64(address + (i * 8), true);
        return arr;
    };
    this.getSize = function(){
        return size;
    };
}
export default Memory;
