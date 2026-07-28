import { BusAdapter } from "./bus.js";

function DisplayAdapter(bus) {
    let busAdapter = new BusAdapter(bus, 256);
    let mem = busAdapter.sharedMemory;
    let canvas = null;
    let ctx = null;

    // Memory Map
    // Offset 0: Command Register
    // Offset 4: Arg1 (X)
    // Offset 8: Arg2 (Y)
    // Offset 12: Arg3 (W)
    // Offset 16: Arg4 (H)
    // Offset 20: Color (R,G,B,A packed as U32)

    this.setCanvas = function (offscreenCanvas) {
        canvas = offscreenCanvas;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Start rendering loop at ~60fps
        setInterval(this.renderLoop.bind(this), 16);
    };

    this.renderLoop = function () {
        if (!ctx) return;
        
        // Poll for command
        let cmd = mem.getUint32(0, 1);
        if (cmd !== 0) {
            this.executeCommand(cmd);
            // Clear command so we don't execute it again
            mem.setUint32(0, 1, 0);
        }
    };

    this.executeCommand = function (cmd) {
        let x = mem.getUint32(4, 1);
        let y = mem.getUint32(8, 1);
        let w = mem.getUint32(12, 1);
        let h = mem.getUint32(16, 1);
        
        let colorU32 = mem.getUint32(20, 1);
        // Extract RGBA (assuming little endian representation or just byte shifts)
        let r = (colorU32 >> 24) & 0xFF;
        let g = (colorU32 >> 16) & 0xFF;
        let b = (colorU32 >> 8) & 0xFF;
        let a = (colorU32 & 0xFF) / 255.0;
        
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;

        switch (cmd) {
            case 1: // CLEAR
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                break;
            case 2: // FILL RECT
                ctx.fillRect(x, y, w, h);
                break;
        }
    };
}

export default DisplayAdapter;