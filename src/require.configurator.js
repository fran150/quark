function requireConfigure(bowerDir, timeout) {
    bowerDir = bowerDir || 'bower_components';
    timeout = timeout || 120;

    return {
        baseUrl: ".",
        paths: {
            "bootstrap":            bowerDir + "/bootstrap/dist/js/bootstrap",
            "crossroads":           bowerDir + "/crossroads/dist/crossroads",
            "hasher":               bowerDir + "/hasher/dist/js/hasher",
            "jquery":               bowerDir + "/jquery/dist/jquery",
            "knockout":             bowerDir + "/knockout/dist/knockout",
            "knockout-projections": bowerDir + "/knockout-projections/dist/knockout-projections",
            "signals":              bowerDir + "/js-signals/dist/signals.min",

            "accounting-js":        bowerDir + "/accounting.js/accounting",
            "blockui":              bowerDir + "/blockui/jquery.blockUI",
            "knockout-mapping":     bowerDir + "/knockout-mapping/knockout.mapping",

            "text":                 bowerDir + "/requirejs-text/text",

            "quark":                bowerDir + "/quark/dist/quark",
            "quark-validators":     bowerDir + "/quark/dist/quark-validators",
        },
        shim: {
            "bootstrap": { deps: ["jquery"] },
            "knockout-mapping": { deps: ["knockout"] }
        },
        waitSeconds: timeout
    };
}
