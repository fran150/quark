(function () {
    // Resolve all AMD modules relative to the 'src' directory, to produce the
    // same behavior that occurs at runtime
    require = {
        baseUrl: '../',

        paths: {
            "quark":                "dist/quark",
            "jquery":               "src/bower_modules/jquery/dist/jquery",
            "knockout":             "src/bower_modules/knockout/dist/knockout",
            "knockout-mapping":     "src/bower_modules/knockout-mapping/knockout.mapping",
            "blockui":              "src/bower_modules/blockui/jquery.blockUI",
            "accounting-js":        "src/bower_modules/accounting.js/accounting.min"
        },

    }

    require.shim = {
        "knockout-mapping": { deps: ["knockout"] }
    };

    // It's not obvious, but this is a way of making Jasmine load and run in an AMD environment
    // Credit: http://stackoverflow.com/a/20851265
    var jasminePath = 'test/bower_modules/jasmine/lib/jasmine-core/';
    require.paths['jasmine'] = jasminePath + 'jasmine';
    require.paths['jasmine-html'] = jasminePath + 'jasmine-html';
    require.paths['jasmine-boot'] = jasminePath + 'boot';
    require.shim['jasmine'] = { exports: 'window.jasmineRequire' };
    require.shim['jasmine-html'] = { deps: ['jasmine'], exports: 'window.jasmineRequire' };
    require.shim['jasmine-boot'] = { deps: ['jasmine', 'jasmine-html'], exports: 'window.jasmineRequire' };
})();
