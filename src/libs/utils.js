// Check if the specified var is defined
$$.isDefined = function (variable) {
    if (typeof variable === 'undefined') {
        return false;
    };

    return true;
};

// Check if the specified var is a string
$$.isString = function (variable) {
    if (typeof variable === 'string' || variable instanceof String) {
        return true;
    }

    return false;
};

// Check if the sepcified var is an integer
$$.isInt = function (variable) {
    return Number(variable) === variable && variable % 1 === 0;
};

$$.isNumeric = function (variable) {
    return (typeof variable === 'number');
}

// Check if the specified var is a decimal
$$.isDecimal = function (variable) {
    return variable === Number(variable) && variable % 1 !== 0;
};

// Check if the specified var is an array
$$.isArray = function (variable) {
    return $.isArray(variable);
};

// Check if the specified var is an object
$$.isObject = function (variable) {
    if (variable !== null && typeof variable === 'object' && !(variable instanceof Array)) {
        return true;
    }

    return false;
};

// Check if the specified var is a function
$$.isFunction = function (variable) {
    if (variable !== null && typeof variable === 'function') {
        return true;
    }

    return false;
};

// Check if the specified var is a date
$$.isDate = function(variable) {
    if (variable instanceof Date) {
        return true;
    }

    return false;
}

// Check if the specified var is a valid date
$$.isValidDate = function (variable) {
    if (!$$.isDate(variable)) {
        return false;
    }

    if (isNaN(variable.getTime())) {
        return false;
    }

    return true;
};

// Clone the specified object
$$.clone = function(source) {
    return $.extend(true, {}, source);
};

// Clone the specified object to an observable object. An observable object is an object in wich all its properties are
// observable, you can create one using komapping.fromJS.
$$.cloneObservable = function(source) {
    return komapping.fromJS(komapping.toJS(source));
};

// Clones the specified object to an object even if properties are observables or not.
$$.cloneMixed = function (source) {
    var target = new source.constructor();

    for (var name in source) {
        var value;

        if (ko.isObservable(source[name])) {
            value = source[name]();

            if ($$.isObject(value)) {
                target[name] = ko.observable($$.cloneMixed(value));
            } else {
                target[name] = ko.observable(value);
            }
        } else {
            value = source[name];

            if ($$.isObject(value)) {
                target[name] = $$.cloneMixed(value);
            } else {
                target[name] = value;
            }
        }
    }

    return target;
};

// Check if the function (callback) is defined, and if it is calls it with the parameters passed.
// ie.: call('onClick', 'hello', 'world', 3). will call the function onClick('hello', 'world' 3);
$$.call = function (callback) {
    if (ko.isObservable(callback)) {
        callback = callback();
    }

    if (ko.isObservable(callback)) {
        throw 'Callback can not be an observable';
    }

    if ($$.isFunction(callback)) {
        var args = Array.prototype.slice.call(arguments, 1);
        return callback.apply(null, args);
    }
}

// Force a value to be a date. If it's not a date try to create one with it, if it results in an invalid
// date it returns undefined or the default date if the second parameter is true
$$.makeDate = function (value, useToday) {
    if (!$$.isDate(value)) {
        value = new Date(value);
    }

    if (!$$.isValidDate(value)) {
        if (useToday) {
            value = new Date();
        } else {
            return undefined;
        }
    }

    return value;
}