import { BusAdapter } from "./bus.js";

function SerialAdapter(bus) {
    let busAdapter = new BusAdapter(bus, 256);
    let mem = busAdapter.sharedMemory;
    this.onTx = null; // Callback for vmWorker.js to forward to main thread

    // Memory Map:
    // Offset 0: TX Command (Write 1 to transmit Offset 4)
    // Offset 4: TX Data (U32)
    // Offset 8: RX Status (1 = Data Available)
    // Offset 12: RX Data (U32)

    // Listen for incoming messages from the bus
    busAdapter.onMsg((msgStr) => {
        try {
            let msg = JSON.parse(msgStr);
            if (msg.name === "serial_rx" && msg.target === busAdapter.getId()) {
                mem.setUint32(12, 1, msg.data);
                mem.setUint32(8, 1, 1);
                
                // We also send a notification to the CPU that data is available
                busAdapter.sendMsg(JSON.stringify({
                    sender: busAdapter.getId(),
                    target: "CPU",
                    type: "INTERRUPT",
                    name: "rx_ready"
                }));
            }
        } catch(e) {}
    });

    this.receiveChar = function(char) {
        let byteCode = char.charCodeAt(0);
        
        // Emulate receiving a message over the bus from the outside world
        // In a multi-VM setup, the outside world would be another VM's SerialAdapter
        mem.setUint32(12, 1, byteCode); 
        mem.setUint32(8, 1, 1);        
        
        // Notify CPU
        busAdapter.sendMsg(JSON.stringify({
            sender: busAdapter.getId(),
            target: "CPU",
            type: "INTERRUPT",
            name: "rx_ready"
        }));
    };

    this.poll = function () {
        let txCmd = mem.getUint32(0, 1);
        if (txCmd === 1) {
            let txByte = mem.getUint32(4, 1);
            let char = String.fromCharCode(txByte);
            
            // Forward to the outside world
            if (this.onTx) {
                this.onTx(char);
            }
            
            // Broadcast over bus (for cross-VM networking in the future)
            busAdapter.sendMsg(JSON.stringify({
                sender: busAdapter.getId(),
                target: "ALL", // Could be configured to a specific VM ID
                type: "EVENT",
                name: "serial_tx",
                data: txByte
            }));
            
            // Clear TX command
            mem.setUint32(0, 1, 0);
        }
    };

    setInterval(this.poll.bind(this), 16);
}

export default SerialAdapter;
