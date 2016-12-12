function QuarkRequireConf(bowerDir, debug) {
    bowerDir = bowerDir || 'bower_modules';
    debug = debug || false;
    var paths;

    if (debug) {
        paths = {
            "crossroads":           bowerDir + "/crossroads/dist/crossroads",
            "hasher":               bowerDir + "/hasher/dist/js/hasher",
            "jquery":               bowerDir + "/jquery/dist/jquery",
            "knockout":             bowerDir + "/knockout/dist/knockout.debug",
            "signals":              bowerDir + "/js-signals/dist/signals",

            "knockout-mapping":     bowerDir + "/knockout-mapping/knockout.mapping",

            "text":                 bowerDir + "/requirejs-text/text",
            "loadCss":              bowerDir + "/require-loadcss/css",

            "quark":                bowerDir + "/quark/dist/quark",
            "quark-testing-helper": bowerDir + "/quark/dist/testing.helper",

            "stacktrace":           bowerDir + "/stacktrace-js/dist/stacktrace-with-promises-and-json-polyfills"
        }
    } else {
        paths = {
            "crossroads":           bowerDir + "/crossroads/dist/crossroads.min",
            "hasher":               bowerDir + "/hasher/dist/js/hasher.min",
            "jquery":               bowerDir + "/jquery/dist/jquery.min",
            "knockout":             bowerDir + "/knockout/dist/knockout",
            "signals":              bowerDir + "/js-signals/dist/signals.min",

            "knockout-mapping":     bowerDir + "/knockout-mapping/knockout.mapping",

            "text":                 bowerDir + "/requirejs-text/text",
            "loadCss":              bowerDir + "/require-loadcss/css",

            "quark":                bowerDir + "/quark/dist/quark.min",
            "quark-testing-helper": bowerDir + "/quark/dist/testing.helper",

            "stacktrace":           bowerDir + "/stacktrace-js/dist/stacktrace-with-promises-and-json-polyfills.min"
        }
    }


    return {
        baseUrl: ".",
        paths: paths,
        shim: {
            "knockout-mapping": { deps: ["knockout"] }
        }
    };
}
