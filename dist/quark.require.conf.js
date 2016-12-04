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

            "quark":                bowerDir + "/quark/dist/quark.min",
            "quark-debug":          bowerDir + "/quark/dist/quark",
            "quark-testviewloader": bowerDir + "/quark/dist/testview.loader",

            "stacktrace":           bowerDir + "/stacktrace-js/dist/stacktrace-with-promises-and-json-polyfills.min"
        },
        shim: {
            "knockout-mapping": { deps: ["knockout"] }
        },
    };
}
