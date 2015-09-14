//crossroads, hasher

$$.routing
    .on('index')
        .when('', {
            topbar: 'topbarController',
            sidebar: 'sidebarController'
        })
        .when('{group}', {
            main: 'group-detail'
        })
        .when('{group}/{element}', {
            main: 'element-detail'
        });


function pageRoutes(page) {
    var self = this;

    this.on
}



$$.routing = function() {
    var self = this;
}

    function Router(config) {
        var currentRoute = this.currentRoute = ko.observable({});
        debugger;

        ko.utils.arrayForEach(config.routes, function(route) {
            crossroads.addRoute(route.url, function(requestParams) {
                requestParams = komapping.fromJS(requestParams);
                currentRoute(ko.utils.extend(requestParams, route.params));
            });
        });

        activateCrossroads();
    }

    function activateCrossroads() {
        function parseHash(newHash, oldHash) {
            crossroads.parse(newHash);
        }
        crossroads.normalizeFn = crossroads.NORM_AS_OBJECT;
        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }
