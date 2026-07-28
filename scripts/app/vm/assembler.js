export class Assembler {
    constructor() {
        this.OPS = {
            NOP:0, SET:1, MOV:2, LOD:3, STR:4, INC:5, DEC:6, CMP:7, PSH:8, POP:9,
            AND:10, IOR:11, XOR:12, NOT:13, NOR:14, ADD:15, SUB:16, MUL:17, DIV:18, MOD:19,
            CAL:20, RET:21, JMP:22, JIE:23, JNE:24, JGT:25, JLT:26, JGE:27, JLE:28, SYS:29,
            DEF:30, LBL:31, GAD:32, DRF:33, ICL:34, IRET:35
        };
        
        this.TYPES = {
            U8:0, U16:1, U32:2, U64:3, I8:4, I16:5, I32:6, I64:7, F16:8, F32:9, F64:10
        };

        this.REGISTERS = {
            RO1:0, RO2:1, RO3:2,
            RS1:3, RS2:4, RS3:5, RS4:6, RS5:7, RS6:8, RS7:9, RS8:10,
            RC1:11, RC2:12, RC3:13, RC4:14, RC5:15, RC6:16, RC7:17, RC8:18,
            PRG:19, SPT:20, FPT:21, FLG:22, ERR:23, IVT:24
        };
    }

    assemble(source) {
        // Strip comments
        source = source.replace(/\/\/.*$/gm, '');
        source = source.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Find all commands: NAME(args);
        const commandRegex = /([A-Z]+)\s*\(([^)]*)\)\s*;/g;
        let match;
        let tokens = [];
        
        while ((match = commandRegex.exec(source)) !== null) {
            let cmd = match[1];
            let argsStr = match[2];
            
            let args = [];
            let currentArg = '';
            let inString = false;
            let stringChar = '';

            for (let i = 0; i < argsStr.length; i++) {
                let char = argsStr[i];
                if ((char === "'" || char === '"') && (i === 0 || argsStr[i-1] !== '\\')) {
                    if (inString && char === stringChar) {
                        inString = false;
                    } else if (!inString) {
                        inString = true;
                        stringChar = char;
                    }
                    currentArg += char;
                } else if (char === ',' && !inString) {
                    let a = currentArg.trim();
                    if (a) args.push(a.replace(/^['"]|['"]$/g, ''));
                    currentArg = '';
                } else {
                    currentArg += char;
                }
            }
            let finalArg = currentArg.trim();
            if (finalArg) {
                args.push(finalArg.replace(/^['"]|['"]$/g, ''));
            }

            tokens.push({ cmd, args, raw: match[0] });
        }

        let labels = {};
        let definitions = {};
        let dataSize = 0;
        
        // Pass 1: Build Symbol Table & Data Segment Layout
        let instructionCount = 0;
        for (let i = 0; i < tokens.length; i++) {
            let t = tokens[i];
            if (t.cmd === 'LBL') {
                labels[t.args[0]] = instructionCount; // Instruction index
            } else if (t.cmd === 'DEF') {
                let name = t.args[0];
                let val = t.args[1];
                definitions[name] = { address: dataSize, value: val };
                dataSize += val.length + 1; // null terminated string
            } else {
                instructionCount++;
            }
        }

        // Generate Data Segment
        let dataSegment = new Uint8Array(dataSize);
        let currentDataPtr = 0;
        for (let name in definitions) {
            let def = definitions[name];
            let str = def.value;
            for (let i=0; i<str.length; i++) {
                dataSegment[currentDataPtr++] = str.charCodeAt(i);
            }
            dataSegment[currentDataPtr++] = 0;
        }

        // Pass 2: Code Generation (16 bytes per instruction)
        let textSegment = new ArrayBuffer(instructionCount * 16);
        let textView = new DataView(textSegment);
        let ptr = 0;

        for (let i = 0; i < tokens.length; i++) {
            let t = tokens[i];
            if (t.cmd === 'LBL' || t.cmd === 'DEF') continue;
            
            let op = this.OPS[t.cmd];
            if (op === undefined) throw new Error(`Unknown command: ${t.cmd}`);
            
            let typeId = 2; // Default to U32
            let reg1 = 0;
            let reg2 = 0;
            let val = 0;
            
            let args = [...t.args];
            if (args.length > 0 && this.TYPES.hasOwnProperty(args[0])) {
                typeId = this.TYPES[args[0]];
                args.shift();
            }
            
            if (args.length === 1) {
                // E.g. JMP( loop_start ), PSH( RO1 )
                let arg = args[0];
                if (this.REGISTERS.hasOwnProperty(arg)) {
                    reg1 = this.REGISTERS[arg];
                } else if (definitions.hasOwnProperty(arg)) {
                    val = definitions[arg].address;
                } else if (labels.hasOwnProperty(arg)) {
                    val = labels[arg];
                } else {
                    let num = Number(arg);
                    if (!isNaN(num)) val = num;
                }
            } else if (args.length >= 2) {
                // E.g. SET( RS1, 0 ), MOV( RO1, RO2 )
                let arg1 = args[0];
                let arg2 = args[1];
                if (this.REGISTERS.hasOwnProperty(arg1)) reg1 = this.REGISTERS[arg1];
                
                if (this.REGISTERS.hasOwnProperty(arg2)) {
                    reg2 = this.REGISTERS[arg2];
                } else {
                    if (definitions.hasOwnProperty(arg2)) {
                        val = definitions[arg2].address;
                    } else if (labels.hasOwnProperty(arg2)) {
                        val = labels[arg2];
                    } else {
                        let num = Number(arg2);
                        if (!isNaN(num)) val = num;
                    }
                }
            }

            textView.setUint8(ptr + 0, op);
            textView.setUint8(ptr + 1, typeId);
            textView.setUint8(ptr + 2, reg1);
            textView.setUint8(ptr + 3, reg2);
            textView.setFloat64(ptr + 4, val, true);
            
            ptr += 16;
        }

        return { data: dataSegment, text: new Uint8Array(textSegment) };
    }
}