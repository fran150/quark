//crossroads, hasher
function QuarkRouter() {
    var self = this;

    this.current = ko.observable();
    this.configuration = {};

    function RoutingConfig() {
        // Self
        var routingConfig = this;

        // Router Configuration
        routingConfig.configuration = {};

        // Location's name
        var currentLocationName;

        // Adds a location to the route. The routes applied to it using the .when method are parsed if the location.pathname
        // matches the specified pattern
        this.on = function(locationPattern, name) {
            if (!$$.isString(locationPattern)) {
                throw 'The page must be an string with the pattern of the pathname to match.';
            }

            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            // Initialize the location configuration
            routingConfig.configuration[name] = {
                pattern: locationPattern,
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
        this.when = function(hash, name, components) {
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
                name: name
            };

            // Returns itself so config methods are chainable.
            return routingConfig;
        }
    }

    function Route(router, name, fullName, locationPattern, hash, components) {
        var routeObject = this;

        var csRoute = router.addRoute(hash, function(requestParams) {
            self.current({
                route: routeObject,
                location: location.pathname,
                params: requestParams
            });
        });

        this.name = name;
        this.fullName = fullName;
        this.locationPattern = locationPattern;
        this.hash = hash;
        this.components = components;

        this.parse = function(hash) {
            router.parse(hash);
        }

        this.interpolate = function(values) {
            return csRoute.interpolate(values);
        }
    }

    this.routes = function() {
        return new RoutingConfig();
    }

    this.configure = function(routingConfig) {
        // For each location configurated
        for (var locationName in routingConfig.configuration) {
            // Get this location config and the pattern
            var locationConfig = routingConfig.configuration[locationName];
            var locationPattern = routingConfig.configuration[locationName].pattern;

            var dest;

            if (!self.configuration[locationName]) {
                dest = self.configuration[locationName] = {};
            } else {
                dest = self.configuration[locationName];
            }

            if (!dest.router) {
                // Create a new crossroads router
                dest.router = crossroads.create();
                dest.router.normalizeFn = crossroads.NORM_AS_OBJECT;
            }

            if (!dest.pattern) {
                dest.pattern = locationPattern;
            }

            // Adds the router to the location config
            locationConfig.router = dest.router;

            if (!dest.routes) {
                dest.routes = {};
            }

            // For each hash configured for this location
            for (var routeName in locationConfig.routes) {
                if (routeName !== '') {
                    var components;

                    // Gets the route configuration
                    var routeConfig = locationConfig.routes[routeName];

                    components = routeConfig.components;

                    if ($$.isDefined(locationConfig.routes[''])) {
                        $.extend(components, locationConfig.routes[''].components);
                    } else if ($$.isDefined(dest.routes[''])) {
                        $.extend(components, dest.routes[''].components);
                    }

                    // Creates the new route
                    var newRoute = new Route(dest.router, routeConfig.name, routeConfig.fullName, locationPattern, routeConfig.hash, components);

                    routeConfig.route = newRoute;

                    dest.routes[routeName] = components;
                }
            }
        }
    }

    this.parse = function(location, hash) {
        // If only one parameter is specified we assume that is the hash, and the location must be taken from the
        // window location object.
        if (!$$.isDefined(hash)) {
            hash = location;
            location = window.location.pathname;
        }

        for (var locationName in self.configuration) {
            var locationConfig = self.configuration[locationName];

            var exp = RegExp(locationConfig.pattern);
            if (location.match(exp)) {
                return locationConfig.router.parse(hash);
            }
        }
    }

    this.getRoute = function(name) {
        var location = name.substr(0, name.indexOf('/'));
        var hash = name.substr(name.indexOf('/') + 1);

        if (!hash) {
            throw new 'You must specifiy route name in the form location/routeName.';
        }

        if (!self.configuration[location]) {
            console.warn('The location specified as ' + name + ' was not found in the routing configuration.');
        } else {
            if (!self.configuration[location]['routes'][hash]) {
                console.warn('The route name specified as ' + name + ' was not found in the routing configuration for the ' + location + ' location.');
            }
        }

        if (self.configuration[location] && self.configuration[location]['routes'][hash]) {
            return self.configuration[location]['routes'][hash]['route'];
        }
    }

    this.hash = function(name, config) {
        var route = self.getRoute(name);

        if (route) {
            return route.interpolate(config);
        }
    }

    this.link = function(name, config, location) {
        var route = self.getRoute(name);

        if (!location) {
            location = window.location.pathname;
        }

        if (route) {
            var exp = RegExp(route.locationPattern);

            if (location.match(exp)) {
                return '#' + route.interpolate(config);
            } else {
                return location + '#' + route.interpolate(config);
            }
        }
    }

    this.listLocation = function(location) {
        if (!$$.isDefined(location)) {
            location = window.location.pathname;
        }

        for (var locationName in self.configuration) {
            var locationConfig = self.configuration[locationName];

            var exp = RegExp(locationConfig.pattern);
            if (location.match(exp)) {
                return locationConfig.routes;
            }
        }

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

$$.routing = new QuarkRouter();
