# JASM Specification (ASM-VM)

This document serves as the official reference guide for the JASM assembly language and the underlying ASM-VM architecture.

## 1. Memory Architecture
The VM features a shared memory system, accessed via a simple Bus. Memory is byte-addressable and supports reads/writes from 8-bit to 64-bit lengths (Uint8, Uint16, Uint32, Uint64).

### Bus Address Map
- `0x00000 - 0x0FFFF`: VM internal memory (Program Data & Text)
- `0x10080 - 0x1008F` (Decimal `65664`): Keyboard Adapter (`0` is base)
- `0x10100 - 0x1010F` (Decimal `65792`): Mouse Adapter (`1` is base)
- `0x10200 - 0x14200` (Decimal `66048`): PPU Adapter (`2` is base)

### Memory Segments (Internal VM)
When the VM loads a JASM payload, memory is segmented as follows:
- **Data Segment** (Variables, strings, arrays): Starts at `0x00000`
- **Text Segment** (Instructions/Bytecode): Starts immediately after the Data Segment.
- **Stack Segment**: The stack pointer (`SPT`) starts at `0` and grows upwards, completely independent from main memory (managed by the VM).

## 2. Registers
The VM features an array of typed registers. 

### General Purpose Registers (Save Registers)
- `RS1` through `RS8`: Recommended for storing long-term state or local variables in high-level code.

### Implicit/Scratch Registers
- `RO1` and `RO2`: Operation Input registers. Math and Logic functions automatically pull their operands from these registers.
- `RO3`: Operation Output register. The result of a math or logic function is placed here.

### Control Registers
- `PRG`: Program Counter. Points to the current instruction offset in the text segment.
- `FLG`: Flag Register. Automatically set after a `CMP` operation.
- `SPT`: Stack Pointer.
- `FPT`: Frame Pointer.

## 3. Instruction Set Reference

### Basic Mechanics
All instructions in JASM are defined using NASM-style macros in the form of `OPCODE( TYPE, REG1, REG2 );`. 
- Valid Types: `U8`, `U16`, `U32`, `U64`, `I8`, `I16`, `I32`, `I64`, `F32`, `F64`.

| Operation | Arguments | Description |
|-----------|-----------|-------------|
| `SET` | `TYPE, REG, VAL` | Loads a constant immediate `VAL` into `REG`. |
| `MOV` | `TYPE, DST, SRC` | Copies the value from register `SRC` to register `DST`. |
| `LOD` | `TYPE, DST, ADDR` | Loads a value from memory address `ADDR` into `DST`. |
| `STR` | `TYPE, SRC, ADDR` | Stores a value from `SRC` to memory address `ADDR`. |
| `DEF` | `NAME, STRING` | Special assembler macro to load an ASCII string into the data segment and alias its address as `NAME`. |
| `SYS` | `()` | Executes a system call. `RO1` contains the Syscall ID. |

### Math & Logic (Implicit Registers)
> **Warning**: The Math operations do **not** take arguments! They implicitly read from `RO1` and `RO2`, and place their output in `RO3`.

- `ADD()`: `RO3 = RO1 + RO2`
- `SUB()`: `RO3 = RO1 - RO2`
- `MUL()`: `RO3 = RO1 * RO2`
- `DIV()`: `RO3 = RO1 / RO2`
- `MOD()`: `RO3 = RO1 % RO2`
- `CMP(TYPE, REG1, REG2)`: Compares `REG1` and `REG2` and sets the `FLG` register based on the result (`1` if >, `2` if ==, `4` if <).

### Control Flow (Jumping)
All jumps depend on the `FLG` register (set by `CMP`).

- `JMP( LBL )`: Unconditional Jump.
- `JIE( LBL )`: Jump if Equal (`FLG == 2`)
- `JNE( LBL )`: Jump if Not Equal (`FLG != 2`)
- `JLT( LBL )`: Jump if Less Than (`FLG & 4`)
- `JGT( LBL )`: Jump if Greater Than (`FLG & 1`)
- `JLE( LBL )`: Jump if Less Than or Equal (`FLG & 6`)
- `JGE( LBL )`: Jump if Greater Than or Equal (`FLG & 3`)

### Stack Operations
- `PSH( TYPE, REG )`: Pushes `REG` value onto the stack.
- `POP( TYPE, REG )`: Pops the top stack value into `REG`.

---
*Generated for ASM-VM by Google Antigravity.*
