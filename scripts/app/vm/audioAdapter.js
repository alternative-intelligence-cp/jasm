import { BusAdapter } from "./bus.js";

function AudioAdapter(bus) {
    let busAdapter = new BusAdapter(bus, 256);
    let mem = busAdapter.sharedMemory;
    this.onPlay = null; 

    // Memory Map:
    // 0: Command (1 = Play Tone)
    // 4: Frequency (Hz)
    // 8: Duration (ms)
    // 12: Waveform Type (0=sine, 1=square, 2=sawtooth, 3=triangle)

    this.poll = function () {
        let cmd = mem.getUint32(0, 1);
        if (cmd === 1) { // PLAY TONE
            let freq = mem.getUint32(4, 1);
            let dur = mem.getUint32(8, 1);
            let waveType = mem.getUint32(12, 1);
            
            if (this.onPlay) {
                this.onPlay(freq, dur, waveType);
            }
            
            // Clear command so it doesn't loop forever
            mem.setUint32(0, 1, 0);
        }
    };
    
    // Poll for commands
    setInterval(this.poll.bind(this), 16);
}
export default AudioAdapter;