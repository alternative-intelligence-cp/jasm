import { BusAdapter as BusAdapter } from "./bus.js";

function NetworkAdapter(bus){
    let busAdapter = new BusAdapter(bus);
}

export default NetworkAdapter;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* import { Bus as Bus } from "./bus.js";
let bus = new Bus();
let na = new NetworkAdapter(bus); */