function QuarkRouter() {
    var self = this;

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    // Current page data
    var current = {
        name: ko.observable(),
        module: ko.observable(),
        controllers: {},
        trackers: {}
    };

    // Current route name observable
    this.current = current.name;
    this.currentModule = current.module;
    this.currentHash = ko.observable();

    // Routed signal
    this.routed = $$.signal();

    // Defined pages, mappings, crossroads routes and parameters
    var pages = {};
    var mappings = {};
    var routes = {};
    var params = {};

    // Used to store the module in wich the page was defined
    var pagesModule = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig, paramsConfig, module) {
        // If a module is defined
        if (module) {
            for (var pageName in pagesConfig) {
                var pageParts = pageName.split('/');

                var fullName = '';

                for (var i = 0; i < pageParts.length; i++) {
                    var part = pageParts[i];

                    if (fullName != '') {
                        fullName += '/';
                    }

                    fullName += part;

                    if (!pages[fullName]) {
                        pagesModule[fullName] = module;
                    }
                }
            }
        }

        // Combine current configuration with the new
        $.extend(pages, pagesConfig);

        // If a parameter configuration is specified combine it with the
        // previous
        if (paramsConfig) {
            $.extend(params, paramsConfig);

            for (var pageName in paramsConfig) {
                if (!$$.isDefined(pages[pageName])) {
                    pages[pageName] = {};
                }
            }
        }
    }

    // Returns the configuration of the specified page
    this.getPageConfig = function(pageName) {
        var config = {};

        if (pages[pageName]) {
            config.name = pageName;
            config.outlets = pages[pageName];
        }

        if (mappings[pageName]) {
            config.route = mappings[pageName];
        }

        if (params[pageName]) {
            config.param = params[pageName];
        }

        if (pagesModule[pageName]) {
            config.module = pagesModule[pageName];
        }

        return config;
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
    function configControllerAndTracker(fullName, controller, tracker, parentController) {
        // Sets the tracker main model to the controller and force open the lock
        tracker.setMainModel(controller);
        tracker.ready.force();

        // Set the trackers and controllers of the current page
        current.trackers[fullName] = tracker;
        current.controllers[fullName] = controller;

        // If the previous controller is defined
        if (parentController) {
            // Add a property to the current controller pointing to the parent
            controller.parent = parentController;
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

            // Get parent controller
            var parentController;

            if (previousName && current.controllers[previousName]) {
                parentController = current.controllers[previousName];
            }

            // Get the new full name combining the full name and this position's name
            var fullName = position.fullName ? position.fullName + '/' + name : name;

            // Calculate new position
            var newPosition = { index: position.index + 1, fullName: fullName };

            // Load with Require the controller
            $$.controllerProvider(fullName, function(ControllerClass) {
                // If a controller class is found and loaded create the object
                var tracker = new Tracker();
                var newController = new ControllerClass(parentController, tracker);

                // Config the new controller and tracker
                configControllerAndTracker(fullName, newController, tracker, parentController);

                // Recursively add the next controller
                addControllers(page, newPosition, callback);
            }, function(error) {
                // If a controller class is not found create the default controller
                var tracker = new Tracker();
                var newController = new DefaultController(parentController, tracker);

                // Config the new controller and tracker
                configControllerAndTracker(fullName, newController, tracker, parentController);

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
                if ($$.isArray(parameters)) {
                    // Iterate over all defined parameters and create an observable
                    // in the controller's param object for each
                    for (var j = 0; j < parameters.length; j++) {
                        controller.params[parameters[j]] = ko.observable();
                    }
                } else if ($$.isObject(parameters)) {
                    for (var name in parameters) {
                        controller.params[name] = ko.observable(parameters[name]);
                    }
                } else {
                    throw new Error('The parameters of \'' + fullName + '\' must be an object or array');
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
                        if ($$.isDefined(parameterValues[paramName])) {
                            var value = parameterValues[paramName];
                            controller.params[paramName](value);
                        }
                    }
                }
            }
        }
    }

    // Calls init method on all new controllers
    function initControllers(newPage, position) {
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

            // If controller and init method are defined call it
            if (controller && controller.init) {
                controller.init();
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
                // Add the components of the new page
                addOutlets(page, position);

                // Set the new set of parameters
                setParameters(parameters, page);

                // Call init method on all new controllers
                initControllers(page, position);

                // Set the new page name and module
                current.name(page);

                var pageConfig = self.getPageConfig(page);
                if (pageConfig.module) {
                    current.module(pageConfig.module);
                } else {
                    $$.undefine(current.module);
                }


                // Dispatch the routed signal
                self.routed.dispatch(page);
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
        // Sets the current Hash
        self.currentHash(hash);

        // Use the crossroad route to parse the hash
        csRouter.parse(hash);
    }

    // Gets the hash for the specified page
    this.hash = function(page, options) {
        // Get the crossroad route of the specified page
        var route = routes[page];

        // If a route is found interpolate the hash
        if (route) {
            return route.interpolate(options);
        }
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

            var resetScroll = allBindingsAccessor.get('resetScroll') || true;

            function updateValue(newValue) {
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

                        // If the new controller has a sendParameters method call it to
                        // obtain component's parameters and add them to the binding data
                        if (newController && newController.sendParameters) {
                            data.params = newController.sendParameters(value, newComponentName);
                        } else {
                            data.params = {};
                        }

                        newTracker.addDependency(value);

                        // Save the current controller and bind the new value
                        currentController = newController;
                        componentData(data);

                        if (resetScroll) {
                            window.scrollTo(0, 0);
                        }
                    }
                } else {
                    // if there isn't a new component clear controller and
                    // bind to the empty template
                    currentController = '';
                    componentData({ name: 'empty' });
                }
            }

            // Subscribe to name changes (routing)
            var subscription = current.name.subscribe(updateValue);

            updateValue(current.name());

            // Destroy subscription on element disposal
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                subscription.dispose();
                currentController = '';
            });

            // Add model binding to export to controller
            addModelBinding(element, value, 'exportToController');

            // Apply component binding to node with the new component data
            //ko.applyBindingsToNode(element, { 'component': componentData });

            var newAccessor = function() {
                return componentData;
            }

            return ko.bindingHandlers.component.init(element, newAccessor, allBindingsAccessor, viewModel, context);
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
