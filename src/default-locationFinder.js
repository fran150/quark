// A location finder is a function used by the quark routing system to resolve the location.
// The function receives a callback and if it understands the current location it invoke the callback
// passing the route configuration extracted from self.configuration.
// This is the default location finder, it matches allows to specify a regular expression in the location
// that must match the window.location.pathname
// The location finders defined are called in order until one understands the location and invoke the callback.
$$.routing.locationFinders.push(function(callback) {
    // Get the windolw location pathname
    var path = window.location.pathname;

    // Iterate over the defined locations trying to find one that has a regular expression wich matches the
    // path
    for (var locationName in $$.routing.configuration) {
        // Get the location data
        var location = $$.routing.configuration[locationName];

        // Create a regular expression object with the location configuration string
        var exp = RegExp(location.config.path);

        // If there's a match invoke the callback with the matching location
        if (path.match(exp)) {
            callback(locationName);
        }
    }
});
