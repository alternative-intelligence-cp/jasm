#!/usr/bin/env node
function VM(){
    let 
        //general registers
        RG1 = 0, //general, clobber
        RG2 = 0, //general, clobber
        RG3 = 0, //general, clobber
        RG4 = 0, //general, clobber
        RG5 = 0, //general, clobber
        RG6 = 0, //general, clobber
        RG7 = 0, //general, clobber
        RG8 = 0, //general, clobber
        RS1 = 0, //general, saved
        RS2 = 0, //general, saved
        RS3 = 0, //general, saved
        RS4 = 0, //general, saved
        RO1 = 0, //operation operand 1, saved
        RO2 = 0, //operation operand 2, saved
        RO3 = 0, //operation operand 3, saved
        RO4 = 0, //operation result, clobbered
        //system registers
        FLG = {carry:0},//flags
        PRG = 0, //program counter
        SPT = 0, //stack pointer
        FPT = 0, //frame pointer;
        //memory
        stack = [], //program stack
        memory = [], //heap memory
        mem_next = 0,
        //program 
        definitions = {},
        labels = {}, //label to address mappings
        operations = [], //the program to execute
        settings = {
            mode:0,
            stack_size:0,
            heap_size:0
        },
        running = false,
        updateListeners=[];

    this.init = (mode,stackSize,heapSize,program,args={argv:[]}) => {
        settings.mode = mode;
        settings.stacK_size = stackSize;
        settings.heap_size = heapSize;
        for(let i = args.argv.length - 1; i >= 0; i--){
            stack.push(args.argv[i]);
            SPT += 1;
        }
        stack.push(args.argv.length + 1);
        SPT += 1;
        //convert program into operations then execute operations in order

        for(let i = 0; i < program.length; i++){
            let step = program[i];
            let parts = step.split(",");
            let op = parts[0];
            switch(op){
                case "NOP":
                    operations.push(()=>{
                        nop();
                    });
                    break;
                case "MOV":
                    operations.push(()=>{
                        move(parts[1],parts[2]);
                    });
                    break;
                case "LOD":
                    operations.push(()=>{
                        load(parts[1],parts[2])
                    });
                    break;
                case "STR":
                    operations.push(()=>{
                        store(parts[1],parts[2]);
                    });
                    break;
                case "PSH":
                    operations.push(()=>{
                        push(parts[1]);
                    });
                    break;
                case "POP":
                    operations.push(()=>{
                        pop(parts[1]);
                    });
                    break;
                case "CMP":
                    operations.push(()=>{
                        compare(parts[1],parts[2]);
                    });
                    break;
                case "ADD":
                    operations.push(()=>{
                        add();
                    });
                    break;
                case "SUB":
                    operations.push(()=>{
                        sub();
                    });
                    break;
                case "MUL":
                    operations.push(()=>{
                        mul();
                    });
                    break;
                case "DIV":
                    operations.push(()=>{
                        div();
                    });
                    break;
                case "MOD":
                    operations.push(()=>{
                        mod();
                    });
                    break;
                case "JMP":
                    operations.push(()=>{
                        jump(parts[1]);
                    });
                    break;
                case "JIE":
                    operations.push(()=>{
                        jumpIfEqual(parts[1]);
                    });
                    break;
                case "JNE":
                    operations.push(()=>{
                        jumpNotEqual(parts[1]);
                    });
                    break;
                case "SYS":
                    operations.push(()=>{
                        syscall();
                    });
                    break;
                case "CAL":
                    operations.push(()=>{
                        call(parts[1]);
                    });
                    break;
                case "RET":
                    operations.push(()=>{
                        ret()
                    });
                    break;
                case "LBL":
                    label(parts[1],operations.length);
                    operations.push(()=>{
                        nop();
                    });
                    break;
                case "DEF":
                    define(parts[1],parts[2]);
                    break;
                case "INC":
                    operations.push(()=>{
                        increment(parts[1]);
                    });
                    break;
                case "DEC":
                    operations.push(()=>{
                        decrement(parts[1]);
                    });
                    break;
                default:
                    //ERROR!
                    break;
            }
        }
        running = true;
        if(settings.mode == "run"){
            run();
        }
        
    };
    this.step = step;
    this.listen=function(listener){
        updateListeners.push(listener);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function step(){
        if(PRG < operations.length && running == true){
            operations[PRG]();
            PRG++;
            raiseUpdateEvent();
            return true;
        }
        return false;
    }
    function run(){
        let not_done = true;
        while(not_done){
            not_done = step();
        }
    }
    function raiseUpdateEvent(){
        let stats = {
            registers:{
                RG1,
                RG2,
                RG3,
                RG4,
                RG5,
                RG6,
                RG7,
                RG8,
                RS1,
                RS2,
                RS3,
                RS4,
                RO1,
                RO2,
                RO3,
                RO4,
                PRG,
                FLG,
                SPT,
                FPT
            },
            stack,
            memory
        };
        for(let l in updateListeners){
            if(updateListeners.hasOwnProperty(l)){
                updateListeners[l](stats);
            }
        }
    }

    function mapRegister(register,op,value){
        switch(register){
            case "RG1":
                if(op == "set"){
                    RG1 = value;
                } else if(op == "get") {
                    return RG1;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG2":
                if(op == "set"){
                    RG2 = value;
                } else if(op == "get") {
                    return RG2;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG3":
                if(op == "set"){
                    RG3 = value;
                } else if(op == "get") {
                    return RG3;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG4":
                if(op == "set"){
                    RG4 = value;
                } else if(op == "get") {
                    return RG4;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG5":
                if(op == "set"){
                    RG5 = value;
                } else if(op == "get") {
                    return RG5;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG6":
                if(op == "set"){
                    RG6 = value;
                } else if(op == "get") {
                    return RG6;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG7":
                if(op == "set"){
                    RG7 = value;
                } else if(op == "get") {
                    return RG7;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RG8":
                if(op == "set"){
                    RG8 = value;
                } else if(op == "get") {
                    return RG8;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RS1":
                if(op == "set"){
                    RS1 = value;
                } else if(op == "get") {
                    return RS1;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RS2":
                if(op == "set"){
                    RS2 = value;
                } else if(op == "get") {
                    return RS2;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RS3":
                if(op == "set"){
                    RS3 = value;
                } else if(op == "get") {
                    return RS3;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RS4":
                if(op == "set"){
                    RS4 = value;
                } else if(op == "get") {
                    return RS4;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RO1":
                if(op == "set"){
                    RO1 = value;
                } else if(op == "get") {
                    return RO1;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RO2":
                if(op == "set"){
                    RO2 = value;
                } else if(op == "get") {
                    return RO2;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RO3":
                if(op == "set"){
                    RO3 = value;
                } else if(op == "get") {
                    return RO3;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            case "RO4":
                if(op == "set"){
                    RO4 = value;
                } else if(op == "get") {
                    //return Number.parseInt(RO4);
                    return RO4;
                } else {
                    console.error("Invalid value for op: " + op + "!");
                    RO2=109;
                    sys_exit();
                }
                break;
            default:
                console.error("Invalid value for 'register'!");
                RO2=99;
                sys_exit();
                break;

        }
    }
    function mapDefinition(definition,op,value){
        if(op == "set"){
            memory[definition] = value;
            return value;
        } else {
            if(typeof memory[definitions[definition]] != 'undefined'){
                return memory[definitions[definition]];
            } else {
                console.log("definition: '" + definition + "' not found!");
                return null;
            }
        }
    }

    function label(name,address){
        //console.log("LBL," + name + "," + address);
        labels[name] = address;
    }

    function move(register,value){ 
        //console.log(`MOV, ${register}, ${value}`);
        switch(typeof(value)){
            case 'string':
                if(value.indexOf("RG") != -1 || 
                    value.indexOf("RO") != -1){
                    let r2 = mapRegister(value,"get");
                    mapRegister(register,"set",r2);
                } else {
                    let num = Number.parseInt(value);
                    if(Number.isNaN(num)){
                        mapRegister(register,"set",mapDefinition(value,"get"));
                    } else {
                        mapRegister(register,"set",num);
                    }
                }
                break;
            case 'number':
                mapRegister(register,"set",value);m/to
                break;
            default:
                console.error("Invalid value for 'value'!");
                sys_exit(100);
                break;
        }
        
    }

    function store(register,address){
        //console.log(`STR,${register},${address}`);
        switch(typeof address){
            case 'string':
                if(definitions.hasOwnProperty(address)){
                    memory[definitions[address]] = mapRegister(register,"get");
                } else {
                    console.error("No definition with name " + address + " found!");
                    sys_exit(100);
                }
                break;
            case 'number':
                    memory[address] = register;
                break;
            default:
                console.error("Invalid value for 'address'!");
                sys_exit(101);
                break;
        }
    }

    function load(register,address){
        //console.log(`LOD,${register},${address}`);
        switch(typeof address){
            case 'string':
                if(definitions.hasOwnProperty(address)){
                    mapRegister(register,"set",memory[definitions[address]]);
                } else {
                    console.error("No definition with name " + address + " found!");
                    sys_exit(100);
                }
                break;
            case 'number':
                    register = memory[address];
                break;
            default:
                console.error("Invalid value for 'address'!");
                sys_exit(101);
                break;
        }
    }

    function push(register){
        //console.log(`PSH,${register}`);
        stack.push(mapRegister(register,"get"));
        SPT += 1;
    }

    function pop(register){
        //console.log(`POP,${register}`);
        mapRegister(register,"set",stack.pop())
        SPT -= 1;
    }

    function add(){
        //console.log(`ADD,${RO1},${RO2}`);
        RO4 = Number.parseInt(RO1) + Number.parseInt(RO2);
    }

    function subtract(){
        //console.log(`SUB,${RO1},${RO2}`);
        RO4 = Number.parseInt(RO1) - Number.parseInt(RO2);
    }

    function multipy(){
        //console.log(`MUL,${RO1},${RO2}`);
        RO4 = RO1 * RO2;
    }

    function divide(){
        //console.log(`DIV,${RO1},${RO2}`);
        RO4 = Math.floor(RO1 / RO2);
    }

    function mod(){
        //console.log(`MOD,${RO1},${RO2}`);
        stack.push(RO3);
        RO3 = Math.floor(RO1 / RO2);
        RO4 = RO1 - RO3;
        RO3 = stack.pop(); 
    }

    function compare(register,value){
        //console.log(`CMP,${register},${value}`);
        let a = mapRegister(register,"get");
        let b;
        switch(typeof(value)){
            case 'string':
                if( 
                    value.indexOf("RG") != -1 || 
                    value.indexOf("RO") != -1 ||
                    value.indexOf("RS") != -1
                ){
                    b = mapRegister(value,"get");
                    mapRegister(register,"set",r2);
                } else {
                    let num = Number.parseInt(value);
                    if(Number.isNaN(num)){
                    b=mapDefinition(value,"get");
                    } else {
                        b = num;
                    }
                }
                break;
            case 'number':
                b=value;
                break;
            default:
                console.error("Invalid value for 'value'!");
                sys_exit(100);
                break;
        }

        if(a > b){
            RO4 = 1;
        } else if (a < b){
            RO4 = 2;
        } else { //a == b
            RO4=0;
        }
    }

    function jump(address){
        //console.log(`JMP,${address}`);
        switch(typeof address){
            case 'string':
                if(labels.hasOwnProperty(address)){
                    PRG = labels[address];
                } else {
                    console.error("No label with name " + address + " found!");
                    sys_exit(100);
                }
                break;
            case 'number':
                    PRG = address;
                break;
            default:
                console.error("Invalid value for 'address'!");
                sys_exit(101);
                break;
        }
    }

    function jumpIfEqual(address){
        //console.log(`JIE,${address}`);
        if(RO4 == 0){
            switch(typeof address){
                case 'string':
                    if(labels.hasOwnProperty(address)){
                        PRG = labels[address];
                    } else {
                        console.error("No label with name " + address + " found!");
                        sys_exit(100);
                    }
                    break;
                case 'number':
                        PRG = address;
                    break;
                default:
                    console.error("Invalid value for 'address'!");
                    sys_exit(101);
                    break;
            }
        }
    }

    function jumpNotEqual(address){
        //console.log(`JNE,${address}`);
        if(RO4 != 0){
            switch(typeof address){
                case 'string':
                    if(labels.hasOwnProperty(address)){
                        PRG = labels[address];
                    } else {
                        console.error("No label with name " + address + " found!");
                        sys_exit(100);
                    }
                    break;
                case 'number':
                        PRG = address;
                    break;
                default:
                    console.error("Invalid value for 'address'!");
                    sys_exit(101);
                    break;
            }
        }
    }

    function nop(){
        //console.log("NOP");
        return 0;
    }

    function define(name,value){
        //console.log(`DEF,${name},${value}`);
        definitions[name] = mem_next;
        memory[definitions[name]] = value;
        mem_next += 1;
    }

    function syscall(){
        //console.log(`SYS,${RO1}`);
        switch(Number.parseInt(RO1)){
            case 0:
                sys_print();
                break;
            case 1:
                sys_exit();
                break;
            default:
                console.error("Invalid value for sys call number : " + RO1 + "!");
                RO2=110;
                sys_exit();
                break;
        }
    }

    function call(address){
        //console.log(`CAL,${address}`);
        stack.push(PRG);
        stack.push(FPT);
        FPT = SPT;
        switch(typeof address){
            case 'string':
                PRG = labels[address];
                break;
            case 'number':
                PRG = address;
                break;
            default:
                console.error("Invalid value for address: "+ address + "!");
                R02=111;
                sys_exit();
                break;
        }
    }

    function ret(){
        //console.log(`RET`);
        SPT = FPT;
        FPT = stack.pop();
        PRG = stack.pop();
    }

    function increment(register){
        //console.log(`INC,${register}`);
        mapRegister(register,"set",mapRegister(register,"get") + 1);
    }

    function decrement(register){
        //console.log(`DEC,${register}`);
        mapRegister(register,"set",mapRegister(register,"get") - 1);
    }

    function sys_print(){
        //console.log("sys_print");
        console.log(mapRegister("RO3","get"));
        return RO2;
    }

    function sys_exit(){
        //console.log("sys_exit: " + RO2);
        PRG=operations.length;
        running = false;
        if(typeof process == 'object' && typeof process.exit == 'function'){
            process.exit(RO2);
        }
        return RO2;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
VM.SYS_CALLS = { 
    PRINT:0, //print value to screen
    EXIT:1 //exit with return code
};
VM.OPS = {
    NOP:0, //do nothing
    MOV:1, //move value in a register OR a literal value into a register 
    LOD:2, //load value from memory into register
    STR:3, //store value in register to memory
    CMP:4, //compare RO1 and RO2, store result in RO4 (0: equal, 1:RO1 greater, 2:RO2 greater)
    ADD:5, //add RO1 and RO2, store result in RO4
    SUB:6, //subtract RO2 from RO1, store result in RO4
    MUL:7, //multiply RO1 by RO2, store result in RO4
    DIV:8, //divide RO1 by RO2, store result in RO4
    MOD:9, //mod RO1 with RO2, store result in RO4
    JMP:10, //unconditional jump
    JIE:11, //jump if equal (RO4 == 0)
    JNE:12, //jump if not equal (RO4 !=0)
    SYS:13, //system call, first 3 args in RO1, RO2, RO3, rest on stack, result in RO4
    CAL:14, //call user function, by convention first 3 args in RO1,RO2,RO3, rest on stack, result in RO4
    RET:15, //return from user function,
    LBL:16, //insert a nop and create a mapping to the nop using label
    DEF:17, //define a value in memory with label
    PSH:18, //push a value onto stack
    POP:19, //pop a value off of stack
    INC:20, //increment value in a register
    DEC:21  //decrement value in a register
};
//console.log(VM.SYS_CALLS);
//console.log(VM.OPS);

let vm = new VM();
/*
vm.listen((stats)=>{
    console.log(stats);
});
*/
vm.init(
    // mode ////////////////////////////////////////////////////////////////////
    //options are 'step' and 'run'
    "run",
    //"step",
    // stack size //////////////////////////////////////////////////////////////
    256,
    // heap size ///////////////////////////////////////////////////////////////
    1024,
    // program ///////////////////////////////////////////////////////////////// 
    [
        //define memory
        "DEF,msg,hello world",
        "DEF,passed,value was correct",
        "DEF,failed,value was not correct",
        "DEF,t1,0",
        //sys print
        "MOV,RO1,0",
        "MOV,RO2,11",
        "MOV,RO3,msg",
        "SYS",
        //call test function
        "CAL,func",
        //loop
        "MOV,RG1,0",
        "LBL,loop_start",
        "MOV,RO1,0",
        "MOV,RO2,1",
        "MOV,RO3,RG1",
        "SYS",
        "INC,RG1",
        "CMP,RG1,11",
        "JNE,loop_start",
        //add
        "MOV,RO1,10",
        "MOV,RO2,20",
        "ADD",
        //compare result of addition to correct answer
        "CMP,RO4,30",
        //jump to 'pass' if equal
        "JIE,pass",
        //sys print -- fail message
        "MOV,RO1,0",
        "MOV,RO2,21",
        "MOV,RO3,failed",
        "SYS",
        //sys exit fail
        "MOV,RO1,1",
        "MOV,RO2,1",
        "SYS",
        //label 'pass'
        "LBL,pass",
        //sys print -- pass message
        "MOV,RO1,0",
        "MOV,RO2,17",
        "MOV,RO3,passed",
        "SYS",
        //sys exit pass
        "MOV,RO1,1",
        "MOV,RO2,0",
        "SYS",
        //test function
        "LBL,func",
        "MOV,RO4,69",
        "INC,RO4",
        "DEC,RO4",
        "PSH,RO1",
        "PSH,RO2",
        "PSH,RO3",
        "STR,RO4,t1",
        "LOD,RO1,t1",
        "MOV,RO2,1",
        "ADD",
        "MOV,RO1,0",
        "MOV,RO2,2",
        "MOV,RO3,RO4",
        "SYS",
        "POP,RO3",
        "POP,RO2",
        "POP,RO1",
        "RET"
    ],
    // arguments ///////////////////////////////////////////////////////////////
    {
        argv:[
            "bob"
        ]
    }
);
/*
let maxSteps = 20;
for(let i = 0; i < maxSteps; i++){
    vm.step();
}
*/
////////////////////////////////////////////////////////////////////////////////


