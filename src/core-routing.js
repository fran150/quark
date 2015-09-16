//crossroads, hasher

function QuarkRouter() {
    var self = this;

    var conf = {};

    function RoutingConfig() {
        var self = this;
        var currentPage;
        var currentName;

        this.on = function(page, name) {
            if (!$$.isString(page)) {
                throw 'The page must be an string with the name of the page without extension.';
            }

            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            conf[page] = {};
            currentPage = page;
            currentName = name;

            return self;
        }

        this.when = function(url, name, config) {
            // If name and config are not defined we assume that the parameter is the config
            if (!$$.isDefined(name) && !$$.isDefined(config)) {
                config = url;
                name = '';
                url = 'Any';
            } else if (!$$.isDefined(config)) {
                // If only two parameters are defined we assume that are the url and config
                config = name;
                name = '';
            }

            if (!$$.isDefined(url)) {
                throw 'You must define at least the config.'
            }

            if (!$$.isDefined(currentPage)) {
                throw 'You must define the main page using the .on method before calling .when.';
            }

            config.name = currentName + '/' + name;
            conf[currentPage][url] = config;


            return self;
        }
    }

    function Router() {
        var self = this;

        var started = false;
        var routes = [];

        this.current = ko.observable();

        function start() {
            // Guardar una instancia de crossroads en cada vuelta. Luego en el parse matchear primero el location y luego llamar a la instancia
            // de crossroads correspondiente para el parseo.
            //
            var prev;
            var cross;
            for (var path in conf) {
                prev = cross;
                cross = crossroads.create();
                cross.normalizeFn = cross.NORM_AS_OBJECT;

                for (var url in conf[path]) {
                    if (url != 'Any') {
                        var config = conf[path][url];

                        function Route() {
                            var r = this;
                            this.file = path;
                            this.url = url;
                            this.name = config.name;
                            this.components = ko.utils.extend(config, conf[path]['Any']);
                            this.event = cross.addRoute(url, function(requestParams) {
                                var exp = RegExp(path);
                                if (location.pathname.match(exp)) {
                                    r.params = requestParams;
                                    self.current(r);
                                }
                            });
                            this.interpolate = function(values) {
                                return r.event.interpolate(values);
                            }
                        }

                        if (!prev) {
                            crossroads.pipe(cross);
                        } else {
                            prev.pipe(cross);
                        }

                        routes.push(new Route());
                    }
                }
            }

            started = true;
        }

        this.parse = function(url) {
            if (!started) start();
            return crossroads.parse(url);
        }

        this.get = function(name) {
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                if (route.name && route.name == name) {
                    return route;
                }
            }
        }

        this.link = function(name, config) {
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                if (route.name && route.name == name) {
                    return route.location + '#' + route.interpolate(config);
                }
            }
        }
    }

    this.config = new RoutingConfig();
    this.route = new Router();

    this.followLocation = function() {
        function parseHash(newHash, oldHash) {
            self.route.parse(newHash);
        }

        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }
}

$$.routing = new QuarkRouter();
