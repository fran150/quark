function ComponentError(key, type, text, data) {
    this.key = key;
    this.type = type;
    this.text = text;
    this.data = data;
}

function ComponentErrors(repository) {
    var self = this;

    if (!$$.isDefined(repository)) {
        repository = ko.observableArray();
    }

    if (!ko.isObservableArray(repository)) {
        throw 'The error repository must be an observable array.';
    }

    this.keys = 0;

    this.setRepository = function(newRepository) {
        repository = newRepository;
    }

    this.add = function(type, text, data) {
        var key = self.keys++;
        var error = new ComponentError(key, type, text, data);

        repository.push(error);

        return key;
    }

    this.throw = function(type, text, data) {
        var key = self.add(type, text, data);
        throw repository()[key];
    }

    this.resolve = function(key) {
        var error = repository()[key]

        if (error) {
            delete repository.remove(error);
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

    this.getByKey = function(key) {
        var errors = repository();

        $.each(errors, function(index, error) {
            if (error.key == key) {
                return error;
            }
        });
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

    this.get = function() {
        return ko.pureComputed(function() {
            return repository;
        });
    }
}
