// Component error object
// It stores:
// - The error source
// - The error text
// - An object with extra data about the error that the programmer wants to keep or needs for error processing
// - Error level
// - Error type
// The key is generated by quark to uniquely identify each error on the page
// The error level and error type must be specified as properties of the data object.
function ComponentError(key, controller, component, text, data) {
    this.key = key;
    this.message = text;
    this.data = data;
    this.controller = controller;
    this.component = component;

    this.level = data && data.level ? data.level : 2000;
    this.type = data && data.type ? data.type : '';

    this.constructor.prototype.__proto__ = Error.prototype;
}

// Last used key
var errorKeys = 1;
// Global observable array with all errors
var globalErrors = ko.observableArray();

// Collection of errors, used to store and handle errors in quark components.
function ComponentErrors(controller, component) {
    var self = this;

    if (!$$.isDefined(controller)) {
        controller = '';
    }

    if (!$$.isDefined(component)) {
        component = '';
    }

    var filtered = ko.pureComputed(function() {
        var result = [];
        var errors = globalErrors();

        for (var index in errors) {
            var error = errors[index];

            if ((controller == '') && (component == '')) {
                result.push(error);
            }

            if ((error.controller == controller) && (component == '')) {
                result.push(error);
            }

            if (error.controller == controller && error.component == component) {
                result.push(error);
            }
        }

        return result;
    });

    // Adds the error to the collection. Returns the key of the error in the collection.
    this.add = function(text, data) {
        var key = errorKeys++;
        var error = new ComponentError(key, controller, component, text, data);

        globalErrors.push(error);

        return key;
    }

    // Adds the error to the collection and throws an exception with the created error
    this.throw = function(text, data) {
        var key = self.add(text, data);
        throw self.getByKey(key);
    }

    // Resolve the error with the specified key, removing it from the errors list
    this.resolve = function(key) {
        var error = self.getByKey(key);

        if (error) {
            globalErrors.remove(error);
        }
    }

    // Returns a computed observable with all the errors that fullfill the specified condition.
    // Condition must be a function accepting an error object as parameter and returning true
    // If it must be part of the result.
    this.getBy = function(condition) {
        return ko.pureComputed(function() {
            var result = [];
            var errors = filtered();

            for (var index in errors) {
                var error = errors[index];

                if (condition(error)) {
                    result.push(error);
                }
            }

            return result;
        });
    }

    // Returns the error with the specified key
    this.getByKey = function(key) {
        var errors = filtered();

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
            var result = [];
            var errors = filtered();

            for (var index in errors) {
                var error = errors[index];

                if (error.type == type) {
                    result.push(error);
                }
            }

            return result;
        });
    }

    // Returns a computed observable with all the errors in wich the level is between the specified values
    this.getByLevel = function(min, max) {
        return ko.pureComputed(function() {
            var result = [];
            var errors = filtered();

            for (var index in errors) {
                var error = errors[index];

                if (error.level >= min && error.level <= max) {
                    result.push(error);
                }
            }

            return result;
        });
    }

    // Returns a computed observable with all the errors
    this.get = function() {
        return filtered;
    }

    this.clear = function() {
        globalErrors.removeAll(filtered());
    }
}

$$.globalErrors = new ComponentErrors();
