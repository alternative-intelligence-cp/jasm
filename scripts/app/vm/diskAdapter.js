import { BusAdapter } from "./bus.js";

function DiskAdapter(bus) {
    // Request 1024 bytes so we can fit a full 512-byte sector buffer
    let busAdapter = new BusAdapter(bus, 1024);
    let mem = busAdapter.sharedMemory;
    
    // Memory Map:
    // 0: Command (U8) -> 1 = READ, 2 = WRITE
    // 4: Sector Number (U32)
    // 8: Status (U8) -> 0 = READY, 1 = ERROR
    // 256: Sector Buffer (512 Bytes)
    
    let accessHandle = null;
    let fallbackDisk = null;

    this.init = async function() {
        try {
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
                const dir = await navigator.storage.getDirectory();
                const fileHandle = await dir.getFileHandle('vmdrive.img', { create: true });
                accessHandle = await fileHandle.createSyncAccessHandle();
                console.log("[DiskAdapter] OPFS Sync Access Handle created.");
            } else {
                console.warn("[DiskAdapter] OPFS not available. Falling back to in-memory 1MB virtual disk.");
                fallbackDisk = new Uint8Array(1024 * 1024); // 1MB fallback for Node/testing
            }
        } catch (e) {
            console.error("[DiskAdapter] Failed to init OPFS:", e);
            fallbackDisk = new Uint8Array(1024 * 1024);
        }
    };

    this.poll = function() {
        let cmd = mem.getUint8(0, 1);
        if (cmd === 1) { // READ
            let sector = mem.getUint32(4, 1);
            let offset = sector * 512;
            
            try {
                // Read directly into our shared memory buffer view
                let bufferView = new Uint8Array(mem.buffer, 256, 512);
                
                if (accessHandle) {
                    // Sync read from OPFS
                    accessHandle.read(bufferView, { at: offset });
                } else {
                    // Sync read from fallback disk
                    for (let i = 0; i < 512; i++) {
                        bufferView[i] = (offset + i < fallbackDisk.length) ? fallbackDisk[offset + i] : 0;
                    }
                }
                
                mem.setUint8(8, 1, 0); // Status = READY
            } catch (e) {
                console.error("[DiskAdapter] Read Error:", e);
                mem.setUint8(8, 1, 1); // Status = ERROR
            }
            mem.setUint8(0, 1, 0); // Clear Command
            
        } else if (cmd === 2) { // WRITE
            let sector = mem.getUint32(4, 1);
            let offset = sector * 512;
            
            try {
                // Write directly from our shared memory buffer view
                let bufferView = new Uint8Array(mem.buffer, 256, 512);
                
                if (accessHandle) {
                    // Sync write to OPFS
                    accessHandle.write(bufferView, { at: offset });
                    accessHandle.flush();
                } else {
                    // Sync write to fallback disk
                    for (let i = 0; i < 512; i++) {
                        if (offset + i < fallbackDisk.length) {
                            fallbackDisk[offset + i] = bufferView[i];
                        }
                    }
                }
                
                mem.setUint8(8, 1, 0); // Status = READY
            } catch (e) {
                console.error("[DiskAdapter] Write Error:", e);
                mem.setUint8(8, 1, 1); // Status = ERROR
            }
            mem.setUint8(0, 1, 0); // Clear Command
        }
    };

    setInterval(this.poll.bind(this), 16);
}

export default DiskAdapter;