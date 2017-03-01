function ServiceContext() {
    var self = this;

    var services = {};

    this.get = function(name) {
        if (services[name]) {
            return services[name];
        } else {
            var ServiceClass = require("service!" + name);
            var service = new ServiceClass(self);
            services[name] = service;
            return service;
        }
    }
}

$$.serviceContext = function(params) {
    if (params && params.context && params.context instanceof ServiceContext) {
        return params.context;
    } else {
        return new ServiceContext();
    }
}
