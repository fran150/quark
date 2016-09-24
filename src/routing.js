function QuarkRouter() {
    var self = this;

    // Base path of the controllers
    this.controllersBase = 'controllers';

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    // Current page data
    var current = {
        name: ko.observable(),
        controllers: {},
        trackers: {}
    };

    // Current route name observable
    this.current = current.name;

    // Defined pages, mappings, crossroads routes and parameters
    var pages = {};
    var mappings = {};
    var routes = {};
    var params = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig, paramsConfig) {
        // Combine current configuration with the new
        $.extend(pages, pagesConfig);

        // If a parameter configuration is specified combine it with the
        // previous
        if (paramsConfig) {
            $.extend(params, paramsConfig);
        }
    }

    // Gets the index and full path name of the shared parts
    // between the old and the new page
    function findPosition(newPage) {
        // Get the current page name
        var currentName = current.name();

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

    // Default controller class (empty)
    function DefaultController() {
    }

    // Configs an newly created controller
    function configController(previousName, fullName) {
        // If the previous name is defined and has a controller loaded
        if (previousName && current.controllers[previousName]) {
            // Add a property to the current controller pointing to the previous or parent
            current.controllers[fullName].parent = current.controllers[previousName];
        }
    }

    // Loads controllers given the new page, position where the previous and new page
    // differ and call the callback when ready
    function addControllers(page, position, callback) {
        // Page names array
        var names = [];

        // If page is specified, divide it in its parts
        if (page) {
            names = page.split('/');
        }

        // If the differing position is before the end of the names array
        if (position.index < names.length) {
            // Get the name at the current position
            var name = names[position.index];
            // Save the previous fullname
            var previousName = position.fullName;
            // Get the new full name combining the full name and this position's name
            var fullName = position.fullName ? position.fullName + '/' + name : name;

            // Calculate new position
            var newPosition = { index: position.index + 1, fullName: fullName };

            // Load with Require the controller
            require([self.controllersBase + '/' + fullName], function(ControllerClass) {
                // If a controller class is found and loaded create the object
                var tracker = new Tracker();
                var newController = new ControllerClass(tracker);

                tracker.setMainModel(newController);
                tracker.ready.forceLock();

                current.trackers[fullName] = tracker;
                current.controllers[fullName] = newController;

                // Config the new controller
                configController(previousName, fullName);

                // Recursively add the next controller
                addControllers(page, newPosition, callback);
            }, function(error) {
                // If a controller class is not found and loaded create a default (empty) controller
                current.controllers[fullName] = new DefaultController();

                // Config the new controller
                configController(previousName, fullName);

                // Recursively add the next controller
                addControllers(page, newPosition, callback);
            });
        } else {
            // If differing position is at the end of the array we are done
            // routing
            callback();
        }
    }

    // Clears the old controllers passing the given position
    function clearControllers(position) {
        // Get the current page name
        var currentName = current.name();

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

            // Get current controller
            var controller = current.controllers[fullName];
            var tracker = current.trackers[fullName];

            // If the controller has a dispose method call it allowing code
            // clean up
            if (controller) {
                if ($$.isFunction(controller.dispose)) {
                    controller.dispose();
                }

                if (controller.parent) {
                    delete controller.parent;
                }
            }

            if (tracker) {
                tracker.dispose();
            }

            // Delete the controller reference
            delete current.controllers[fullName];
            delete current.trackers[fullName];
        }
    }

    // Clears the outlets defined in the current routes
    // passing the specified position
    function clearOutlets(position) {
        // Get the current page name
        var currentName = current.name();

        // Page name parts
        var names = [];

        // If theres a current page, split its components
        if (currentName) {
            names = currentName.split('/');
        }

        // Get the first position full name
        var fullName = position.fullName;

        // Iterate over all name parts starting in the specified position
        for (var i = position.index; i < names.length; i++) {
            // Get the name and fullName of the next position
            var name = names[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Get the part components and current controller
            var components = pages[fullName];
            var controller = current.controllers[fullName];

            // Iterate over part components and set the empty template
            for (var item in components) {
                controller.outlets[item] = 'empty';
            }
        }
    }

    // Add all componentes defined in the page parts passing the specified
    // position
    function addOutlets(newPage, position) {
        // Page name parts
        var newNames = [];

        // If theres a new page defined split it's parts
        if (newPage) {
            newNames = newPage.split('/');
        }

        // Init the full name at the specified position
        var fullName = position.fullName;

        // Iterate over all name parts stating on the specified position
        for (var i = position.index; i < newNames.length; i++) {
            // Get the name and full name
            var name = newNames[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Current controller at position
            var controller = current.controllers[fullName];

            // Get all components name for the current position index
            var componentsValues = pages[fullName];

            // If the outlets object is not created on the controller init an
            // empty object
            if (!controller.outlets) {
                controller.outlets = {};
            }

            // Iterate over all components and add the configured outlets
            // to current controller
            for (var item in componentsValues) {
                controller.outlets[item] = componentsValues[item];
            }

            // Get all the parameters configured for this page
            var parameters = params[fullName];

            // If the params object is not created on the controller init an
            // empty object
            if (!controller.params) {
                controller.params = {};
            }

            // If there are parameters defined for this route
            if (parameters) {
                // Iterate over all defined parameters and create an observable
                // in the controller's param object for each
                for (var j = 0; j < parameters.length; j++) {
                    controller.params[parameters[j]] = ko.observable();
                }
            }
        }
    }

    // Sets the parameters values with the values specified in the route
    function setParameters(parameterValues, page) {
        // Page parts and full name
        var names = [];
        var fullName;

        // If a page is defined split its parts
        if (page) {
            names = page.split('/');
        }

        // For each name in the route
        for (var i = 0; i < names.length; i++) {
            // Get the  name and full name at the current position
            var name = names[i];
            fullName = fullName ? fullName + '/' + name : name;

            // If there are parameters at the current position
            if (params[fullName]) {
                // Get the current controller
                var controller = current.controllers[fullName];

                // If the controller params object is created
                if (controller && controller.params) {
                    // Iterate over each param name and set the parameter value
                    for (var paramName in controller.params) {
                        var value = parameterValues[paramName];
                        controller.params[paramName](value);
                    }
                }
            }
        }
    }

    // Creates a new crossroad route for each specified page map
    function createRoute(page, hash) {
        // Create a route for the page and hash
        routes[page] = csRouter.addRoute(hash, function(parameters) {
            // Get's the shared position between the old and new page
            var position = findPosition(page);

            // Delete all components of the old page
            clearOutlets(position);
            // Clear the old controllers
            clearControllers(position);

            addControllers(page, position, function() {
                // Add the componentes of the new page
                addOutlets(page, position);

                // Set the new set of parameters
                setParameters(parameters, page);

                // Set the new page name
                current.name(page);
            });
        });
    }

    // Configure routes for pages
    this.mapRoute = function(maps) {
        // For each page to be mapped
        for (var page in maps) {
            // Get the hash
            var hash = maps[page];

            // Create and configure a crossroad route for each route and page
            createRoute(page, hash);

            // Add the mapping between page and hash to the object
            mappings[page] = hash;
        }
    }

    // Parse the specified hash
    this.parse = function(hash) {
        // Use the crossroad route to parse the hash
        csRouter.parse(hash);
    }

    // Activate the crossroad hasher, you can define a custom function
    // to execute when the route changes (inside must call to the parse method
    // to actually perform the routing)
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

    // Outlet binding, allows to show the configured component for the actual route
    ko.bindingHandlers.outlet = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            // Get outlet name
            var value = ko.unwrap(valueAccessor());
            // Current controller name
            var currentController;
            // Component name to show on this outlet
            var componentData = ko.observable({ name: 'empty' });

            // Subscribe to name changes (routing)
            var subscription = current.name.subscribe(function(newValue) {
                // Route names
                var names = [];

                // If a new route value is specified
                if (newValue) {
                    names = newValue.split('/');
                }

                var controller;
                var fullName;

                var newComponentName;
                var newController;
                var newTracker;

                // For each part in the new route
                for (var i = 0; i < names.length; i++) {
                    // Get the name a full name at the given position
                    var name = names[i];
                    fullName = fullName ? fullName + '/' + name : name;

                    // Get the controller at this position
                    var controller = current.controllers[fullName];
                    var tracker = current.trackers[fullName];

                    // Iterate the outlets defined in the controller
                    for (var outletName in controller.outlets) {
                        // If the outlet name corresponds to the configured
                        if (outletName == value) {
                            // Set the new component name and controller
                            newComponentName = controller.outlets[outletName];
                            newController = controller;
                            newTracker = tracker;
                        }
                    }
                }

                // If there is a new component defined
                if (newComponentName) {
                    // If the new component name and controller differs from previous
                    if (newComponentName != componentData().name || newController != currentController) {
                        // Init the binding data with the component name
                        var data = { name: newComponentName };

                        // If the new controller has a initComponent method call it to
                        // obtain component's parameters and add them to the binding data
                        if (newController && newController.initComponent) {
                            data.params = newController.initComponent(value, newComponentName);
                        } else {
                            data.params = {};
                        }

                        newTracker.addDependency(value);

                        // Save the current controller and bind the new value
                        currentController = newController;
                        componentData(data);
                    }
                } else {
                    // if there isn't a new component clear controller and
                    // bind to the empty template
                    currentController = '';
                    componentData({ name: 'empty' });
                }
            });

            // Destroy subscription on element disposal
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                subscription.dispose();
                currentController = '';
            });

            // Add model binding to export to controller
            addModelBinding(element, value, 'exportToController');

            // Apply component binding to node with the new component data
            ko.applyBindingsToNode(element, { 'component': componentData });
        }
    }
    ko.virtualElements.allowedBindings.outlet = true;

    ko.bindingHandlers.exportToController = {
        init: function(element, valueAccessor, allBindings, viewModel, context) {
            // Get dependency name
            var value = ko.unwrap(valueAccessor());

            // Route names
            var names = [];

            var currentName = current.name();

            // If a new route value is specified
            if (currentName) {
                names = currentName.split('/');
            }

            var controller;
            var fullName;

            var actualComponentName;
            var actualController;
            var actualTracker;

            // For each part in the new route
            for (var i = 0; i < names.length; i++) {
                // Get the name a full name at the given position
                var name = names[i];
                fullName = fullName ? fullName + '/' + name : name;

                // Get the controller at this position
                var controller = current.controllers[fullName];
                var tracker = current.trackers[fullName];

                // Iterate the outlets defined in the controller
                for (var outletName in controller.outlets) {
                    // If the outlet name corresponds to the configured
                    if (outletName == value) {
                        // Set the new component name and controller
                        actualComponentName = controller.outlets[outletName];
                        actualController = controller;
                        actualTracker = tracker;
                    }
                }
            }

            if (actualController && actualTracker) {
                var childModel = context.$childContext.$data.getModel();
                var childTracker = context.$childContext.$data.getImports();

                actualTracker.loadDependency(value, childModel, childTracker);
            }

            actualController = '';
            actualTracker = '';
        }
    }
    ko.virtualElements.allowedBindings.exportToController = true;

}

// Create the quark router
$$.routing = new QuarkRouter();
