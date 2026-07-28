# JASM (JavaScript Assembly Machine)

JASM is an educational Virtual Machine (VM) and development environment built entirely in vanilla JavaScript. It is designed to teach low-level systems programming, computer architecture, and compiler design.

## Features

- **Custom ISA**: A simple 16-byte instruction set architecture (JASM Bytecode) designed for readability and ease of learning.
- **Hardware Peripherals**: Memory-mapped I/O devices including a PPU (Graphics), Keyboard, and Serial Adapter.
- **Interrupt Vector Table (IVT)**: Full support for hardware interrupts and interrupt handlers (`IRET`).
- **Integrated Toolchain**: Includes a web-based IDE, a built-in Assembler, and a high-level `Mini-Lang` Compiler.
- **Web-Based**: Runs entirely in the browser, making it universally accessible without any installation.

## Architecture

The JASM VM operates on a 32-bit memory model with specialized hardware addresses for I/O operations:

- **0x0000 - 0x03FF**: IVT (Interrupt Vector Table)
- **0x1000 - 0x1FFF**: Text Segment (Executable Code)
- **0x2000 - 0x2FFF**: Data Segment (Variables/Memory)
- **0x3000 - 0x3FFF**: Stack Space

### Hardware Devices
- **PPU (Picture Processing Unit)**: `0x10200` (66048) - Supports custom palettes, tile-based rendering, and basic sprites.
- **Serial Adapter**: `0x10300` (66304) - Used for transmitting and receiving raw byte streams, suitable for cross-VM communication or BootROM OS prototyping.

## Getting Started

1. Clone this repository.
2. Serve the directory using any static web server (e.g., `python -m http.server`).
3. Open `index.html` in your browser.
4. Select one of the examples from the dropdown (e.g., `gpu_demo`, `serial_echo`, or `mini-hello`).
5. Click **Assemble** to convert the code to JASM bytecode.
6. Click **Load** to flash it to the VM's memory.
7. Click **Run** to execute!

## The Mini-Lang Compiler

JASM includes a custom high-level programming language that compiles directly down to JASM bytecode. It supports standard control flow structures (`if/while`), string literals, and direct memory access (`peek/poke`) for writing low-level drivers entirely in high-level code.

## License
MIT
