// Quark router object
function QuarkRouter() {
    var self = this;

    // An observable that has the current route
    this.current = ko.observable();

    // Routes configuration
    this.configuration = {};

    // List of defined location finders.
    // Quark allows to define routes grouped by "locations"
    // Each "location" have a set of routes defined independent of other.
    this.locationFinders = [];

    // A location finder is a function used by the quark routing system to resolve the location.
    // The function receives a callback and if it understands the current location it invoke the callback
    // passing the route configuration extracted from self.configuration.
    // This is the default location finder, it matches allows to specify a regular expression in the location
    // that must match the window.location.pathname
    // The location finders defined are called in order until one understands the location and invoke the callback.
    this.locationFinders.push(function(callback) {
        // Get the windolw location pathname
        var path = window.location.pathname;

        // Iterate over the defined locations trying to find one that has a regular expression wich matches the
        // path
        for (var locationName in self.configuration) {
            // Get the location data
            var location = self.configuration[locationName];

            // Create a regular expression object with the location configuration string
            var exp = RegExp(location.config);

            // If there's a match invoke the callback with the matching location
            if (path.match(exp)) {
                callback(location);
            }
        }
    });

    // Object passed to the configure method that allows to chain routes definition with calls to the .on method and the .when
    // method
    function RoutingConfig() {
        // Self
        var routingConfig = this;

        // Resulting configuration
        routingConfig.configuration = {};

        // Current location's name
        var currentLocationName;

        // Adds a location to the routes.
        this.on = function(name, config) {
            // Check parameter
            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            // Initialize the location configuration on the resulting configuration
            routingConfig.configuration[name] = {
                config: config,
                routes: {}
            };

            // Sets the current location so it can be used by the .when method in chained calls.
            // All subsequent .when calls will apply to this location.
            currentLocationName = name;

            // Returns itself so config methods are chainable.
            return routingConfig;
        }

        // Adds a route to the last location specified with .on. The hash is a pattern to match on the hash, the
        // name parameter is the name of the route, and the components parameter is an object with each property being the
        // name of a placeholder and it's value the component name that must be binded on it (see the page binding).
        this.when = function(hash, name, components, controller) {
            // If only one parameter is specified we assume that its the components parameter
            if (!$$.isDefined(name) && !$$.isDefined(components)) {
                components = hash;
                name = '';
                hash = 'Any';
            } else if (!$$.isDefined(components) || !$$.isDefined(name)) {
                throw 'Must define the hash, name and components parameters'
            }

            // Route persistent flag
            var persistent = false;

            // If the starts with !, then the route is persistent, mark the flag and get the clean hash
            if (hash.charAt(0) == '!') {
                persistent = true;
                hash = hash.substr(1);
            }

            // If .on was not called previously
            if (!$$.isDefined(currentLocationName)) {
                throw 'You must define the location to where this route applies using the .on method before calling .when.';
            }

            // Forms full name (location name/route name). Routes full name are the locationName + / + the route name
            var fullName = currentLocationName + '/' + name;

            // Loads the configuration
            routingConfig.configuration[currentLocationName]['routes'][name] = {
                hash: hash,
                components: components,
                fullName: fullName,
                name: name,
                controller: controller,
                persistent: persistent
            };

            // Returns itself so config methods are chainable.
            return routingConfig;
        }
    }

    // Specific route configuration, contains all route data and register the route in crossroads.js
    function Route(router, name, fullName, locationConfig, hash, components, controller, persistent) {
        var routeObject = this;

        // Add route in crossroad.
        // The actual routing in quark is performed by crossroads.js.
        // Foreach location defined, quark creates a crossroad router and adds all defined routes to it.
        var csRoute = router.addRoute(hash, function(requestParams) {
            // Set the value for all the parameters defined in the route
            for (var index in routeObject.params) {
                routeObject.params[index](requestParams[index]);
            }

            // Changes the current route
            function changeCurrent(routeController) {
                var current = self.current();

                // If the current route and the new route hasn't got the same controller object,
                // proceed to clear the old one
                if (current && current.route.controller != routeController) {
                    // If the current route has a controller defined and the controller has a "leaving" method call it to allow
                    // controller cleanup, if controller result is false do not reroute
                    if (current.controller && current.controller.leaving) {
                        if (current.controller.leaving() === false) {
                            return;
                        }
                    }

                    // If theres an error handler defined in the controller clear it
                    if (current.controller) {
                        if (current.controller.errorHandler) {
                            current.controller.errorHandler.clear();
                        }

                        if (!current.route.persistent) {
                            // Delete the old controller
                            delete current.controller;
                            delete current.route.controller;
                        }
                    }
                }

                // Change the current route
                self.current({
                    route: routeObject,
                    params: routeObject.params,
                    controller: routeController
                });

                // If the controller is defined and has a show method invoke it
                if (routeController && routeController.show) {
                    routeController.show();
                }

                // Dispatch the routed signal
                self.routed.dispatch();

                // Unlock the first routing lock
                self.firstRouting.unlock();
            }

            function initController(controller) {
                // Store the controller object on the associated route
                routeObject.controller = controller;

                // If theres a route controller defined and it doesn't have an error handler created
                // create one.
                if (controller) {
                    // If property will be overwritten warn the user
                    if (controller.errorHandler) {
                        console.warn('This controller already have a property named errorHandler, wich will be replaced by the error handler.');
                    }

                    // Create the error handler
                    controller.errorHandler = new ComponentErrors(controller);

                    if (routeObject && $$.isObject(routeObject.components)) {
                        for (var name in routeObject.components) {
                            initTracking(controller, name);
                        }
                    }

                }
            }

            // If the controller is a string then assume its a js module name
            if ($$.isString(controller)) {
                // Require the controller file
                require([controller], function(controllerObject) {
                    var routeController;

                    // If theres a controller created for the route use it if not initialize one and assign it to the route
                    if (routeObject.controller) {
                        routeController = routeObject.controller;
                    } else {
                        // If the module returns a constructor create an object, if not use it as is
                        routeController = $$.isFunction(controllerObject) ? new controllerObject(routeObject) : controllerObject;

                        // Intializes the controller
                        initController(routeController);
                    }

                    // Change current route using the loaded controller
                    changeCurrent(routeController);
                });
            } else {
                // If controller is a function, the function must create the controller object and
                // invoke the callback passed as first parameter
                if ($$.isFunction(controller)) {
                    controller(function(param) {
                        initController(param);
                        changeCurrent(param);
                    });
                } else {
                    // If the controller is not an string nor function then use it as specified
                    initController(controller);
                    changeCurrent(controller);
                }
            }
        });

        // Name of the route
        this.name = name;
        // Full name of the route (including location)
        this.fullName = fullName;
        // Route hash
        this.hash = hash;
        // Route components for each page bind
        this.components = components;

        // Store if the route is persistent
        this.persistent = persistent;

        // Initialize the array of parameters configured
        this.params = {};
        // Read the route configuration and store in the route object the parameters used by this route
        for (var index in csRoute._paramsIds) {
            this.params[csRoute._paramsIds[index]] = ko.observable();
        }

        // Parse the hash using the current router
        this.parse = function(hash) {
            router.parse(hash);
        }

        // Interpolate the hash using configured routes hash and the specified values for the route variables
        this.interpolate = function(values) {
            return csRoute.interpolate(values);
        }
    }

    // Creates a new routing config, must be used as parameter in $$.routing.configure
    this.routes = function() {
        return new RoutingConfig();
    }

    // Configure routing system using the specified routing config (created by using $$.routing.routes)
    this.configure = function(routingConfig) {
        // For each location configured
        for (var locationName in routingConfig.configuration) {
            // Get this location and the specified config
            var location = routingConfig.configuration[locationName];

            // If there's a previouly configurated location with the same name get it, if not create a new one
            var dest;
            if (!self.configuration[locationName]) {
                dest = self.configuration[locationName] = {};
            } else {
                dest = self.configuration[locationName];
            }

            // If there isn't a previously configured router in the location configuration create a new one
            if (!dest.router) {
                // Create a new crossroads router
                dest.router = crossroads.create();
                dest.router.normalizeFn = crossroads.NORM_AS_OBJECT;
                dest.router.ignoreState = true;
            }

            // Adds the router to the location
            location.router = dest.router;

            // If there isn't a previously configured routes object in the location configuration create a new one
            if (!dest.routes) {
                dest.routes = {};
            }

            // Copy the configured location config to the quark configuration
            if (!dest.config) {
                dest.config = location.config;
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // If the routeName is not the generic one, load the configuration.
                if (routeName !== '') {
                    // Initialize component configuration object
                    var components = {};

                    // If there's a previously default route defined in configuration load the components with it
                    if ($$.isDefined(dest.routes[''])) {
                        $.extend(components, dest.routes[''].components);
                    }

                    // If there's a new default route defined in this location replace it (to have precedence over older one)
                    if ($$.isDefined(location.routes[''])) {
                        $.extend(components, location.routes[''].components);
                    }

                    // Gets the route configuration
                    var routeConfig = location.routes[routeName];

                    // Replace this route configuration to have precedence over all previous configuration
                    $.extend(components, routeConfig.components);

                    // Creates the new route
                    var newRoute = new Route(dest.router, routeConfig.name, routeConfig.fullName, location.config, routeConfig.hash, components, routeConfig.controller, routeConfig.persistent);

                    // Save it on the location's routes
                    dest.routes[routeName] = newRoute;
                }
            }
        }
    }

    // Parses the specified route and location changing the current route
    this.parse = function(hash) {
        var found = false;

        // Iterate over location finders
        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            // Call the finder to get the actual location, if found call the crossroad parser passing the hash
            finder(function(locationConfig) {
                found = true;
                locationConfig.router.parse(hash);
            });

            // If location is found stop iterating
            if (found) return;
        }
    }

    // Get the route with the specified name (in the form locationName/routeName)
    this.getRoute = function(name) {
        // Extract location and routeName
        var location = name.substr(0, name.indexOf('/'));
        var routeName = name.substr(name.indexOf('/') + 1);

        // Validate parameter
        if (!routeName) {
            throw new 'You must specifiy route name in the form location/routeName.';
        }

        // If there isn't a location with the specified name warn on console
        if (!self.configuration[location]) {
            console.warn('The location specified as ' + name + ' was not found in the routing configuration.');
        } else {
            // if there isn't a route in the location with the specified name warn on console
            if (!self.configuration[location]['routes'][routeName]) {
                console.warn('The route name specified as ' + name + ' was not found in the routing configuration for the ' + location + ' location.');
            }
        }

        // If the specified location and route exists return it
        if (self.configuration[location] && self.configuration[location]['routes'][routeName]) {
            return self.configuration[location]['routes'][routeName];
        }
    }

    // Returns a hash for the specified route and configuration.
    // Routes can have variables, you can define a value for this variables using the config parameter
    this.hash = function(name, config) {
        // Get the route with the specified name
        var route = self.getRoute(name);

        // If theres a route with the specified name use the crossroad router to interpolate the hash
        if (route) {
            return route.interpolate(config);
        }
    }

    // Activates the quark routing system.
    // Allows to define a callback that is called each time the current hash is changed.
    // The callback accepts the new hash, and the old hash as parameters
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

    // Create a route signal that is fired each time a route finishes loading
    this.routed = new signals.Signal();

    // Create a lock that opens when the routing system loads the first route.
    // This is useful to start the quark application once the first routing is finished, most likely to be used
    // when a custom route function is used.
    this.firstRouting = $$.lock();
}

// Create the quark router
$$.routing = new QuarkRouter();

// Initialize the current controller object
$$.controller = {};

// This computed sets the current controller in the $$.controller variable.
var controllerUpdater = ko.computed(function() {
    // Get the current route
    var current = $$.routing.current();

    // If the current route is defined and has a controller, set it on the $$.controller variable
    if (current) {
        if (current.controller) {
            $$.controller = current.controller;
        } else {
            $$.controller = {};
        }
    }
});
