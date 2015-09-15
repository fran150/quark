(function() {
    // Reference your test modules here
    var testModules = [
        'modules/utils-testFunctions',
        'modules/utils-cloning',
        'modules/utils-misc',
        'modules/web',
        'modules/behaviours',
        'modules/web',
        'modules/knockout-bindings',
        'modules/knockout-extensions',
        'modules/core-parameters',
        'modules/core-config',
        'modules/core-call',
        'modules/core-inject',
        'modules/routing'
    ];

    // After the 'jasmine-boot' module creates the Jasmine environment, load all test modules then run them
    require(['jasmine-boot'], function () {
        var modulesCorrectedPaths = testModules.map(function(m) { return 'test/' + m; });
        require(modulesCorrectedPaths, window.onload);
    });
})();
