((package)=>{
    if(typeof APP !== 'object' || !APP.modules || !APP.modules.add){ 
        return { err: { msg: "APP system not found!", code: 1, source: `${ package.vendor }.${ package.name }` } };
    }

    ///// MODULE ///////////////////////////////////////////////////////////////////////////////////////////////////
    function Options(parent,width,height,x,y,msg,imgSrc,bgColor,fgColor,borderColor,shadowColor,optionsArray,onSelect){
        let opts = document.createElement("div");
        let opts_img=document.createElement("img");
        let opts_msg=document.createElement("p");
        let opts_opts=[];
        let opts_val=-1;
        for(let i in optionsArray){
            let opt = document.createElement("div");
            opt.id=i;
            opt.val = optionsArray[i];
            opt.textContent=opt.val;
            opt.textAlign="left";
            opt.clickHandler = opt.addEventListener("click",function(){
                optSelected(opt.val);
            });
            opts_opts.push(opt);
        }

        opts.style.width = width + "px";
        opts.style.height = height + "px";
        opts.style.position = "absolute";
        opts.style.left = x + "px";
        opts.style.top = y + "px";
        opts.style.backgroundColor=bgColor;
        opts.style.color=fgColor;
        opts.style.zIndex = 100;
        opts.style.textAlign="center";
        opts.style.borderRadius="5px";
        opts.style.borderColor=borderColor;
        opts.style.borderStyle="solid";
        opts.style.borderWidth="2px";
        opts.style.padding="5px";
        opts.style.boxSizing="border-box";
        if(shadowColor !== "none"){
            // "[inset] offset-x offset-y blur-radius spread-radius color"
            opts.style.boxShadow = "2px 2px 5px 0px " + shadowColor;
        }

        opts_img.src = imgSrc;
        opts_img.style.width = Math.floor(width * .20) + "px";
        opts_img.style.height = Math.floor(width * .20) + "px";

        opts_msg.textContent=msg;

        opts.appendChild(opts_img);
        opts.appendChild(opts_msg);
        for(let o in opts_opts){
            opts.appendChild(opts_opts[o]);
        }
        parent.appendChild(opts);

        ///// FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////////////
        function optSelected(option){
            opts_val = option;
            if(typeof onSelect == 'function'){
                onSelect(option);
            }
            parent.removeChild(opts);
        }
    }

    ///// EXPORT ///////////////////////////////////////////////////////////////////////////////////////////////////////
    APP.modules.add(package.name,Object.freeze(Options));

})({

name: "Options",
vendor: "Shaglama",
version: "0.0.0.0"

});