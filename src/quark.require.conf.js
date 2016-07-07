function QuarkRequireConf(bowerDir) {
    bowerDir = bowerDir || 'bower_components';

    return {
        baseUrl: ".",
        paths: {
            "crossroads":           bowerDir + "/crossroads/dist/crossroads",
            "hasher":               bowerDir + "/hasher/dist/js/hasher",
            "jquery":               bowerDir + "/jquery/dist/jquery",
            "knockout":             bowerDir + "/knockout/dist/knockout",
            "signals":              bowerDir + "/js-signals/dist/signals.min",

            "knockout-mapping":     bowerDir + "/knockout-mapping/knockout.mapping",

            "text":                 bowerDir + "/requirejs-text/text",

            "quark":                bowerDir + "/quark/dist/quark",
            "quark-validators":     bowerDir + "/quark/dist/quark-validators",
        },
        shim: {
            "knockout-mapping": { deps: ["knockout"] }
        },
    };
}
