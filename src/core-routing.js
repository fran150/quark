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
            crossroads.normalizeFn = crossroads.NORM_AS_OBJECT;

            var matched = {};

            for (var path in conf) {
                var exp = RegExp(path);
                if (location.pathname.match(exp)) {
                    matched = conf[path];
                    break;
                }
            }


            for (var url in matched) {
                if (url != 'Any') {
                    var config = matched[url];

                    function Route() {
                        var r = this;
                        this.file = path;
                        this.url = url;
                        this.name = config.name;
                        this.components = ko.utils.extend(config, conf[path]['Any']);
                        this.pattern = crossroads.addRoute(url, function(requestParams) {
                            r.params = requestParams;
                            self.current(r);
                        });
                    }


                    routes.push(new Route());
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
    }

    this.config = new RoutingConfig();
    this.route = new Router();

    this.followLocation = function() {
        function parseHash(newHash, oldHash) {
            self.parse(newHash);
        }

        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }
}

$$.routing = new QuarkRouter();
