define(['quark', 'jasmine-boot'], function($$, jazmine) {
    // Reference your test modules here

    var testModules = [
        'specs/behaviours.test',
        'specs/knockout-extensions.test',
        'specs/parameters.test',
        'specs/utils-cloning.test',
        'specs/utils-misc.test',
        'specs/utils-test-functions.test',
        'specs/web.test'
    ];

    // After the 'jasmine-boot' module creates the Jasmine environment, load all test modules then run them
    var modulesCorrectedPaths = testModules.map(function(m) { return m; });

    require(modulesCorrectedPaths, function() {
        window.onload();
    });

    // Init Quark
    $$.start();
});
