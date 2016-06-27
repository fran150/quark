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

    // Initialize the crossroads routers for each location
    var routers = {};

    // Specific route configuration, contains all route data and register the route in crossroads.js
    function Route(locationName, routeName, config) {
        var routeObject = this;

        // Add route in crossroad.
        // The actual routing in quark is performed by crossroads.js.
        // Foreach location defined, quark creates a crossroad router and adds all defined routes to it.
        var csRoute = routers[locationName].router.addRoute(hash, function(requestParams) {
            // Set the value for all the parameters defined in the route
            for (var index in config.params) {
                config.params[index](requestParams[index]);
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
                        if (current.controller.componentErrors) {
                            current.controller.componentErrors.clear();
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
                    if (controller.componentErrors) {
                        console.warn('This controller already have a property named componentErrors, wich will be replaced by the error handler.');
                    }

                    // Create the error handler
                    controller.componentErrors = new ComponentErrors(controller);

                    if (routeObject && $$.isObject(routeObject.components)) {
                        for (var name in routeObject.components) {
                            initTracking(controller, controller, name);
                        }
                    }

                }
            }

            // If the controller is a string then assume its a js module name
            if ($$.isString(config.controller)) {
                // Require the controller file
                require([config.controller], function(controllerObject) {
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

        // Initialize the object of configured parameters
        config.params = {};

        // Read the route configuration and store in the route object the parameters used by this route
        for (var index in csRoute._paramsIds) {
            config.params[csRoute._paramsIds[index]] = ko.observable();
        }

        // Interpolate the hash using configured routes hash and the specified values for the route variables
        routeObject.interpolate = function(values) {
            return csRoute.interpolate(values);
        }
    }

    // Configure routing system using the specified routing config
    this.configure = function(routingConfig) {
        // For each location to be configured
        for (var locationName in routingConfig) {
            // Get this location and the specified config
            var location = routingConfig[locationName];

            // Location's configuration
            var dest;

            // If there's a previouly configurated location with the same name get it, if not create a new one
            if (!self.configuration[locationName]) {
                dest = self.configuration[locationName] = {};
            } else {
                dest = self.configuration[locationName];
            }

            // If there's a location config specified
            if (location.config) {
                // If the location hasn't got a previous configuration,
                // initialize one
                if (!dest.config) {
                    dest.config = {};
                }

                // Merge the new configuration into the existing
                $.extend(dest.config, location.config);
            }

            // If there isn't a router configuration for this location init one
            if (!routers[locationName]) {
                routers[locationName] = {};
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // Initialize component configuration object
                var components = {};

                // If there's a new default route defined in this location replace it (to have precedence over older one)
                if ($$.isDefined(location.defaults)) {
                    $.extend(components, location.defaults);
                }

                // Gets the route configuration
                var routeConfig = location.routes[routeName];

                // Replace this route configuration to have precedence over all previous configuration
                $.extend(components, routeConfig.components);

                if (!dest.routes) {
                    dest.routes = {};
                }

                dest.routes[routeName] = {
                    hash: routeConfig.hash,
                    fullName: locationName + '/' + routeName,
                    controller: routeConfig.controller,
                    persistent: routeConfig.persistent,
                    components: components
                };

                // If there isn't a previously configured router in the location configuration create a new one
                if (!routers[locationName].csRouter) {
                    // Create a new crossroads router
                    routers[locationName].csRouter = crossroads.create();

                    routers[locationName].csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
                    routers[locationName].csRouter.ignoreState = true;
                }

                // Creates the new route
                var newRoute = new Route(locationName, routeName, dest.routes[routeName]);

                // Save it on the location's routes
                routers[locationName].routes[routeName] = newRoute;
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
                locationConfig.csRouter.parse(hash);
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
