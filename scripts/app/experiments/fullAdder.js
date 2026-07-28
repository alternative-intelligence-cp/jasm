#!/usr/bin/env node
((args)=>{
    if(process.argv.length >= 4) { //node, script path, 1st arg, second arg
         let arg1 = Number.parseInt(process.argv[2]);
         let arg2 = Number.parseInt(process.argv[3]);
         let divisor=128;
         for(let i = 0; i < 8; i++){
            args.a[i]= Math.floor(arg1 / divisor);
            if(args.a[i] != 0){
                arg1 -= divisor;
            }
            divisor = divisor / 2;
         }
         divisor=128;
         for(let i = 0; i < 8; i++){
            args.b[i]= Math.floor(arg2 / divisor);
            if(args.b[i] != 0){
                arg2 -= divisor;
            }
            divisor = divisor / 2;
         }
    }
    let carry = 0;
    let out = [0,0,0,0,0,0,0,0];
    let outStr = "";
    for(let i = args.a.length - 1; i >= 0; i--){
        if (args.a[i] | args.b[i]){ // Either set to 1
            if(args.a[i] & args.b[i]){ //both set to 1
                if(carry){ //both set to 1 with carry
                    out[i]=1;
                    carry = 1;
                } else { //both set to 1 no carry
                    out[i]=0;
                    carry=1;
                }
            } else {//either set to 1 but not both
                if(carry){ //either set to 1 but not both and carry set
                    out[i]=0;
                    carry=1;
                } else { //either set to 1 but not both and carry not set
                    out[i]=1;
                    carry=0;
                }
            }
        } else { //neither set to 1
            if(carry){ //neither set to 1 but carry set
                out[i]=1;
                carry=0;
            } else { //neither set to 1 and carry not set
                out[i]=0;
            }
        }  
    }
    if(carry){//add extra bit for carry as MSB (most significant byte) to output string
        outStr += "1";
    }
    for(let i = 0; i < out.length;i++){ //add bytes from MSB to LSB (least significant byte) to output string
        let char = out[i] == 0 ? "0" : "1";
        outStr += char;
    }

    //print output stirng
    console.log(outStr);

})({///// INPUT ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //used if no args provided on command line
    a: [1,0,1,0,1,0,1,0],
    b: [1,0,1,0,1,0,1,0]
});