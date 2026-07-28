(()=>{
    function init(){
        //load system
        let systemScripts = document.getElementById('app_script_system');
        let system = document.createElement("script");
        system.type="module";
        system.src="scripts/system/system.js?v=" + Date.now();
        systemScripts.appendChild(system);
        system.onload = (e)=>{
            //load workerManager
            let wrkLoader = document.createElement("script");
            wrkLoader.type="module";
            wrkLoader.src="scripts/system/workerManager.js?v=" + Date.now();
            systemScripts.appendChild(wrkLoader);
            wrkLoader.onload = (e) => {
                //load packageLoader
                let pkgLoader = document.createElement("script");
                pkgLoader.type="module";
                pkgLoader.src="scripts/system/packageLoader.js?v=" + Date.now();
                systemScripts.appendChild(pkgLoader);
                pkgLoader.onload = (e) => {
                    //load entry point (html/main.html, scripts/app/main.js)
                    let content = document.getElementById('app_content_container');
                    let userScripts = document.getElementById('app_script_app');
                    fetch("html/main.html?v=" + Date.now()).then((response)=>{
                        if (!response.ok) { 
                            throw new Error(`HTTP error: ${response.status}`); 
                        }
                        return response.text();
                    }).then((html)=>{
                        content.innerHTML = html;
                        let user = document.createElement("script");
                        user.type="module";
                        user.src="scripts/app/main.js?v=" + Date.now();
                        userScripts.appendChild(user)
                    }).catch((e)=>{
                        console.error(e);
                        content.innerHTML= "An error occurred when loading the page!"
                    });
                };
            };
        };
    }
    if (document.readyState === 'loading') {
        // Document is still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready (interactive or complete), run right away
        init();
    }
})();
