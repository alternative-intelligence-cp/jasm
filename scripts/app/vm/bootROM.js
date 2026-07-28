import { Assembler } from "./assembler.js";

// Programmable boot (bios) ROM
// Initialize system and set PRG to start address or HALT if nothing is there

class BootROM {
    constructor() {
        this.assembler = new Assembler();
    }
    
    // Returns a simple payload that sets up basic Serial IO for a REPL prompt
    // Currently this is just a stub that proves we can load a BIOS before the user program.
    getPayload() {
        let biosSrc = `
// BIOS INIT
SET( U32, RS1, 66560 ); // Serial Cmd/Status base
SET( U32, RS2, 66561 ); // Serial TX Data

// Print B
SET( U32, RO1, 66 ); // 'B'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

// Print I
SET( U32, RO1, 73 ); // 'I'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

// Print O
SET( U32, RO1, 79 ); // 'O'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

// Print S
SET( U32, RO1, 83 ); // 'S'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

// Print >
SET( U32, RO1, 62 ); // '>'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

// In a real BootROM, we would JMP to the user payload offset.
// For now, we will halt here so it doesn't execute uninitialized memory.
HLT();
`;
        return this.assembler.assemble(biosSrc);
    }
}

export default BootROM;