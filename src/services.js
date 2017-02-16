function ServiceContext() {
    var self = this;

    this.imported = {};

    this.get = function(name) {
        if (self.imported[name]) {
            return self.imported[name];
        } else {
            var ImportedClass = require("service!" + name);
            var imported = new ImportedClass(self);
            self.imported[name] = imported;
            return imported;
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
