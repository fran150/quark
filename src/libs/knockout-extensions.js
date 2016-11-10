// This is an associative observable, it allows to maintain a collection of key -> values
// To be able to track changes, modifications must be made using the provided methods
ko.associativeObservable = function (initialValue) {
    // Underlying observable (used to store the object)
    var underlying = ko.observable(initialValue);

    // Allows to read or write associative array directly into the observable
    function associative() {
        // If called with arguments its a write, or else reads the value.
        if (arguments.length > 0) {
            underlying(arguments[0]);
            return this;
        }
        else {
            return underlying();
        }
    }

    // Adds the specified key value pair
    associative.add = function(key, item) {
        var object = underlying();

        // If object is not created initilize it
        if (!object) {
            object = {};
        }

        object[key] = item;

        underlying(object);
    }

    // Gets the item with the specified key
    associative.get = function(key) {
        var object = underlying();

        if (object) {
            if ($$.isDefined(object[key])) {
                return object[key];
            } else {
                throw new Error('The specified key does not exists');
            }
        } else {
            throw new Error('The specified key does not exists');
        }
    }

    // Return true if the item with the specified key exists
    associative.exists = function(key) {
        var object = underlying();

        if (object) {
            if ($$.isDefined(object[key])) {
                return true;
            }
        }

        return false;
    }

    associative.update = function(key, value) {
        var object = underlying();

        if (object) {
            if ($$.isDefined(object[key])) {
                // Get the original value
                var original = object[key];

                // Update to new value
                object[key] = value;

                // Rewrite the object and return the original value
                underlying(object);
                return original;
            } else {
                throw new Error('The specified key does not exists');
            }
        } else {
            throw new Error('The specified key does not exists');
        }
    }

    // Deletes the item with the specified key
    associative.remove = function(key) {
        var object = underlying();
        var original;

        if (object && $$.isDefined(object[key])) {
            original = object[key];
            delete object[key];

            underlying(object);
        }

        return original;
    }

    // Returns an array with all the values
    associative.array = ko.pureComputed(function() {
        var object = underlying();
        var result = [];

        if (object) {
            for (var key in object) {
                var value = object[key];
                result.push(value);
            }
        }

        return result;
    });

    // Invokes the callback method passing key value of each element in the array
    associative.each = function(callback) {
        var object = underlying();

        if (object) {
            for (var key in object) {
                callback(key, object[key]);
            }
        }
    }

    // Subscribe to this element
    associative.subscribe = function(callback) {
        return underlying.subscribe(callback);
    }

    return associative
}

// Extends all observables adding the refresh method wich
// Clears and refill the observable with the original value to force notify update.
ko.observable.fn.refresh = function() {
    // Read the actual value
    var value = this();

    // Clear the observable and refill with the original value
    $$.undefine(this);
    this(value);
}

// Check if it's an observable array
ko.isObservableArray = function(elem) {
    if (ko.isObservable(elem) && elem.indexOf !== undefined) {
        return true;
    }

    return false;
}

// Check if it's a computed observable
ko.isComputed = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.dependentObservable) return true;
    return ko.isComputed(instance.__ko_proto__); // Walk the prototype chain
}

// Maps from an object with observables to a plain javascript object.
ko.mapToJS = function(observable) {
    return komapping.toJS(komapping.fromJS(observable));
}

// Maps from a plain javascript object to an observable object (where all properties are observables)
ko.mapFromJS = function(observable) {
    return komapping.fromJS(komapping.toJS(observable));
}
