(()=>{
    const loadedPackages = {};
    const loadingPackages = {};

    async function loadPackage(packageName) {
        if (loadedPackages[packageName]) {
            return loadedPackages[packageName];
        }
        if (loadingPackages[packageName]) {
            return loadingPackages[packageName];
        }

        const loadPromise = (async () => {
            try {
                // Fetch the manifest
                let res = await fetch(`scripts/packages/${packageName}/manifest.json`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch manifest for package: ${packageName}`);
                }
                let manifest = await res.json();

                // Load dependencies
                if (manifest.requires) {
                    let depPromises = [];
                    for (let dep in manifest.requires) {
                        depPromises.push(loadPackage(dep));
                    }
                    await Promise.all(depPromises);
                }

                // Inject CSS styles
                if (manifest.styles && Array.isArray(manifest.styles) && window.APP && window.APP.env.isBrowser) {
                    for (let style of manifest.styles) {
                        let link = document.createElement("link");
                        link.rel = "stylesheet";
                        link.type = "text/css";
                        link.href = `scripts/packages/${packageName}/${style}`;
                        document.head.appendChild(link);
                    }
                }

                // Inject Main Script
                if (manifest.main) {
                    if (window.APP && window.APP.scripts) {
                        await window.APP.scripts.load(`scripts/packages/${packageName}/${manifest.main}`);
                    } else {
                        // Fallback using direct dynamic import
                        await import(`../../../scripts/packages/${packageName}/${manifest.main}`);
                    }
                }

                loadedPackages[packageName] = manifest;
                return manifest;
            } catch (err) {
                console.error(err);
                throw err;
            } finally {
                delete loadingPackages[packageName];
            }
        })();

        loadingPackages[packageName] = loadPromise;
        return loadPromise;
    }

    const packageManager = {
        load: loadPackage,
        getLoaded: () => Object.keys(loadedPackages)
    };

    function register() {
        if (window.APP && window.APP.modules) {
            try {
                window.APP.modules.add('packages', packageManager);
            } catch (e) {
                console.error("Failed to register packages module:", e);
            }
        } else {
            setTimeout(register, 10);
        }
    }
    
    register();
})();