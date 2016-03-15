// Component error object
// It stores:
// - The error source
// - The error text
// - An object with extra data about the error that the programmer wants to keep or needs for error processing
// - Error level
// - Error type
// The key is generated by quark to uniquely identify each error on the page
// The error level and error type must be specified as properties of the data object.
function ComponentError(key, source, text, data) {
    this.key = key;
    this.text = text;
    this.data = data;
    this.source = source;

    this.level = data && data.level ? data.level : 0;
    this.type = data && data.type ? data.type : '';
}

// Collection of errors, used to store and handle errors in quark components.
// You can specify an error handler to a component by parameters, or it will try to obtain it from a property called errorHandler
// in the controller.
// The error handler is received as the third parameter of the component model, all error that the component produces must write to
// the error handler.
function ComponentErrors() {
    var self = this;

    // Error collection
    var repository = ko.observableArray();

    // Last used key
    var keys = 1;

    // Adds the error to the collection. Returns the key of the error in the collection.
    this.add = function(source, text, data) {
        var key = keys++;
        var error = new ComponentError(key, source, text, data);

        repository.push(error);

        return key;
    }

    // Adds the error to the collection and throws an exception with the created error
    this.throw = function(source, text, data) {
        var key = self.add(source, text, data);
        throw repository()[key];
    }

    // Resolve the error with the specified key, removing it from the errors list
    this.resolve = function(key) {
        var error = self.getByKey(key);

        if (error) {
            repository.remove(error);
        }
    }

    // Returns a computed observable with all the errors that fullfill the specified condition.
    // Condition must be a function accepting an error object as parameter and returning true
    // If it must be part of the result.
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

    // Returns a computed observable with all the errors that has one of the specified sources.
    // Sources is an string separated by | or , with all the error sources
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

    // Returns a computed observable with all the error in wich the source matches the specified regular expression
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

    // Returns the error with the specified key
    this.getByKey = function(key) {
        var errors = repository();

        for (var index in errors) {
            var error = errors[index];

            if (error.key == key) {
                return error;
            }
        }
    }

    // Returns a computed observable with all the errors with the specified type
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

    // Returns a computed observable with all the errors in wich the level is between the specified values
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

    // Returns a computed observable with all the errors
    this.get = function() {
        return ko.pureComputed(function() {
            return repository;
        });
    }
}

// Create and return an error handler
$$.errorHandler = function() {
    return new ComponentErrors();
}
