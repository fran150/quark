//crossroads, hasher
function QuarkRouter() {
    var self = this;

    this.current = ko.observable();
    this.configuration = [];

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

        // Adds a route to the last location specified with .on. The url is a pattern to match on the hash, the
        // name parameter is the name of the route, and the components parameter is an object with each property being the name of a placeholder
        // and it's value the component that must be binded on it.
        this.when = function(url, name, components) {
            // If only one parameter is specified we assume that its the components parameter
            if (!$$.isDefined(name) && !$$.isDefined(components)) {
                components = url;
                name = '';
                url = 'Any';
            } else if (!$$.isDefined(components) || !$$.isDefined(name)) {
                throw 'Must define the url, name and components parameters'
            }

            // If .on was not called previously
            if (!$$.isDefined(currentLocationName)) {
                throw 'You must define the location to where this route applies using the .on method before calling .when.';
            }

            // Forms full name (location name/route name)
            var fullName = currentLocationName + '/' + name;

            // Loads the configuration
            routingConfig.configuration[currentLocationName]['routes'][name] = {
                url: url,
                components: components,
                fullName: fullName,
                name: name
            };

            // Returns itself so config methods are chainable.
            return routingConfig;
        }
    }

    function Route(router, name, fullName, locationPattern, url, components) {
        var routeObject = this;

        var csRoute = router.addRoute(url, function(requestParams) {
            self.current({
                route: routeObject,
                location: location.pathname,
                params: requestParams
            });
        });

        this.name = name;
        this.fullName = fullName;
        this.locationPattern = locationPattern;
        this.url = url;
        this.components = components;

        this.parse = function(url) {
            router.parse(url);
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

            // Create a new crossroads router
            var newRouter = crossroads.create();
            newRouter.normalizeFn = crossroads.NORM_AS_OBJECT;

            // Adds the router to the location config
            locationConfig.router = newRouter;

            // For each url configured for this location
            for (var routeName in locationConfig.routes) {
                if (routeName !== '') {
                    var components;

                    // Gets the route configuration
                    var routeConfig = locationConfig.routes[routeName];

                    components = routeConfig.components;

                    if ($$.isDefined(locationConfig.routes[''])) {
                        $.extend(components, locationConfig.routes[''].components);
                    }

                    // Creates the new router
                    var newRoute = new Route(newRouter, routeConfig.name, routeConfig.fullName, locationPattern, routeConfig.url, components);

                    routeConfig.route = newRoute;
                }
            }
        }

        self.configuration = routingConfig.configuration;
    }

    this.parse = function(location, url) {
        // If only one parameter is specified we assume that is the hash, and the location must be taken from the
        // window location object.
        if (!$$.isDefined(url)) {
            url = location;
            location = window.location.pathname;
        }

        for (var locationName in self.configuration) {
            var locationConfig = self.configuration[locationName];

            var exp = RegExp(locationConfig.pattern);
            if (location.match(exp)) {
                return locationConfig.router.parse(url);
            }
        }
    }

    this.getRoute = function(name) {
        var parts = name.split('/');

        if (parts.length != 2) {
            throw new 'You must specifiy route name in the form pageName/routeName';
        }

        if (self.configuration[parts[0]] && self.configuration[parts[0]]['routes'][parts[1]]) {
            return self.configuration[parts[0]]['routes'][parts[1]]['route'];
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
            location = route.locationPattern;
        }

        if (route) {
            return location + '#' + route.interpolate(config);
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

    this.activateHasher = function() {
        function parseHash(newHash, oldHash) {
            self.parse(newHash);
        }

        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }
}

$$.routing = new QuarkRouter();
