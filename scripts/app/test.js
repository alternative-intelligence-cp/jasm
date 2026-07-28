console.log("hello from test.js");
console.log("APP.settings.get('name') -> " + APP.settings.get("name"));
APP.settings.set('name','newName');
console.log("APP.settings.get('name') -> " + APP.settings.get("name"));

let base = {
    a:10
};
let t1= {
    base:base
};
let t2 = APP.utils.copy(t1);
t2.base.a =11;
console.log(`t1->base->a= ${t1.base.a}, t2->base->a= ${t2.base.a}`);

let t3= APP.utils.clone(t1);
t3.base.a=12;
console.log(`t1->base->a= ${t1.base.a}, t3->base->a= ${t3.base.a}`);

APP.messenger.create('test');
APP.messenger.listen('test',(message)=>{
    console.log("got a message from test channel: " + message);
});
APP.messenger.send('test','this is a test');
APP.messenger.broadcast('this is a test of broadcast');

APP.state.set("test",123,false);
APP.state.set("testConst",234,true);
console.log(APP.state.get("test"));
console.log(APP.state.get("testConst"));
try {
    APP.state.set("testConst",444,true);
}catch(e){console.error(e)};

APP.utils.fetchData("data/settings.json").then((data)=>{
    console.log("fetch test on 'data/settings.json' == " + JSON.stringify(data));
});

APP.addTask(()=>{console.log("testing addTask 1");});
APP.addTask(()=>{console.log("testing addTask 2");});
APP.addTask(()=>{console.log("testing addTask 3");});
APP.content.append("html/test.html",()=>{
    APP.content.appendRaw("yo yo yo");
});
