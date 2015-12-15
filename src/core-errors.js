function ComponentError(key, source, text, data) {
    this.key = key;
    this.text = text;
    this.data = data;
    this.source = source;

    this.level = data && data.level ? data.level : 0;
    this.type = data && data.type ? data.type : '';
}

function ComponentErrors() {
    var self = this;

    var repository = ko.observableArray();

    this.keys = 1;

    this.add = function(source, text, data) {
        var key = self.keys++;
        var error = new ComponentError(key, source, text, data);

        repository.push(error);

        return key;
    }

    this.throw = function(source, text, data) {
        var key = self.add(source, text, data);
        throw repository()[key];
    }

    this.resolve = function(key) {
        var error = self.getByKey(key);

        if (error) {
            repository.remove(error);
        }
    }

    this.getBy = function(condition) {
        return ko.pureComputed(function() {
            var res = [];
            var errors = repository();

            $.each(errors, function(index, error) {
                if (condition(error)) {
                    res.push(error);
                }
            });

            return res;
        });
    }

    this.getBySources = function(sources) {
        return ko.pureComputed(function() {
            var res = [];
            var errors = repository();

            $.each(errors, function(index, error) {
                if (sources.indexOf(error.source) !== -1) {
                    res.push(error);
                }
            });

            return res;
        });
    }

    this.getBySource = function(regExp) {
        return ko.pureComputed(function() {
            var res = [];
            var errors = repository();
            var exp = new RegExp(regExp);

            $.each(errors, function(index, error) {
                if (exp.test(error.source)) {
                    res.push(error);
                }
            });

            return res;
        });
    }

    this.getByKey = function(key) {
        var errors = repository();

        for (var index in errors) {
            var error = errors[index];

            if (error.key == key) {
                return error;
            }
        }
    }

    this.getByType = function(type) {
        return ko.pureComputed(function() {
            var res = [];
            var errors = repository();

            $.each(errors, function(index, error) {
                if (error.type == type) {
                    res.push(error);
                }
            });

            return res;
        });
    }

    this.getByLevel = function(min, max) {
        return ko.pureComputed(function() {
            var res = [];
            var errors = repository();

            $.each(errors, function(index, error) {
                if (error.level >= min && error.level <= max) {
                    res.push(error);
                }
            });

            return res;
        });
    }

    this.get = function() {
        return ko.pureComputed(function() {
            return repository;
        });
    }
}

$$.errorHandler = function() {
    return new ComponentErrors();
}
