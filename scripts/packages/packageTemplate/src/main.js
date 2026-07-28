((package)=>{
        if(!APP || !APP.modules || !APP.modules.add){ 
            return { err: { msg: "APP system not found!", code: 1, source: `${ package.vendor }.${ package.name }` } };
        }

        ///// MODULE ///////////////////////////////////////////////////////////////////////////////////////////////////
        const private = {
            a:1,
            b:2
        };
        const public = {
            getA:getA,
            setA:setA,
            getB:getB,
            setB:setB,
            getSum:getSum
        };

        ///// EXPORT ///////////////////////////////////////////////////////////////////////////////////////////////////
        APP.modules.add(package.name,public);

        ///// FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////////////
        function getA(){
            return private.a;
        }
        function setA(val){
            if(typeof val == 'number'){
                private.a = val;
                return true;
            }
            return false;
        }
        function getB(){
            return private.b;
        }
        function setB(val){
            if(typeof val == 'number'){
                private.b = val;
                return true;
            }
            return false;
        }
        function getSum(){
            return private.a + private.b;
        }

})({

    name: "PackageTemplate",
    vendor: "Package_Vendor",
    version: "0.0.0.0"
    
});