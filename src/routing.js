function QuarkRouter() {
    var self = this;

    this.controllersBase = 'controllers';

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    var current = {
        name: ko.observable(),
        components: []
    };

    var pages = {};
    var mappings = {};
    var routes = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig) {
        $.extend(pages, pagesConfig);
    }

    

    // Configure routes for pages
    this.mapRoute = function(maps) {
        for (var page in maps) {
            var hash = maps[page];

            // Create a route for the page and hash
            routes[page] = csRouter.addRoute(hash, function(parameters) {
            }

            mappings[page] = hash;
        }
    }


}
