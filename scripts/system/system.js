((params)=>{///// APP SYSTEM ///////////////////////////////////////////////////
    const app = {
        scripts: typeof document !== 'undefined' ? document.getElementById('app_script_app') : null,
        content: typeof document !== 'undefined' ? document.getElementById('app_content_container') : null,
        settings:{
            
        },
        modules:{

        },
        messenger:{
            channels:{

            }
        },
        state:{

        },
        queue: new Queue(16)
    };
    const publicInterface = {
        env: {
            isNode: typeof process !== 'undefined' && process.versions != null && process.versions.node != null,
            isBrowser: typeof window !== 'undefined' && typeof window.document !== 'undefined'
        },
        settings: {
            get: getSetting,
            set: setSetting,
        },
        modules: {
            add: addModule,
            get: getModule,
            rem: removeModule,
            list: listModules
        },
        messenger: {
            create: createChannel,
            listen: listenToChannel,
            unlisten: unlistenFromChannel,
            broadcast: sendToAllChannels,
            send: sendToChannel,
            request: requestChannel,
            reply: replyChannel
        },
        content: {
            replace: loadHTML,
            append: appendHTML,
            prepend: prependHTML,
            replaceRaw: replaceRawHTML,
            appendRaw: appendRawHTML,
            prependRaw: prependRawHTML,
            clear:clearHTML
        },
        scripts:{
            load:loadScript,
            unload:unloadScript,
            clear: clearScripts
        },
        state:{
            get:getState,
            set:setState,
            remove:removeState,
            keys:getStateKeys,
            clear:clearStates
        },
        utils:{
            copy:fullCopy,
            clone:clone,
            fetchData:fetchData
        },
        addTask:app.queue.push
    };

    init();
    
    ///// FUNCTIONS ////////////////////////////////////////////////////////////
    async function init(){
        try{
            app.settings = await getSettings();
            window.APP = Object.freeze(publicInterface);
            console.log("APP SYSTEM -- Version " + params.version );
        }catch(e){
            console.error(e);
        }
    }

    async function getSettings(){
        try{
            let response = await fetch("data/settings.json")
            let json = await response.json();
            return json;
        }catch(e){
            console.error(e);
        }
       
    }

    function APP_ERROR(type,code,message,data){
        this.type=type;
        this.code=code;
        this.message=message;
        this.data=data;
    }
    
    function getSetting(name){
        if(!app.settings.hasOwnProperty(name)){
            throw new APP_ERROR("NOT_FOUND", 10, `Setting with name '${name}' not found!`,null);
        }
        return app.settings[name];   
    }
    function setSetting(name,value){
        app.settings[name]=value;
    }    
    function addModule(name,module){
        if(app.modules.hasOwnProperty(name)){
            throw new APP_ERROR("ALREADY_EXISTS", 10, `Setting with name '${name}' already exists!`,null);
        }
        app.modules[name]=Object.freeze(module);
        return app.modules[name];
    }
    function getModule(name){
        if(!app.modules.hasOwnProperty(name)){
            throw new APP_ERROR("NOT_FOUND", 10, `Module with name '${name}' not found!`,null);
        }
        return app.modules[name];
    }
    function removeModule(name){
        if(!app.modules.hasOwnProperty(name)){
            throw new APP_ERROR("NOT_FOUND", 10, `Module with name '${name}' not found!`,null);
        }
        let removed = app.modules[name];
        delete app.modules[name];
        return removed;
    }
    function listModules(){
        let mods=[];
        for(let mod in app.modules){
            if(app.modules.hasOwnProperty(mod)){
                mods.push(mod);
            }
        }
        return mods;
    }

    function getNextListenerId(channel){
        if(!app.messenger.channels.hasOwnProperty(channel)){
            throw new APP_ERROR("NOT_FOUND", 15, `Channel with name '${channel}' not found!`,null);
        }
        let targetChannel = app.messenger.channels[channel];
        let id = targetChannel.nextListenerId;
        targetChannel.nextListenerId += 1;
        return id;
    }
    function createChannel(name){
        if(app.messenger.channels.hasOwnProperty(name)){
            throw new APP_ERROR("ALREADY_EXISTS",13,`Channel with name '${name}' already exists!`,null);
        }
        app.messenger.channels[name]={
            nextListenerId:0,
            listeners:{},
            replier: null,
            data:{}
        };
        return name;
    }
    function removeChannel(channel){
        if(!app.messenger.channels.hasOwnProperty(channel)){
            throw new APP_ERROR("NOT_FOUND", 15, `Channel with name '${channel}' not found!`,null);
        }
        let old = app.messenger.channels[channel];
        delete app.messenger.channels[channel];
        return old;  
    }
    function listChannels(){
        let channels=[];
        for(let channel in app.messenger.channels){
            if(app.messenger.channels.hasOwnProperty(channel)){
                channels.push(channel);
            }
        }
        return channels;
    }
    function listenToChannel(channel,listener){
        if(!app.messenger.channels.hasOwnProperty(channel)){
            throw new APP_ERROR("NOT_FOUND", 17, `Channel with name '${channel}' not found!`,null);
        }
        let targetChannel = app.messenger.channels[channel];
        let id = targetChannel.nextListenerId;
        targetChannel.nextListenerId += 1;
        targetChannel.listeners[id] = listener;
        return id;
    }
    function unlistenFromChannel(channel, id){
        if(!app.messenger.channels.hasOwnProperty(channel)){
            return false;
        }
        let targetChannel = app.messenger.channels[channel];
        if (targetChannel.listeners.hasOwnProperty(id)) {
            delete targetChannel.listeners[id];
            return true;
        }
        return false;
    }
    function sendToAllChannels(message){
        for(let channel in app.messenger.channels){
            if(app.messenger.channels.hasOwnProperty(channel)){
                setTimeout(()=>{
                    sendToChannel(channel,message)
                },0);
            }
        }
    }
    function sendToChannel(channel, message){
        if(!app.messenger.channels.hasOwnProperty(channel)){
            throw new APP_ERROR("NOT_FOUND", 17, `Channel with name '${channel}' not found!`,null);
        }
        let listeners = app.messenger.channels[channel].listeners;
        for(let listenerId in listeners){
            setTimeout(()=>{
                if (listeners[listenerId]) listeners[listenerId](message);
            },0);
        }
    }
    function replyChannel(channel, handler) {
        if(!app.messenger.channels.hasOwnProperty(channel)){
            throw new APP_ERROR("NOT_FOUND", 17, `Channel with name '${channel}' not found!`,null);
        }
        let targetChannel = app.messenger.channels[channel];
        targetChannel.replier = handler;
    }
    function requestChannel(channel, message) {
        return new Promise(async (resolve, reject) => {
            if(!app.messenger.channels.hasOwnProperty(channel)){
                return reject(new APP_ERROR("NOT_FOUND", 17, `Channel with name '${channel}' not found!`,null));
            }
            let targetChannel = app.messenger.channels[channel];
            if (!targetChannel.replier) {
                return reject(new APP_ERROR("NO_REPLIER", 18, `No replier attached to channel '${channel}'!`,null));
            }
            try {
                resolve(await targetChannel.replier(message));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function loadScript(src){
        if (publicInterface.env.isBrowser) {
            return await import(new URL(src, window.location.origin).href);
        } else {
            return await import(src);
        }
    }
    function unloadScript(scriptElement){
        if (publicInterface.env.isBrowser && app.scripts && scriptElement) {
            return app.scripts.removeChild(scriptElement);
        }
    }
    function clearScripts(){
        if (publicInterface.env.isBrowser && app.scripts) {
            app.scripts.innerHTML="";
        }
    }

    function loadHTML(src,after){
        if (!publicInterface.env.isBrowser || !app.content) return;
        fetch(src)
            .then((response)=>{
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                return response.text();
            })
            .then((html)=>{
                app.content.innerHTML = html;
                if(after && typeof after == "function"){ 
                    after();
                }
            })
            .catch((err)=>{
                console.error(err);
            });
    }
    function appendHTML(src,after){
        if (!publicInterface.env.isBrowser || !app.content) return;
        fetch(src)
            .then((response)=>{
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                return response.text();
            })
            .then((html)=>{
                app.content.innerHTML = app.content.innerHTML + html;
                if(after && typeof after == "function"){ 
                    after();
                }
            })
            .catch((err)=>{
                console.error(err);
            });
    }
    function prependHTML(src,after){
        if (!publicInterface.env.isBrowser || !app.content) return;
        fetch(src)
            .then((response)=>{
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                return response.text();
            })
            .then((html)=>{
                app.content.innerHTML = html + app.content.innerHTML;
                if(after && typeof after == "function"){ 
                    after();
                }
            })
            .catch((err)=>{
                console.error(err);
            });
    }
    function replaceRawHTML(htmlString){
        if (publicInterface.env.isBrowser && app.content) app.content.innerHTML = htmlString;
    }
    function prependRawHTML(htmlString){
        if (publicInterface.env.isBrowser && app.content) app.content.innerHTML = htmlString + app.content.innerHTML;
    }
    function appendRawHTML(htmlString){
        if (publicInterface.env.isBrowser && app.content) app.content.innerHTML = app.content.innerHTML + htmlString;
    }
    function clearHTML(){
        if (publicInterface.env.isBrowser && app.content) app.content.innerHTML="";
    }

    function getState(key){
        if(!app.state.hasOwnProperty(key)){
            throw new APP_ERROR("NOT_FOUND", 17, `State key '${key}' not found!`,null);
        }
        return app.state[key].value;
    }
    function setState(key,value,isConstant){
        if(app.state.hasOwnProperty(key)){
            if(app.state[key].isConstant == true){
                throw new APP_ERROR("MODIFY_CONSTANT",68, `Attempted to modify constant 'settings.${key}'!`,null);
            }
        }
        app.state[key] = { value:value, isConstant:isConstant};
        return app.state[key];
    }
    function removeState(key){
        if(!app.state.hasOwnProperty(key)){
            throw new APP_ERROR("NOT_FOUND", 17, `State key '${key}' not found!`,null);
        }
        if(app.state[key].isConstant == true){
            throw new APP_ERROR("MODIFY_CONSTANT",69, `Attempted to modify constant 'settings.${key}!`,null);
        }
        let old = app.state[key].value;
        delete app.state[key];
        return old;
    }
    function getStateKeys(){
        let keys = [];
        for(let key in app.state){
            keys.push(key);
        }
        return keys;
    }
    function clearStates(){
        app.state = {};
    }

    function fullCopy(value){
        let copy;
        switch(typeof value){
            case 'object':
                copy={};
                for(let prop in value){
                    if(value.hasOwnProperty(prop)){
                        copy[prop]=fullCopy(value[prop]);
                    }
                }
                break;
            case 'array':
                copy=[];
                for(let i = 0; i < value.length; i++){
                    copy.push(fullCopy(value[i]));
                }
                break;
            default:
                copy=value;
                break;
        }
        return copy;
    }
    function clone(value){
        let clone;
        switch(typeof value){
            case 'object':
                clone={};
                for(let prop in value){
                    if(value.hasOwnProperty(prop)){
                        clone[prop]=value[prop];
                    }
                }
                break;
            case 'array':
                clone=[];
                for(let i = 0; i < value.length; i++){
                    clone.push(value[i]);
                }
                break;
            default:
                clone = value;
                break;
        }
        return clone
    }
    async function fetchData(url){
        let res = await fetch(url);
        let text = await res.text();
        let data;
        if(text == ""){
            throw new APP_ERROR("DATA_ERROR",100,"Failed to fetch data. Got empty response from server!",null);
        }
        try {
            data = JSON.parse(text);
            return data;
        }catch(e){
            console.error(e);
            return null;
        }
    }
    function Task(id,action){
        this.getId = function(){return id;};
        this.getAction = function(){return action;};
    }
    function Queue(initialSize){
        let queue = [];
        let nextId= 0;
        let length=0;
        let head=0;
        let size=initialSize;
        let processing=false;
        this.push=push;
        this.pop=pop;
        this.clear=clear;
        this.count=getCount;
        this.size=getSize;
    
        ///// FUNCTIONS ////////////////////////////////////////////////////////
        function process(){
            if(length == 0){
                processing = false;
                return;
            }
            
            let task = pop();
            if(task != null){
                setTimeout(task,0);
            }
            process();
        }
        
        function clear(){
            queue = [size];
        }
        function getCount(){
            return length;
        }
        function getSize(){
            return size;
        }
        function map(logicalIndex){
            if(logicalIndex > length){
                return -1;
            }
            let physicalIndex = head + logicalIndex;
            if(physicalIndex >= size){
                return physicalIndex - size;
            }
            return physicalIndex;
        }
        function find(id){
            let physical = head;
            for(let i =0; i < length; i++){
                if(queue[physical].id == id){
                    return physical;
                }
                if(physical +1 == size){
                    physical = 0;
                } else {
                    physical++;
                }
            }
            return -1;
        }
        function growQueue(){
            let newSize = size * 2;
            let newQueue = [];
            for(let i = head, j=0;j<length;i++,j++){
                if(i == size){ i = 0;}
                newQueue[j]=queue[i];
            }
            for(let i = 0; i < length; i++){
                queue[i]=newQueue[i];
            }
            size = newSize;
            return size;
        }
        function push(task){
            if(length >= size){
                growQueue();
            }
            let index = map(length);
            length++;
            let t = new Task(nextId++,task);
            queue[index] = t;
            if(!processing){processing = true; process();}
        }
        function pop(){
            if(length == 0){ return null; }
            let element = queue[head];
            let task = element.getAction();
            head++;
            if(head == size){ head = 0; }
            length--;
            if(length == 0){head=0};
            return task;
        }
    }


})({///// SYSTEM PARAMETERS ////////////////////////////////////////////////////
    version:"0.0.0"
});