
function EventManager(){
    let events = {};
    this.addEvent = function(eventId){
        if(events.hasOwnProperty(eventId)){ console.error("event with id " + eventId + " already exists"); return false; }
        events[eventId] = new Event(eventId);
        return true;
    };
    this.removeEvent = function(eventId){
        if(!events.hasOwnProperty(eventId)){ console.error("no event with id " + eventId + " found"); return false; }
        delete events[eventId];
        return true;
    };
    this.listenEvent = function(eventId,listener){
        if(!events.hasOwnProperty(eventId)){ console.error("no event with id " + eventId + " found"); return null; }
        if(typeof listener != 'function'){ console.error("listener must be a function"); return null; }
        let event = events[eventId];
        let id = event.nextId;
        event.nextId += 1;
        event.listeners[id]=listener;
        return id;
    };
    this.ignoreEvent = function(eventId,listenerId){
        if(!events.hasOwnProperty(eventId)){ console.error("no event with id " + eventId + " found"); return false; }
        let event = events[eventId];
        if(listeners.hasOwnProperty(listenerId)){
            delete listeners[listenerId];
            return true;
        }
        console.error("listener id " + listenerId + " not found");
        return false;
    };
    this.raiseEvent = function(eventId,data){
        if(!events.hasOwnProperty(eventId)){ console.error("no event with id " + eventId + " found"); return false; }
        let event = events[eventId];
        let listeners = event.listeners;
        for(let l in listeners){
            setTimeout(listeners[l],0,data);
        }
        return true;
    };
    this.getEvents = function(){
        let out = [];
        for(let e in events){
            if(events.hasOwnProperty(e)){
                out.push(e);
            }
        }
        return out;
    };
    function Event(id){
        this.listeners = {};
        this.nextId = 0;
        this.id = id;
    }
}
export default EventManager;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* let em = new EventManager();
em.addEvent("test");
let listenerId = em.listenEvent("test",(data)=>{
    console.log(data);
});
em.raiseEvent("test","this is test data"); */
