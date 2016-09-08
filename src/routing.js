function QuarkRouter() {
    var self = this;

    this.controllersBase = 'controllers';

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    this.current = {
        name: ko.observable(''),
        components: []
    };

    var pages = {};
    var mappings = {};
    var routes = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig) {
        $.extend(pages, pagesConfig);
    }

    function clear(index) {
        // Get all parts in name
        var names = self.current.name().split('/');
        var fullName = "";
        var finalName = "";

        // Iterate over all name parts
        for (var i = 0; i < names.length; i++) {
            // Get the name and full name
            var name = names[i];
            fullName = fullName ? fullName + '/' + name : name;

            // Passing index it starts to delete
            if (i >= index) {
                var components = pages[fullName];

                for (var item in components) {
                    self.current.components[item]('empty');
                }
            } else {
                finalName = fullName;
            }
        }

        self.current.name(finalName);
    }

    function findIndex(newPage) {
        var oldNames = self.current.name().split('/');
        var newNames = newPage.split('/');

        for (var i = 0; i < newNames.length; i++) {
            if (oldNames[i] != newNames[i]) {
                return i;
            }
        }
    }

    function add(newPage, index) {
        var newNames = newPage.split('/');
        var fullName;

        for (var i = 0; i < newNames.length; i++) {
            // Get the name and full name
            var name = newNames[i];
            fullName = fullName ? fullName + '/' + name : name;

            // Passing index it starts to add or change components
            if (i >= index) {
                var componentsValues = pages[fullName];

                for (var item in componentsValues) {
                    if (self.current.components[item]) {
                        self.current.components[item](componentsValues[item]);
                    } else {
                        self.current.components[item] = ko.observable(componentsValues[item]);
                    }
                }
            }
        }

        self.current.name(newPage);
    }

    function createRoute(page, hash) {
        // Create a route for the page and hash
        routes[page] = csRouter.addRoute(hash, function(parameters) {
            var index = findIndex(page);
            clear(index);
            add(page, index);
        });
    }

    // Configure routes for pages
    this.mapRoute = function(maps) {
        for (var page in maps) {
            var hash = maps[page];

            createRoute(page, hash);

            mappings[page] = hash;
        }
    }

    this.parse = function(hash) {
        csRouter.parse(hash);
    }

    this.activateHasher = function(callback) {
        function parseHash(newHash, oldHash) {
            if ($$.isDefined(callback)) {
                callback(newHash, oldHash);
            } else {
                self.parse(newHash);
            }
        }

        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }
}

// Create the quark router
$$.routing = new QuarkRouter();
