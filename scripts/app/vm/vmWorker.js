import { VM } from './vm.js';
import KeyboardAdapter from './keyboardAdapter.js';
import MouseAdapter from './mouseAdapter.js';
import PPUAdapter from './ppuAdapter.js';
import AudioAdapter from './audioAdapter.js';
import SerialAdapter from './serialAdapter.js';
import DiskAdapter from './diskAdapter.js';

let vm = new VM();
let keyboard = new KeyboardAdapter(vm.bus); // devId 0
let mouse = new MouseAdapter(vm.bus);       // devId 1
let display = new PPUAdapter(vm.bus);       // devId 2
let audio = new AudioAdapter(vm.bus);       // devId 3
let serial = new SerialAdapter(vm.bus);     // devId 4
serial.onTx = function(char) {
    postMessage({ type: "SERIAL_TX", data: char });
};
let disk = new DiskAdapter(vm.bus);         // devId 5

let workerReady = false;

// Initialize Async Adapters
async function initWorker() {
    await disk.init();
    workerReady = true;
    sendMessage({ type: 'EVENT', event: 'ready' });
}
initWorker();

audio.onPlay = (freq, dur, type) => {
    sendMessage({ type: 'EVENT', event: 'audio', data: { freq, dur, type } });
};

serial.onTx = (char) => {
    sendMessage({ type: 'EVENT', event: 'serial_tx', data: char });
};

function sendMessage(msg) {
    if (port) {
        port.postMessage(msg);
    }
}

vm.listenEvent("step", (stats) => {
    sendMessage({ type: 'EVENT', event: 'step', data: stats });
});

vm.listenEvent("done", (code) => {
    sendMessage({ type: 'EVENT', event: 'done', data: code });
});

vm.listenEvent("started", (mode) => {
    sendMessage({ type: 'EVENT', event: 'started', data: mode });
});

vm.listenEvent("print", (msg) => {
    sendMessage({ type: 'PRINT', data: msg });
});

vm.listenEvent("error", (msg) => {
    sendMessage({ type: 'EVENT', event: 'error', data: msg });
});

let isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
let port = null;

async function init() {
    if (isNode) {
        const worker_threads = await import('worker_threads');
        port = worker_threads.parentPort;
        port.on('message', handleMessage);
    } else {
        port = self;
        port.onmessage = (e) => handleMessage(e.data);
    }
}

function handleMessage(msg) {
    if (!msg) return;
    
    // We can queue messages if not ready, but for simplicity, we assume main thread awaits 'ready' event.
    if (!workerReady && (msg.type === 'LOAD' || msg.type === 'START')) {
        console.warn("Worker received command before ready, ignoring.");
        return;
    }

    switch (msg.type) {
        case 'LOAD':
            vm.load(msg.program);
            break;
        case 'START':
            vm.start(msg.mode || "run");
            break;
        case 'HALT':
            vm.halt();
            break;
        case 'RESET':
            vm.reset();
            break;
        case 'INPUT':
            handleInput(msg.event, msg.data);
            break;
        case 'INIT_DISPLAY':
            display.setCanvas(msg.canvas);
            break;
        default:
            console.warn("Unknown message received in VM Worker:", msg);
            break;
    }
}

function handleInput(event, data) {
    if (event === 'keydown') {
        keyboard.key_down(data.keyCode);
    } else if (event === 'keyup') {
        keyboard.key_up(data.keyCode);
    } else if (event === 'mousemove') {
        mouse.mouseMove(data.x, data.y);
    } else if (event === 'mousedown') {
        mouse.mouseDown(data.button);
    } else if (event === 'mouseup') {
        mouse.mouseUp(data.button);
    } else if (event === 'serial_rx') {
        serial.receiveChar(data.char);
    }
}

init();
