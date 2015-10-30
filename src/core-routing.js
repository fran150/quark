//crossroads, hasher
function QuarkRouter() {
    var self = this;

    this.current = ko.observable();
    this.configuration = {};

    this.locationFinders = [];

    this.locationFinders.push(function(currentLocation, callback) {
        var path;

        if (!currentLocation) {
            path = window.location.pathname;
        } else {
            path = currentLocation;
        }

        for (var locationName in self.configuration) {
            var location = self.configuration[locationName];

            var exp = RegExp(location.config);

            if (path.match(exp)) {
                callback(location);
            }
        }
    });

    function RoutingConfig() {
        // Self
        var routingConfig = this;

        // Router Configuration
        routingConfig.configuration = {};

        // Location's name
        var currentLocationName;

        // Adds a location to the route. The routes applied to it using the .when method are parsed if the location.pathname
        // matches the specified pattern
        this.on = function(name, config) {
            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            // Initialize the location configuration
            routingConfig.configuration[name] = {
                config: config,
                routes: {}
            };

            // Sets the current location and current so it can be used by the .when method in chained calls.
            currentLocationName = name;

            // Returns itself so config methods are chainable.
            return routingConfig;
        }

        // Adds a route to the last location specified with .on. The hash is a pattern to match on the hash, the
        // name parameter is the name of the route, and the components parameter is an object with each property being the name of a placeholder
        // and it's value the component that must be binded on it.
        this.when = function(hash, name, components, controller) {
            // If only one parameter is specified we assume that its the components parameter
            if (!$$.isDefined(name) && !$$.isDefined(components)) {
                components = hash;
                name = '';
                hash = 'Any';
            } else if (!$$.isDefined(components) || !$$.isDefined(name)) {
                throw 'Must define the hash, name and components parameters'
            }

            // If .on was not called previously
            if (!$$.isDefined(currentLocationName)) {
                throw 'You must define the location to where this route applies using the .on method before calling .when.';
            }

            // Forms full name (location name/route name)
            var fullName = currentLocationName + '/' + name;

            // Loads the configuration
            routingConfig.configuration[currentLocationName]['routes'][name] = {
                hash: hash,
                components: components,
                fullName: fullName,
                name: name,
                controller: controller
            };

            // Returns itself so config methods are chainable.
            return routingConfig;
        }
    }

    function Route(router, name, fullName, locationConfig, hash, components, controller) {
        var routeObject = this;

        // Add route in crossroad
        var csRoute = router.addRoute(hash, function(requestParams) {
            // If the current route has a controller defined and the controller has a leaving method call it to allow
            // controller cleanup, if controller result is false do not reroute
            if (self.current() && self.current().controller && self.current().controller.leaving) {
                if (self.current().controller.leaving() === false) {
                    return;
                }
            }

            // Changes route setting the specified controller
            function changeCurrent(routeController) {
                // Change the current route
                self.current({
                    route: routeObject,
                    params: requestParams,
                    controller: routeController
                });

                // If the controller is defined and has a show method invoke it
                if (routeController && routeController.show) {
                    routeController.show();
                }

                // Dispatch the routed signal
                self.routed.dispatch();
            }

            // If the controller is a string then assume its a js module name
            if ($$.isString(controller)) {
                // Require the controller file
                require([controller], function(controllerObject) {
                    // If the module returns a constructor create an object, if not use it as is
                    var routeController = $$.isFunction(controllerObject) ? new controllerObject : controllerObject;

                    // Change current route using the loaded controller
                    changeCurrent(routeController);
                });
            } else {
                // If controller is a function, the function must create the controller object and
                // invoke the callback passed as firt parameter
                if ($$.isFunction(controller)) {
                    controller(changeCurrent);
                } else {
                    // If the controller is not an string nor function then use it as specified
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

    // Configure routing system using the specified routing config (created by using $$.routes)
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
            }

            // Adds the router to the location
            location.router = dest.router;

            // If there isn't a previously configured routes object in the location configuration create a new one
            if (!dest.routes) {
                dest.routes = {};
            }

            if (!dest.config) {
                dest.config = location.config;
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // If the routeName is not the generic one, load the configuration (generic config is apllied to each detailed route)
                if (routeName !== '') {
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
                    var newRoute = new Route(dest.router, routeConfig.name, routeConfig.fullName, location.config, routeConfig.hash, components, routeConfig.controller);

                    // Save it on the location routes
                    dest.routes[routeName] = newRoute;
                }
            }
        }
    }



    // Parses the specified route and location changing the current route
    this.parse = function(location, hash) {
        // If only one parameter is specified we assume that is the hash, and the location must be taken from the
        // window location object.
        if (!$$.isDefined(hash)) {
            hash = location;
            location = undefined;
        }

        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            finder(location, function(locationConfig) {
                locationConfig.router.parse(hash);
            });
        }
    }

    this.getRoute = function(name) {
        var location = name.substr(0, name.indexOf('/'));
        var routeName = name.substr(name.indexOf('/') + 1);

        if (!routeName) {
            throw new 'You must specifiy route name in the form location/routeName.';
        }

        if (!self.configuration[location]) {
            console.warn('The location specified as ' + name + ' was not found in the routing configuration.');
        } else {
            if (!self.configuration[location]['routes'][routeName]) {
                console.warn('The route name specified as ' + name + ' was not found in the routing configuration for the ' + location + ' location.');
            }
        }

        if (self.configuration[location] && self.configuration[location]['routes'][routeName]) {
            return self.configuration[location]['routes'][routeName];
        }
    }

    this.hash = function(name, config) {
        var route = self.getRoute(name);

        if (route) {
            return route.interpolate(config);
        }
    }

    this.listLocation = function(location) {
        var locations = [];

        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            finder(location, function(locationConfig) {
                locations.push(locationConfig.routes);
            });
        }

        return locations;
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

    this.routed = new signals.Signal();
}

$$.routing = new QuarkRouter();

$$.controller = {};

var controllerUpdater = ko.computed(function() {
    var current = $$.routing.current();

    if (current && current.controller) {
        $$.controller = current.controller;
    }
});
