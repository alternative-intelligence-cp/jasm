window.addEventListener('unhandledrejection', function(event) {
    console.error("UNHANDLED PROMISE REJECTION:", event.reason);
    let cv = document.getElementById('console-view');
    if (cv) cv.innerHTML += "\n[PROMISE ERROR] " + event.reason;
});
window.onerror = function(msg, url, line, col, err) {
    console.error("GLOBAL ERROR:", msg, line, col, err);
    let cv = document.getElementById('console-view');
    if (cv) cv.innerHTML += "\n[FATAL ERROR] " + msg;
};
import { Assembler } from './vm/assembler.js';
import { Compiler } from './compiler.js';

const $ = (id) => document.getElementById(id);

let assembler = new Assembler();
let compiler = new Compiler();
let workers = APP.modules.get('workers');
let isWorkerReady = false;
let audioCtx = null;

function playTone(freq, dur, typeIdx) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    let osc = audioCtx.createOscillator();
    let types = ['sine', 'square', 'sawtooth', 'triangle'];
    osc.type = types[typeIdx] || 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    let gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + (dur / 1000));
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + (dur / 1000));
}

// UI Elements
const btnCompile = $('btn-compile');
const btnBuild = $('btn-build');
const btnRun = $('btn-run');
const btnStep = $('btn-step');
const btnStop = $('btn-stop');
const btnReset = $('btn-reset');
const sourceCode = $('source-code');
const sourceHighlevel = $('source-highlevel');
const tabHighlevel = $('tab-highlevel');
const tabAssembly = $('tab-assembly');
const hexdumpView = $('hexdump-view');
const registersView = $('registers-view');
const consoleView = $('console-view');

let currentPayload = null;
const registersMap = [
    "PRG", "RO1", "RO2", "RO3", "RS1", "RS2", "RS3", "RS4", "RS5", "RS6", "RS7", "RS8",
    "RC1", "RC2", "RC3", "RC4", "RC5", "RC6", "RC7", "RC8", "SPT", "FPT", "FLG", "ERR"
];

const EXAMPLES = {
    'mini-os': `// JASM BootROM OS v1.0
var buf_ptr = 8192; 
var index = 0;

printStr("JASM BootROM OS v1.0");
printStr("Type 'help' for commands");

// Initial Prompt
poke(66564, 10);
poke(66560, 1);
poke(66564, 62);
poke(66560, 1);
poke(66564, 32);
poke(66560, 1);

while (1) {
    var status = peek(66568);
    if (status == 1) {
        var char = peek(66572);
        poke(66568, 0);

        // Echo
        poke(66564, char);
        poke(66560, 1);

        if (char == 10) { 
            if (peek(buf_ptr + 0) == 104) { 
                if (peek(buf_ptr + 4) == 101) { 
                    if (peek(buf_ptr + 8) == 108) { 
                        if (peek(buf_ptr + 12) == 112) { 
                            printStr("Available commands: help, setup, load");
                        }
                    }
                }
            }

            if (peek(buf_ptr + 0) == 115) { 
                if (peek(buf_ptr + 4) == 101) { 
                    if (peek(buf_ptr + 8) == 116) { 
                        if (peek(buf_ptr + 12) == 117) { 
                            if (peek(buf_ptr + 16) == 112) { 
                                printStr("--- BIOS SETTINGS ---");
                                printStr("1. Boot Sequence: DISK 0");
                                printStr("2. Display Mode: VGA");
                            }
                        }
                    }
                }
            }

            if (peek(buf_ptr + 0) == 108) { 
                if (peek(buf_ptr + 4) == 111) { 
                    if (peek(buf_ptr + 8) == 97) { 
                        if (peek(buf_ptr + 12) == 100) { 
                            printStr("Loading payload from disk... BOOT FAILURE");
                        }
                    }
                }
            }
            
            // clear buffer
            index = 0;
            poke(buf_ptr + 0, 0);
            poke(buf_ptr + 4, 0);
            poke(buf_ptr + 8, 0);
            poke(buf_ptr + 12, 0);
            poke(buf_ptr + 16, 0);

            // Print Prompt
            poke(66564, 10);
            poke(66560, 1);
            poke(66564, 62);
            poke(66560, 1);
            poke(66564, 32);
            poke(66560, 1);
        }
        
        if (char != 10) {
            if (index < 20) {
                poke(buf_ptr + index, char);
                index = index + 4;
            }
        }
    }
}`,
    'mini-gpu': `// VRAM access from Mini-Lang!
var PPU_CTRL = 66048;
var PPU_ADDR = 66060;
var PPU_DATA = 66064;

// 1. Setup Palette (Color 1 = Red)
poke(PPU_ADDR, 8196); // 8192 + 4 = Color 1
poke(PPU_DATA, 255); // R
poke(PPU_DATA, 0);   // G
poke(PPU_DATA, 0);   // B
poke(PPU_DATA, 255); // A

// 2. Setup Pattern Table (Tile 1 = Solid Color 1)
poke(PPU_ADDR, 64);

var count = 64;
while (count > 0) {
    poke(PPU_DATA, 1);
    count = count - 1;
}

// 3. Fill Nametable with Tile 1
poke(PPU_ADDR, 4096);
var nt = 1024;
while (nt > 0) {
    poke(PPU_DATA, 1);
    nt = nt - 1;
}

// 4. Enable BG
poke(PPU_CTRL, 1);
printStr("GPU Background set to solid red!");
exit(0);`,
    'mini-fib': `var a = 0;
var b = 1;
var target = 15;
var counter = 0;

while (counter < target) {
    var temp = a + b;
    a = b;
    b = temp;
    counter = counter + 1;
}

print(a);
exit(0);`,
    'mini-hello': `// mini-hello updated with string support!
var msg = "Hello World from Mini-Lang!";
printStr(msg);
exit(0);`,
    'hello': `// 'hello_world.jasm' -- v0.0.1 -- R. Hoggard -- 07/24/2026\n\nDEF( msg, 'hello world' );    // define memory for 'hello world'\nSET( U32, RO1, 2 );            // set sys call number to 'print string'\nSET( U32, RS1, 11 );           // set length of 'hello world'\nSET( U32, RS2, msg );          // set address of 'hello world'\nSYS();                         // do sys call\nSET( U32, RO1, 1 );            // set sys call number to 'exit'\nSET( U32, RO3, 42 );           // set exit code \nSYS();                         // do sys call`,
    'fibonacci': `// 'fibonacci.jasm' -- Calculates 15th Fibonacci number\n// Uses RS1 as target (15)\n// Uses RS2 as A (n-2)\n// RS3 as B (n-1)\n// RS4 as loop counter\n// RS5 as temporary swap\n\nSET( U32, RS1, 15 );    // Target loop count\nSET( U32, RS2, 0 );     // A = 0\nSET( U32, RS3, 1 );     // B = 1\nSET( U32, RS4, 0 );     // Counter = 0\n\nLBL( loop_start );\nCMP( U32, RS4, RS1 );   // Compare counter to target\nJGE( loop_end );        // If counter >= target, jump to end\n\n// temp = a + b\nMOV( U32, RO1, RS2 );\nMOV( U32, RO2, RS3 );\nADD();                  // RO3 = a + b\nMOV( U32, RS5, RO3 );   // temp = RO3\n\n// a = b\nMOV( U32, RS2, RS3 );\n\n// b = temp\nMOV( U32, RS3, RS5 );\n\n// counter++\nINC( U32, RS4 );\nJMP( loop_start );      // loop back\n\nLBL( loop_end );\n// print result (which is in RS2)\nMOV( U32, RO3, RS2 );\nSET( U32, RO1, 0 );\nSYS();                  // print\n\n// exit gracefully\nSET( U32, RO1, 1 );\nSET( U32, RO3, 0 );\nSYS();`,
    'hardware': `// 'hardware_test.jasm' -- Polls the mouse position and left click state\n// Mouse X addr = 65792, Mouse Y addr = 65796, Left-Click addr = 65804\n\nLBL( loop_start );\n\n// Load Left click state (U8) into RO1\nSET( U32, RS1, 65804 );\nLOD( U8, RO1, RS1 );\n\n// Compare left click to 1\nSET( U32, RS2, 1 );\nCMP( U8, RO1, RS2 );\nJNE( loop_start ); // if not 1, loop back (wait for click)\n\n// We clicked! Print X and Y\nSET( U32, RS3, 65792 );\nLOD( U32, RO3, RS3 );\nSET( U32, RO1, 0 );\nSYS(); // print X\n\nSET( U32, RS3, 65796 );\nLOD( U32, RO3, RS3 );\nSET( U32, RO1, 0 );\nSYS(); // print Y\n\n// Wait for release to avoid spamming\nLBL( wait_release );\nSET( U32, RS1, 65804 );\nLOD( U8, RO1, RS1 );\nSET( U32, RS2, 0 );\nCMP( U8, RO1, RS2 );\nJNE( wait_release );\n\nJMP( loop_start );`,
    'display': `// 'ppu_test.jasm' -- Hardware Scrolling & Tile Rendering via PPU
// Base Address: 66048

// PPU Register Offsets
// PPU_CTRL     = 66048
// PPU_SCROLL_X = 66052
// PPU_SCROLL_Y = 66056
// PPU_ADDR     = 66060
// PPU_DATA     = 66064

// 1. Setup Palette
SET( U32, RS1, 66060 ); // PPU_ADDR
SET( U32, RO1, 8192 );  // Palette Base (0x2000 = 8192)
STR( U32, RO1, RS1 );

SET( U32, RS1, 66064 ); // PPU_DATA
// Color 0: Black (R,G,B,A)
SET( U32, RO1, 0 );
STR( U32, RO1, RS1 ); // R
STR( U32, RO1, RS1 ); // G
STR( U32, RO1, RS1 ); // B
SET( U32, RO1, 255 );
STR( U32, RO1, RS1 ); // A

// Color 1: White
SET( U32, RO1, 255 );
STR( U32, RO1, RS1 ); // R
STR( U32, RO1, RS1 ); // G
STR( U32, RO1, RS1 ); // B
STR( U32, RO1, RS1 ); // A

// Color 2: Yellow
SET( U32, RO1, 255 );
STR( U32, RO1, RS1 ); // R
STR( U32, RO1, RS1 ); // G
SET( U32, RO1, 0 );
STR( U32, RO1, RS1 ); // B
SET( U32, RO1, 255 );
STR( U32, RO1, RS1 ); // A

// 2. Procedurally generate Tile 1 (Checkerboard) in Pattern Table
SET( U32, RS1, 66060 ); // PPU_ADDR
SET( U32, RO1, 64 );    // Tile 1 is at 64
STR( U32, RO1, RS1 );

SET( U32, RC1, 0 ); // Y=0
LBL( y_loop );
SET( U32, RC2, 0 ); // X=0
LBL( x_loop );

// Calculate (X + Y) % 2
MOV( U32, RO1, RC1 );
MOV( U32, RO2, RC2 );
ADD();
SET( U32, RO2, 2 );
MOD();

// if 0, color=2 (Yellow), else color=1 (White)
SET( U32, RO2, 0 );
CMP( U32, RO3, RO2 );
JNE( is_odd );
SET( U32, RO1, 2 );
JMP( write_color );
LBL( is_odd );
SET( U32, RO1, 1 );

LBL( write_color );
SET( U32, RS1, 66064 ); // PPU_DATA
STR( U32, RO1, RS1 );

INC( U32, RC2 );
SET( U32, RO1, 8 );
CMP( U32, RC2, RO1 );
JLT( x_loop );

INC( U32, RC1 );
SET( U32, RO1, 8 );
CMP( U32, RC1, RO1 );
JLT( y_loop );

// 3. Fill Nametable with Tile 1
SET( U32, RS1, 66060 ); // PPU_ADDR
SET( U32, RO1, 4096 );  // Nametable Base (0x1000 = 4096)
STR( U32, RO1, RS1 );

SET( U32, RC1, 0 );
LBL( nt_loop );
SET( U32, RS1, 66064 ); // PPU_DATA
SET( U32, RO1, 1 ); // Tile index 1
STR( U32, RO1, RS1 );
INC( U32, RC1 );
SET( U32, RO1, 1024 );
CMP( U32, RC1, RO1 );
JLT( nt_loop );

// 4. Enable Background rendering
SET( U32, RS1, 66048 ); // PPU_CTRL
SET( U32, RO1, 1 );     // Bit 0 = Enable BG
STR( U32, RO1, RS1 );

// 5. Scroll Loop
SET( U32, RS3, 0 ); // Scroll X
SET( U32, RS4, 0 ); // Scroll Y
LBL( main_loop );

// Wait for a bit (spinloop)
SET( U32, RC1, 0 );
LBL( delay_loop );
INC( U32, RC1 );
SET( U32, RO1, 150000 );
CMP( U32, RC1, RO1 );
JLT( delay_loop );

// Update Scroll X & Y
INC( U32, RS3 );
SET( U32, RS1, 66052 ); // PPU_SCROLL_X
STR( U32, RS3, RS1 );

INC( U32, RS4 );
SET( U32, RS1, 66056 ); // PPU_SCROLL_Y
STR( U32, RS4, RS1 );

JMP( main_loop );
`,
    'audio': `// 'audio_test.jasm' -- Plays an arpeggio using the AudioAdapter
// Audio Base Address = 66304

// We will use RS1 for Command Addr, RS2 for Freq, RS3 for Dur, RS4 for Type
SET( U32, RS1, 66304 ); 
SET( U32, RS2, 66308 ); 
SET( U32, RS3, 66312 ); 
SET( U32, RS4, 66316 ); 

// Set WaveType (1 = Square)
SET( U32, RO1, 1 );
STR( U32, RO1, RS4 );

// Set Duration (150ms)
SET( U32, RO1, 150 );
STR( U32, RO1, RS3 );

// Play Note 1: 261 Hz (C4)
SET( U32, RO1, 261 );
STR( U32, RO1, RS2 );
SET( U32, RO1, 1 );
STR( U32, RO1, RS1 ); // PLAY

// Delay
SET( U32, RC1, 0 );
LBL( delay1 );
INC( U32, RC1 );
SET( U32, RO1, 75000 );
CMP( U32, RC1, RO1 );
JLT( delay1 );

// Play Note 2: 329 Hz (E4)
SET( U32, RO1, 329 );
STR( U32, RO1, RS2 );
SET( U32, RO1, 1 );
STR( U32, RO1, RS1 ); // PLAY

// Delay
SET( U32, RC1, 0 );
LBL( delay2 );
INC( U32, RC1 );
SET( U32, RO1, 75000 );
CMP( U32, RC1, RO1 );
JLT( delay2 );

// Play Note 3: 392 Hz (G4)
SET( U32, RO1, 392 );
STR( U32, RO1, RS2 );
SET( U32, RO1, 1 );
STR( U32, RO1, RS1 ); // PLAY

// Delay
SET( U32, RC1, 0 );
LBL( delay3 );
INC( U32, RC1 );
SET( U32, RO1, 75000 );
CMP( U32, RC1, RO1 );
JLT( delay3 );

// Play Note 4: 523 Hz (C5)
// Let this one ring out longer
SET( U32, RO1, 500 );
STR( U32, RO1, RS3 ); // 500ms
SET( U32, RO1, 523 );
STR( U32, RO1, RS2 );
SET( U32, RO1, 1 );
STR( U32, RO1, RS1 ); // PLAY

// Exit
SET( U32, RO1, 1 );
SET( U32, RO3, 0 );
SYS();
`,
    'gpu': `// 'gpu_demo.jasm'
// A demonstration of the PPU Adapter
// PPU Registers are located at 66048

SET( U32, RS1, 66048 ); // PPU_CTRL
SET( U32, RS2, 66060 ); // PPU_ADDR
SET( U32, RS3, 66064 ); // PPU_DATA

// 1. Write Palette (0x2000)
// Set PPU_ADDR to 0x2000
SET( U32, RO1, 8192 );
STR( U32, RO1, RS2 );

// Color 0: Black (transparent for BG if needed, or just black)
SET( U32, RO1, 255 ); // A=255, B=0, G=0, R=0 (Actually PPU uses RGBA bytes)
// R=255, G=0, B=0, A=255 is Red. 
// We write 4 bytes. Wait, PPU_DATA auto-increments by 1 byte.
// Let's write R, G, B, A for Color 1 (Red)
SET( U32, RO1, 8196 ); // PPU_ADDR to 0x2004 (Color 1)
STR( U32, RO1, RS2 );

// Red
SET( U32, RO1, 255 ); 
STR( U32, RO1, RS3 );
// Green
SET( U32, RO1, 0 ); 
STR( U32, RO1, RS3 );
// Blue
SET( U32, RO1, 0 ); 
STR( U32, RO1, RS3 );
// Alpha
SET( U32, RO1, 255 ); 
STR( U32, RO1, RS3 );

// 2. Write Tile 1 to Pattern Table (0x0000)
SET( U32, RO1, 0 );
STR( U32, RO1, RS2 ); // PPU_ADDR = 0

// A tile is 8x8 pixels = 64 bytes. We will fill Tile 1 (offset 64 to 127) with Color 1.
SET( U32, RO1, 64 );
STR( U32, RO1, RS2 ); // PPU_ADDR = 64

SET( U32, RC1, 64 ); // Loop counter
LBL( tile_loop );
SET( U32, RO1, 1 ); // Color index 1
STR( U32, RO1, RS3 ); // Write to PPU_DATA
DEC( U32, RC1 );
SET( U32, RO2, 0 );
CMP( U32, RC1, RO2 );
JGT( tile_loop );

// 3. Write to Nametable (0x1000)
// 32x32 tiles. Let's fill the whole screen with Tile 1.
SET( U32, RO1, 4096 );
STR( U32, RO1, RS2 ); // PPU_ADDR = 0x1000

SET( U32, RC1, 1024 ); // 32*32 = 1024 tiles
LBL( name_loop );
SET( U32, RO1, 1 ); // Tile Index 1
STR( U32, RO1, RS3 ); // Write to PPU_DATA
DEC( U32, RC1 );
SET( U32, RO2, 0 );
CMP( U32, RC1, RO2 );
JGT( name_loop );

// 4. Enable Background in PPU_CTRL
SET( U32, RO1, 1 ); // Bit 0 = Enable BG
STR( U32, RO1, RS1 );

SET( U32, RO1, 1 );
SYS();
`,
    'serial': `// 'serial_echo.jasm'
// A tiny REPL-like loop that echoes input characters over Serial

// Device 4 (Serial Adapter) is at base 66560
// Offset 0: TX Cmd
// Offset 1: TX Data
// Offset 2: RX Status
// Offset 3: RX Data
SET( U32, RS1, 66560 ); // Serial Cmd/Status base
SET( U32, RS2, 66561 ); // Serial TX Data
SET( U32, RS3, 66562 ); // Serial RX Status
SET( U32, RS4, 66563 ); // Serial RX Data

// Macro or loop to wait for TX Cmd to clear
LBL( tx_wait_1 );
LOD( U8, RO1, RS1 );
SET( U32, RO2, 1 );
CMP( U8, RO1, RO2 );
JIE( tx_wait_1 );

// Print >
SET( U32, RO1, 62 ); // '>'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

LBL( tx_wait_2 );
LOD( U8, RO1, RS1 );
SET( U32, RO2, 1 );
CMP( U8, RO1, RO2 );
JIE( tx_wait_2 );

// Space
SET( U32, RO1, 32 ); // ' '
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

LBL( rx_wait );
// Check if RX Status is 1
LOD( U8, RO1, RS3 );
SET( U32, RO2, 1 );
CMP( U8, RO1, RO2 );
JNE( rx_wait );

// Read character from RX Data
LOD( U8, RO1, RS4 );

LBL( tx_wait_3 );
LOD( U8, RO3, RS1 );
SET( U32, RO2, 1 );
CMP( U8, RO3, RO2 );
JIE( tx_wait_3 );

// Echo it back to TX Data
STR( U8, RO1, RS2 );
SET( U32, RO2, 1 );  // Send TX Cmd
STR( U8, RO2, RS1 );

// Clear RX Status (CPU acknowledges read)
SET( U32, RO2, 0 );
STR( U8, RO2, RS3 );

// If character is Enter ('\n' = 10), print prompt again
SET( U32, RO2, 10 );
CMP( U8, RO1, RO2 );
JNE( rx_wait );

LBL( tx_wait_4 );
LOD( U8, RO1, RS1 );
SET( U32, RO2, 1 );
CMP( U8, RO1, RO2 );
JIE( tx_wait_4 );

// Print prompt again
SET( U32, RO1, 62 ); // '>'
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

LBL( tx_wait_5 );
LOD( U8, RO1, RS1 );
SET( U32, RO2, 1 );
CMP( U8, RO1, RO2 );
JIE( tx_wait_5 );

SET( U32, RO1, 32 ); // ' '
STR( U8, RO1, RS2 ); 
SET( U32, RO1, 1 );  // Send TX Cmd
STR( U8, RO1, RS1 );

JMP( rx_wait );
`,
    'disk': `// 'disk_test.jasm' -- Tests the Virtual Disk Adapter (OPFS)
// Disk Base Address = 66816
// Offset 0 = Command (1=READ, 2=WRITE)
// Offset 4 = Sector Num
// Offset 8 = Status
// Offset 256 = Sector Buffer (512 bytes)

// 1. Write 'H', 'I', '!' to Sector Buffer
SET( U32, RS1, 67072 ); // 66816 + 256 = 67072
SET( U32, RO1, 72 ); // 'H'
STR( U8, RO1, RS1 );
INC( U32, RS1 );
SET( U32, RO1, 73 ); // 'I'
STR( U8, RO1, RS1 );
INC( U32, RS1 );
SET( U32, RO1, 33 ); // '!'
STR( U8, RO1, RS1 );

// 2. Issue WRITE command to Sector 0
SET( U32, RS2, 66820 ); // Sector Num offset
SET( U32, RO2, 0 );
STR( U32, RO2, RS2 );

SET( U32, RS2, 66816 ); // Cmd offset
SET( U32, RO2, 2 ); // WRITE
STR( U8, RO2, RS2 );

// Wait for WRITE to complete (cmd resets to 0)
LBL( wait_write );
LOD( U8, RO1, RS2 );
SET( U32, RO2, 0 );
CMP( U8, RO1, RO2 );
JNE( wait_write );

// 3. Clear our Sector Buffer to prove we actually read it back
SET( U32, RS1, 67072 );
SET( U32, RO1, 0 );
STR( U32, RO1, RS1 ); // Writes 4 null bytes over 'HI!'

// 4. Issue READ command from Sector 0
SET( U32, RO2, 1 ); // READ
STR( U8, RO2, RS2 ); // RS2 is still 66816

// Wait for READ to complete (cmd resets to 0)
LBL( wait_read );
LOD( U8, RO1, RS2 );
SET( U32, RO2, 0 );
CMP( U8, RO1, RO2 );
JNE( wait_read );

// 5. Read the bytes back and print them!
SET( U32, RS1, 67072 );
LOD( U8, RO3, RS1 );
SET( U32, RO1, 0 );
SYS(); // Print H (72)

INC( U32, RS1 );
LOD( U8, RO3, RS1 );
SYS(); // Print I (73)

INC( U32, RS1 );
LOD( U8, RO3, RS1 );
SYS(); // Print ! (33)

SET( U32, RO1, 1 ); // Exit
SET( U32, RO3, 0 );
SYS();`
};

const exampleSelect = $('example-select');

function initUI() {
    registersView.innerHTML = registersMap.map(r => `
        <div class="reg-item" id="reg-${r}">
            <span class="reg-name">${r}</span>
            <span class="reg-val" id="reg-val-${r}">0x00000000</span>
        </div>
    `).join('');
    
    logConsole("System ready.");
    
    
    
    
    


    tabHighlevel.addEventListener('click', () => {
        tabHighlevel.style.color = '#fff';
        tabHighlevel.style.borderBottom = '2px solid #57a1ff';
        tabAssembly.style.color = '#888';
        tabAssembly.style.borderBottom = '2px solid transparent';
        sourceHighlevel.style.display = 'block';
        sourceCode.style.display = 'none';
        btnCompile.style.display = 'inline-block';
        btnBuild.style.display = 'none';
    });
    
    tabAssembly.addEventListener('click', () => {
        tabAssembly.style.color = '#fff';
        tabAssembly.style.borderBottom = '2px solid #57a1ff';
        tabHighlevel.style.color = '#888';
        tabHighlevel.style.borderBottom = '2px solid transparent';
        sourceHighlevel.style.display = 'none';
        sourceCode.style.display = 'block';
        btnCompile.style.display = 'none';
        btnBuild.style.display = 'inline-block';
    });

    btnCompile.addEventListener('click', () => {
        try {
            let jasm = compiler.compile(sourceHighlevel.value);
            sourceCode.value = jasm;
            logConsole("Compiled Mini-Lang to JASM successfully.");
            tabAssembly.click(); // Switch to assembly tab
        } catch (e) {
            logConsole("Compile Error: " + e.message);
        }
    });

    // Default to Highlevel mode
    btnBuild.style.display = 'none';

    
    if (exampleSelect) {
        exampleSelect.addEventListener('change', (e) => {
            if (EXAMPLES[e.target.value]) {
                if (e.target.value.startsWith('mini-')) {
                    sourceHighlevel.value = EXAMPLES[e.target.value];
                    tabHighlevel.click();
                } else {
                    sourceCode.value = EXAMPLES[e.target.value];
                    tabAssembly.click();
                }
            }
        });
        
        // Load default example
        if (exampleSelect.value && EXAMPLES[exampleSelect.value]) {
            sourceHighlevel.value = EXAMPLES[exampleSelect.value];
        }
    }
}

function logConsole(msg) {
    consoleView.innerHTML += `\n[APP] ${msg}`;
    consoleView.scrollTop = consoleView.scrollHeight;
}

function toHexDump(data, text) {
    let out = "DATA SEGMENT:\n";
    out += bufferToHex(data) || " (empty)\n";
    out += "\nTEXT SEGMENT:\n";
    out += bufferToHex(text) || " (empty)\n";
    return out;
}

function bufferToHex(buffer) {
    let out = "";
    let view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i += 8) {
        out += i.toString(16).padStart(4, '0') + "  ";
        let hexes = [];
        let ascii = "";
        for (let j = 0; j < 8; j++) {
            if (i + j < view.length) {
                let v = view[i + j];
                hexes.push(v.toString(16).padStart(2, '0'));
                ascii += (v >= 32 && v <= 126) ? String.fromCharCode(v) : '.';
            } else {
                hexes.push("  ");
            }
        }
        out += hexes.join(" ") + "  |" + ascii + "|\n";
    }
    return out;
}

btnBuild.addEventListener('click', () => {
    try {
        let src = sourceCode.value;
        currentPayload = assembler.assemble(src);
        hexdumpView.innerHTML = toHexDump(currentPayload.data, currentPayload.text);
        logConsole("Build successful. " + (currentPayload.text.length / 16) + " instructions.");
        
        if (!isWorkerReady) {
            startWorker().then(() => {
                workers.send('vmWorker', { type: 'LOAD', program: currentPayload });
                btnRun.disabled = false;
                btnStep.disabled = false;
                btnReset.disabled = false;
            });
        } else {
            workers.send('vmWorker', { type: 'LOAD', program: currentPayload });
            btnRun.disabled = false;
            btnStep.disabled = false;
            btnReset.disabled = false;
        }
    } catch (e) {
        logConsole("Build Error: " + e.message);
        console.error(e);
    }
});

let pendingWorkerResolve = null;

async function startWorker() {
    return new Promise(async (resolve, reject) => {
        logConsole("Spawning VM Worker...");
        pendingWorkerResolve = resolve;
        await workers.spawn('vmWorker', 'scripts/app/vm/vmWorker.js');
        workers.listen('vmWorker', handleWorkerMessage);
        
        const canvas = $('vm-display');
        if (canvas && !canvas.transferred) {
            const offscreen = canvas.transferControlToOffscreen();
            workers.send('vmWorker', { type: 'INIT_DISPLAY', canvas: offscreen }, [offscreen]);
            canvas.transferred = true;
        }
        
        // We wait for 'ready' event to resolve
    });
}

function handleWorkerMessage(msg) {
    if (msg.type === 'EVENT') {
        if (msg.event === 'ready') {
            isWorkerReady = true;
            logConsole("VM Worker initialized and ready.");
            if (pendingWorkerResolve) {
                pendingWorkerResolve();
                pendingWorkerResolve = null;
            }
        } else if (msg.event === 'step') {
            updateRegisters(msg.data);
        } else if (msg.event === 'started') {
            logConsole(`VM started in '${msg.data}' mode.`);
            if (msg.data === 'run') {
                consoleView.innerHTML += `\n> `; // Add prompt for serial/print output
                btnStop.disabled = false;
                btnRun.disabled = true;
                btnStep.disabled = true;
            }
        } else if (msg.event === 'halt') {
            logConsole(`VM halted.`);
            btnStop.disabled = true;
            btnRun.disabled = false;
            btnStep.disabled = false;
        } else if (msg.event === 'done') {
            logConsole(`VM finished with exit code ${msg.data}`);
            btnStop.disabled = true;
            btnRun.disabled = true;
            btnStep.disabled = true;
        } else if (msg.event === 'reset') {
            logConsole(`VM reset.`);
            resetRegisters();
            btnStop.disabled = true;
            btnRun.disabled = false;
            btnStep.disabled = false;
        } else if (msg.event === 'error') {
            logConsole(`[VM ERROR] ${msg.data}`);
        } else if (msg.event === 'audio') {
            playTone(msg.data.freq, msg.data.dur, msg.data.type);
        } else if (msg.event === 'serial_tx') {
            consoleView.innerHTML += msg.data;
            consoleView.scrollTop = consoleView.scrollHeight;
        }
    } else if (msg.type === 'PRINT') {
        consoleView.innerHTML += `\n> ${msg.data}`;
        consoleView.scrollTop = consoleView.scrollHeight;
    }
}

function updateRegisters(stats) {
    for (const [reg, val] of Object.entries(stats)) {
        let el = $(`reg-val-${reg}`);
        if (el) {
            // handle negative display
            let hex = (val >>> 0).toString(16).padStart(8, '0');
            let currentText = `0x${hex}`;
            if (el.innerText !== currentText) {
                el.innerText = currentText;
                let container = $(`reg-${reg}`);
                if (container) {
                    container.classList.add('changed');
                    setTimeout(() => container.classList.remove('changed'), 200);
                }
            }
        }
    }
}

function resetRegisters() {
    for (let r of registersMap) {
        let el = $(`reg-val-${r}`);
        if (el) {
            el.innerText = "0x00000000";
        }
    }
}

btnRun.addEventListener('click', () => {
    if (currentPayload) {
        workers.send('vmWorker', { type: 'START', mode: 'run' });
    }
});

btnStep.addEventListener('click', () => {
    if (currentPayload) {
        workers.send('vmWorker', { type: 'START', mode: 'step' });
    }
});

btnStop.addEventListener('click', () => {
    workers.send('vmWorker', { type: 'HALT' });
});

btnReset.addEventListener('click', () => {
    workers.send('vmWorker', { type: 'RESET' });
});

// Forward UI Events to the VM Bus
window.addEventListener('keydown', (e) => {
    if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'keydown', data: { keyCode: e.keyCode } });
});
window.addEventListener('keyup', (e) => {
    if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'keyup', data: { keyCode: e.keyCode } });
});
window.addEventListener('mousemove', (e) => {
    if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'mousemove', data: { x: e.clientX, y: e.clientY } });
});
window.addEventListener('mousedown', (e) => {
    // Map button: 0 -> 1 (Left), 1 -> 2 (Middle), 2 -> 3 (Right)
    let btn = e.button === 0 ? 1 : (e.button === 1 ? 2 : 3);
    if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'mousedown', data: { button: btn } });
});
window.addEventListener('mouseup', (e) => {
    let btn = e.button === 0 ? 1 : (e.button === 1 ? 2 : 3);
    if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'mouseup', data: { button: btn } });
});

let serialInput = $('serial-input');
if (serialInput) {
    serialInput.addEventListener('keydown', (e) => {
        if (e.key.length === 1) { // Normal character
            e.preventDefault();
            if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'serial_rx', data: { char: e.key } });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isWorkerReady) workers.send('vmWorker', { type: 'INPUT', event: 'serial_rx', data: { char: '\n' } });
        }
    });
}

initUI();
