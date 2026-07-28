import { BusAdapter } from "./bus.js";

export default function PPUAdapter(bus) {
    this.busAdapter = new BusAdapter(bus, 256);
    this.canvas = null;
    this.ctx = null;
    this.imageData = null;

    // Internal Memory
    this.vram = new Uint8Array(16384);
    this.oam = new Uint8Array(256);

    let mem = this.busAdapter.sharedMemory;
    let origSetUint32 = mem.setUint32.bind(mem);
    let origGetUint32 = mem.getUint32.bind(mem);

    // Register Offsets
    const PPU_CTRL = 0;
    const PPU_SCROLL_X = 4;
    const PPU_SCROLL_Y = 8;
    const PPU_ADDR = 12;
    const PPU_DATA = 16;
    const OAM_ADDR = 20;
    const OAM_DATA = 24;
    const PPU_STATUS = 28;

    mem.setUint32 = (offset, num, val) => {
        if (num !== 1) {
            origSetUint32(offset, num, val);
            return;
        }

        if (offset === PPU_DATA) {
            let addr = origGetUint32(PPU_ADDR);
            if (addr >= 0 && addr < 16384) {
                this.vram[addr] = val & 0xFF; // Write 8-bit data to VRAM
            }
            origSetUint32(PPU_ADDR, 1, addr + 1); // Auto-increment
        } else if (offset === OAM_DATA) {
            let addr = origGetUint32(OAM_ADDR);
            if (addr >= 0 && addr < 256) {
                this.oam[addr] = val & 0xFF; // Write 8-bit data to OAM
            }
            origSetUint32(OAM_ADDR, 1, addr + 1); // Auto-increment
        } else {
            origSetUint32(offset, num, val);
        }
    };

    mem.getUint32 = (offset, num = 1) => {
        if (num !== 1) return origGetUint32(offset, num);

        if (offset === PPU_DATA) {
            let addr = origGetUint32(PPU_ADDR);
            let val = 0;
            if (addr >= 0 && addr < 16384) {
                val = this.vram[addr];
            }
            origSetUint32(PPU_ADDR, 1, addr + 1); // Auto-increment
            return val;
        } else if (offset === OAM_DATA) {
            let addr = origGetUint32(OAM_ADDR);
            let val = 0;
            if (addr >= 0 && addr < 256) {
                val = this.oam[addr];
            }
            origSetUint32(OAM_ADDR, 1, addr + 1); // Auto-increment
            return val;
        } else {
            return origGetUint32(offset, num);
        }
    };

    this.setCanvas = function (canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.imageData = this.ctx.createImageData(256, 256);
        setInterval(this.renderLoop.bind(this), 16);
    };

    this.renderLoop = function () {
        if (!this.canvas) return;

        let ctrl = mem.getUint32(PPU_CTRL);
        // Bit 0: Enable BG
        // Bit 1: Enable Sprites
        let enableBg = (ctrl & 1) !== 0;
        let enableSprites = (ctrl & 2) !== 0;

        let scrollX = mem.getUint32(PPU_SCROLL_X);
        let scrollY = mem.getUint32(PPU_SCROLL_Y);

        let data = this.imageData.data;
        // Clear background to black
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
        }

        // Draw Background
        if (enableBg) {
            for (let y = 0; y < 256; y++) {
                for (let x = 0; x < 256; x++) {
                    let mapX = (x + scrollX) % 256;
                    let mapY = (y + scrollY) % 256;
                    let tileX = Math.floor(mapX / 8);
                    let tileY = Math.floor(mapY / 8);
                    
                    // Nametable is at 0x1000. 32x32 tiles.
                    let tileIndex = this.vram[0x1000 + (tileY * 32) + tileX];
                    
                    // Pattern Table is at 0x0000. 64 bytes per tile.
                    let pixelX = mapX % 8;
                    let pixelY = mapY % 8;
                    let colorIndex = this.vram[(tileIndex * 64) + (pixelY * 8) + pixelX];
                    
                    if (colorIndex > 0) {
                        // Palette RAM is at 0x2000. 4 bytes per color.
                        let r = this.vram[0x2000 + (colorIndex * 4)];
                        let g = this.vram[0x2000 + (colorIndex * 4) + 1];
                        let b = this.vram[0x2000 + (colorIndex * 4) + 2];
                        let a = this.vram[0x2000 + (colorIndex * 4) + 3];
                        
                        let idx = (y * 256 + x) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                        data[idx + 3] = a;
                    }
                }
            }
        }

        // Draw Sprites
        if (enableSprites) {
            for (let i = 0; i < 64; i++) {
                let spriteY = this.oam[i * 4];
                let tileIndex = this.oam[i * 4 + 1];
                let attr = this.oam[i * 4 + 2]; // For future use (flip, palette)
                let spriteX = this.oam[i * 4 + 3];
                
                // Hide sprite if Y >= 240 (standard NES convention)
                if (spriteY >= 240) continue;

                for (let py = 0; py < 8; py++) {
                    for (let px = 0; px < 8; px++) {
                        let colorIndex = this.vram[(tileIndex * 64) + (py * 8) + px];
                        if (colorIndex > 0) { // Color 0 is transparent for sprites
                            let r = this.vram[0x2000 + (colorIndex * 4)];
                            let g = this.vram[0x2000 + (colorIndex * 4) + 1];
                            let b = this.vram[0x2000 + (colorIndex * 4) + 2];
                            let a = this.vram[0x2000 + (colorIndex * 4) + 3];
                            
                            let screenX = spriteX + px;
                            let screenY = spriteY + py;
                            if (screenX >= 0 && screenX < 256 && screenY >= 0 && screenY < 256) {
                                let idx = (screenY * 256 + screenX) * 4;
                                data[idx] = r;
                                data[idx + 1] = g;
                                data[idx + 2] = b;
                                data[idx + 3] = a; // Actually sprites can use A for blending, but 255 is fine.
                            }
                        }
                    }
                }
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
        
        // Pulse VBlank
        let status = mem.getUint32(PPU_STATUS);
        origSetUint32(PPU_STATUS, 1, status ^ 1);
    };
}
