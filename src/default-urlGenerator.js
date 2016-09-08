// A url generator is a function used by the quark routing system to create a link given a route name.
// The function receives the route and config and tries to create a link with the given route, if its able it returns
// The generated url
/*$$.routing.urlGenerators.push(function(route, config) {
    var location = $$.routing.configuration[route.locationName];

    if (location && location.config && location.config.path) {
        return location.config.path + "#" + route.interpolate(config);
    }
});
*/
