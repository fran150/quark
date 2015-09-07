define(['jquery', 'knockout-mapping'], function($, komapping) {

    function Utils() {
        var self = this;

        // Check if the specified var is a string
        this.isString = function (variable) {
            if (typeof variable === 'string' || variable instanceof String) {
                return true;
            }

            return false;
        };

        // Check if the specified var is defined
        this.isDefined = function (variable) {
            if (typeof variable === 'undefined') {
                return false;
            };

            return true;
        };

        // Check if the sepcified var is an integer
        this.isInt = function (variable) {
            return Number(variable) === variable && variable % 1 === 0;
        };

        // Check if the specified var is a number
        this.isNumeric = function (variable) {
            return variable === Number(variable) && variable % 1 !== 0;
        };

        // Check if the specified var is an array
        this.isArray = function (variable) {
            return $.isArray(variable);
        };

        // Check if the specified var is an object
        this.isObject = function (variable) {
            if (variable !== null && typeof variable === 'object') {
                return true;
            }

            return false;
        };

        // Check if the specified var is a function
        this.isFunction = function (variable) {
            if (variable !== null && typeof variable === 'function') {
                return true;
            }

            return false;
        };

        // Check if the specified var is a date
        this.isDate = function(variable) {
            if (variable instanceof Date) {
                return true;
            }

            return false;
        }

        // Check if the specified var is a valid date
        this.isValidDate = function (variable) {
            if (!self.isDate(variable)) {
                return false;
            }

            if (isNaN(variable.getTime())) {
                return false;
            }

            return true;
        };

        // Clone the specified object
        this.clone = function(source) {
            if (self.isObject(source)) {
                return $.extend(true, {}, source);
            } else {
                throw new 'You must specify a valid object to clone';
            }
        };

        // Clone the specified object to an observable object. An observable object is an object in wich all its properties are
        // observable, you can create one using komapping.fromJS.
        this.cloneObservable = function(source) {
            return komapping.fromJS(komapping.toJS(source));
        };

        // Check if the function (callback) is defined, and if it is calls it with the parameters passed.
        // ie.: call('onClick', 'hello', 'world', 3). will call the function onClick('hello', 'world' 3);
        this.call = function (callback) {
            if (self.isDefined(callback)) {
                var args = Array.prototype.slice.call(arguments, 1);
                return callback.apply(args);
            }

            return true;
        }

        // Force a value to be a date. If it's not a date try to create one with it, if it results in an invalid
        // date it returns undefined or the default date if the second parameter is true
        this.makeDate = function (value, useToday) {
            if (!self.isDate(value)) {
                value = new Date(value);
            }

            if (!self.isValidDate(value)) {
                if (!useToday) {
                    value = new Date();
                } else {
                    return undefined;
                }
            }

            return value;
        }
    }

    return new Utils();
});
