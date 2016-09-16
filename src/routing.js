function QuarkRouter() {
    var self = this;

    this.controllersBase = 'controllers';

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    this.current = {
        name: ko.observable(),
        controllers: {}
    };

    var pages = {};
    var mappings = {};
    var routes = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig) {
        $.extend(pages, pagesConfig);
    }

    // Gets the index and full path name of the shared parts
    // between the old and the new page
    function findPosition(newPage) {
        // Get the current page name
        var currentName = self.current.name();

        // If theres a current page, split its components
        // If not return the first position
        var oldNames;
        if (currentName) {
            oldNames = currentName.split('/')
        } else {
            return { index: 0 }
        }

        // Split the new name parts
        var newNames = newPage.split('/');
        var fullName;

        // Compare each route and return the position where
        // they diverge
        for (var i = 0; i < newNames.length; i++) {
            if (oldNames[i] != newNames[i]) {
                return { index: i, fullName: fullName };
            } else {
                fullName = fullName ? fullName + '/' + oldNames[i] : oldNames[i];
            }
        }

        // The page is the same, return the last index and the full name
        return { index: newNames.length, fullName: fullName }
    }

    function addControllers(page, position, callback) {
        var names = [];

        if (page) {
            names = page.split('/');
        }

        if (position.index < names.length) {
            var name = names[position.index];
            var fullName = position.fullName ? position.fullName + '/' + name : name;

            var newPosition = { index: position.index + 1, fullName: fullName };

            require([self.controllersBase + '/' + fullName], function(ControllerClass) {
                self.current.controllers[fullName] = new ControllerClass();
                addControllers(page, newPosition, callback);
            }, function(error) {
                self.current.controllers[fullName] = {};
                addControllers(page, newPosition, callback);
            });
        } else {
            callback();
        }
    }

    function clearControllers(position) {
        // Get the current page name
        var currentName = self.current.name();

        // If theres a current page, split its components, if not
        // init an empty array
        var names = [];
        if (currentName) {
            names = currentName.split('/');
        }

        // Get the position full name
        var fullName = position.fullName

        // Iterate over all name parts starting in the specified position
        for (var i = position.index; i < names.length; i++) {
            // Get the name and fullName
            var name = names[i];
            fullName = fullName ? fullName + '/' + name : name;

            delete self.current.controllers[fullName];
        }
    }

    // Clears the components defined in the current routes
    // passing the specified position
    function clearComponents(position) {
        // Get the current page name
        var currentName = self.current.name();

        // If theres a current page, split its components, if not
        // init an empty array
        var names;
        if (currentName) {
            names = currentName.split('/');
        } else {
            names = [];
        }

        var fullName = position.fullName;
        var finalName = fullName;

        // Iterate over all name parts starting in the specified position
        for (var i = position.index; i < names.length; i++) {
            // Get the name and fullName
            var name = names[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Get the part components
            var components = pages[fullName];

            var controller = self.current.controllers[fullName];

            // Iterate over part componentes and set the empty template
            for (var item in components) {
                controller.outlets[item] = 'empty';
            }
        }
    }

    // Add all componentes defined in the page parts passing the specified
    // position
    function addComponents(newPage, position) {
        var newNames;

        // If theres a new page defined split it's parts
        // if not init with and empty array
        if (newPage) {
            newNames = newPage.split('/');
        } else {
            newNames = [];
        }

        // Init the full name at the specified position
        var fullName = position.fullName;

        // Iterate over all name parts stating on the specified position
        for (var i = position.index; i < newNames.length; i++) {
            // Get the name and full name
            var name = newNames[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Get all components name for the current position index
            var componentsValues = pages[fullName];

            var controller = self.current.controllers[fullName];

            if (!controller.outlets) {
                controller.outlets = {};
            }

            // Iterate over all components and add the to current route
            for (var item in componentsValues) {
                controller.outlets[item] = componentsValues[item];
            }
        }

        // Set the new page name
        self.current.name(newPage);
    }

    // Creates a new crossroad route for each specified page map
    function createRoute(page, hash) {
        // Create a route for the page and hash
        routes[page] = csRouter.addRoute(hash, function(parameters) {
            // Get's the shared position between the old and new page
            var position = findPosition(page);

            // Delete all components of the old page
            clearComponents(position);
            // Clear the old controllers
            clearControllers(position);

            addControllers(page, position, function() {
                // Add the componentes of the new page
                addComponents(page, position);
            });
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
