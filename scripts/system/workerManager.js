(()=>{
    const workers = {};

    async function spawnWorker(id, scriptPath) {
        if (workers[id]) {
            throw new Error(`Worker with ID ${id} already exists.`);
        }

        let workerObj;
        if (window.APP && window.APP.env.isNode) {
            // Use dynamic import for Node's worker_threads to avoid breaking Webpack/Browser environments
            const { Worker } = await import('worker_threads');
            workerObj = new Worker(scriptPath);
        } else {
            // Standard Web Worker
            workerObj = new Worker(scriptPath, { type: 'module' });
        }

        workers[id] = {
            instance: workerObj,
            onMessage: null
        };
        
        // Setup listener
        if (window.APP && window.APP.env.isNode) {
            workerObj.on('message', (msg) => {
                handleMessage(id, msg);
            });
        } else {
            workerObj.onmessage = (e) => {
                handleMessage(id, e.data);
            };
        }
        
        return id;
    }

    function handleMessage(id, msg) {
        if (workers[id] && workers[id].onMessage) {
            workers[id].onMessage(msg);
        }
    }

    function listenToWorker(id, callback) {
        if (!workers[id]) throw new Error(`Worker ${id} not found`);
        workers[id].onMessage = callback;
    }

    function sendToWorker(id, msg, transferList) {
        if (!workers[id]) throw new Error(`Worker ${id} not found`);
        // Node's worker_threads and Web Workers both use postMessage
        if (transferList) {
            workers[id].instance.postMessage(msg, transferList);
        } else {
            workers[id].instance.postMessage(msg);
        }
    }

    function terminateWorker(id) {
        if (!workers[id]) return;
        workers[id].instance.terminate();
        delete workers[id];
    }

    const workerManager = {
        spawn: spawnWorker,
        listen: listenToWorker,
        send: sendToWorker,
        terminate: terminateWorker
    };

    function register() {
        if (window.APP && window.APP.modules) {
            try {
                window.APP.modules.add('workers', workerManager);
            } catch (e) {
                console.error("Failed to register workers module:", e);
            }
        } else {
            setTimeout(register, 10);
        }
    }
    
    register();
})();
