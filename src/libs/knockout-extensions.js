// This is an associative observable, it allows to maintain a collection of key -> values
// To be able to track changes, modifications must be made using the provided methods
ko.associativeObservable = function (initialValue) {
    // Allows to read or write associative array directly into the observable
    function associative() {
        // If called with arguments its a write, or else reads the value.
        if (arguments.length > 0) {
            associative.underlying(arguments[0]);
            return this;
        }
        else {
            return associative.underlying();
        }
    }

    // Underlying observable (used to store the object)
    associative.underlying = ko.observable(initialValue);

    // Adds the specified key value pair
    associative.add = function(key, item) {
        var object = associative.underlying();

        // If object is not created initilize it
        if (!object) {
            object = {};
        }

        object[key] = item;

        associative.underlying(object);
    }

    // Gets the item with the specified key
    associative.get = function(key) {
        var object = associative.underlying();

        if (object) {
            return object[key];
        }
    }

    // Deletes the item with the specified key
    associative.remove = function(key) {
        var object = associative.underlying();

        if (object && $$.isDefined(object[key])) {
            delete object[key];
        }

        associative.underlying(object);
    }

    // Returns an array with all the values
    associative.array = ko.pureComputed(function() {
        var object = associative.underlying();
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
        var object = associative.underlying();

        if (object) {
            for (var key in object) {
                callback(key, object[key]);
            }
        }
    }

    // Subscribe to this element
    associative.subscribe = function(callback) {
        return associative.underlying.subscribe(callback);
    }

    return associative
}

// Clears and refill the observable with the original value to force notify update.
ko.observable.fn.refresh = function() {
    var value = this();
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

ko.mapToJS = function(observable) {
    return komapping.toJS(komapping.fromJS(observable));
}

ko.mapFromJS = function(observable) {
    return komapping.fromJS(komapping.toJS(observable));
}
