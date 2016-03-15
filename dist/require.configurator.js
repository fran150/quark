function requireConfigure(requireConfig, bowerDir, timeout) {
    bowerDir = bowerDir || 'bower_components';
    timeout = timeout || 120;

    /*
    * Recursively merge properties of two objects
    */
    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if ( obj2[p].constructor==Object ) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch(e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }

        return obj1;
    }

    var quarkConfig = {
        baseUrl: ".",
        paths: {
            "crossroads":           bowerDir + "/crossroads/dist/crossroads",
            "hasher":               bowerDir + "/hasher/dist/js/hasher",
            "jquery":               bowerDir + "/jquery/dist/jquery",
            "knockout":             bowerDir + "/knockout/dist/knockout",
            "knockout-projections": bowerDir + "/knockout-projections/dist/knockout-projections",
            "signals":              bowerDir + "/js-signals/dist/signals.min",

            "knockout-mapping":     bowerDir + "/knockout-mapping/knockout.mapping",

            "text":                 bowerDir + "/requirejs-text/text",

            "quark":                bowerDir + "/quark/dist/quark",
            "quark-validators":     bowerDir + "/quark/dist/quark-validators",
        },
        shim: {
            "knockout-mapping": { deps: ["knockout"] }
        },
        waitSeconds: timeout
    };

    return mergeRecursive(requireConfig, quarkConfig);
}
