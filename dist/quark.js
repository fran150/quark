(function (root, factory) {    
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['knockout', 'jquery', 'knockout-mapping', 'crossroads', 'hasher', 'signals'], factory);
    } else {
        // Browser globals.
        root.komapping = ko.mapping;
        root.$$ = factory(root.ko, root.$, root.komapping, root.crossroads, root.hasher, root.signals);
    }
}(this, function(ko, $, komapping, crossroads, hasher, signals) {
// Quark global
var $$ = {};
// Quark started
$$.started = false;
// Client error handlers repository
$$.ajaxErrorHandlers = {};
// Formatters
$$.formatters = {};

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

// Check if the specified var can be transformed in an integer
$$.canBeInt = function(variable) {
    return Number(variable) == variable && variable % 1 === 0;
}

// Check if the specified var is a number
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

// Returns ISO date without time information
$$.toShortISO = function(value) {
    if ($$.isDate(value)) {
        return value.toISOString().slice(0, 10);
    }
}

// Sets all object properties to undefined
$$.clear = function(object) {
    $.each(object, function(key, property) {
        if (ko.isObservable(property)) {
            property(undefined);
        } else {
            property = undefined;
        }
    });
}

// Undefine the specified object (variable or observable)
$$.undefine = function(object) {
    if (ko.isObservable(object)) {
        object(undefined);
    } else {
        object = undefined;
    }
}


function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// Replaces {0}, {1}.. in the specified string for the first, second.. etc parameter after the string.
// I.e: $$.format('Hello {0}, {1}', 'World', '2016') will return Hello World 2016
$$.formatString = function() {
    var args = Array.prototype.slice.call(arguments);
    var str = args[0]

    for (var i = 1; i < args.length; i++) {
        str = replaceAll(str, '{' + (i - 1) + '}', args[i]);
    }

    return str;
};

// Replaces {propertyName} in the specified string for the value of the property with the same
// name in the object
$$.formatStringObj = function(string, object) {
    for (var name in object) {
        string = replaceAll(string, '{' + name + '}', object[name]);
    }

    return string;
}

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

// Extends all observables adding the refresh method wich
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

// Maps from an object with observables to a plain javascript object.
ko.mapToJS = function(observable) {
    return komapping.toJS(komapping.fromJS(observable));
}

// Maps from a plain javascript object to an observable object (where all properties are observables)
ko.mapFromJS = function(observable) {
    return komapping.fromJS(komapping.toJS(observable));
}

// This binding can be used on links to specify a route name as href and quark will
// automatically convert it to the url defined in the route.
// You can specify a route name, or an object with two properties:
//{
//  routeName: the route name,
//  routeConfig: route config
//}
ko.bindingHandlers.href = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var value = ko.unwrap(valueAccessor());

        var newAccesor = function() {
            if ($$.isString(value)) {
                return { href: $$.routing.link(value) }
            } else if ($$.isObject(value) && value && value.routeName && value.routeConfig) {
                return { href: $$.routing.link(value.routeName, value.routeConfig) }
            }
        }
        return ko.bindingHandlers.attr.update(element, newAccesor, allBindingsAccessor, viewModel, context);
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function as parameters.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

// $$.formatters is an object in wich each property is a function that accepts an object and returns the value formatted as
// must be shown in the page.
// The binding format allows to specify an object in the form:
// {
//  value: observable or item to format
//  formatter: name of the formatter (must correspond to an $$.formatters property)
// }
// Internally when writing this value quark will call the formatter passing the value to format as parameter
// and using the result in a normal text binding.
ko.bindingHandlers.format = {
    init: function (element, valueAccessor) {
        // Get the formatter configuration
        var config = valueAccessor();

        // Validate that is correctly invoked
        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        // If value its not an observable, create an observable and set the value inside
        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        // Create the interceptor that is a pure computed wich transforms the specified value with the formatter.
        var interceptor = ko.pureComputed({
            read: function () {
                // If the value and formatter are defined invoke the formatter and use the formatted result
                // else use the value as is.
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter)) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        // Apply the text binding to the element with the formatted output
        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

// $$.formatters is an object in wich each property is a function that accepts an object and returns the value formatted as
// must be shown in the page.
// The binding format allows to specify an object in the form:
// {
//  value: observable or item to format
//  formatter: name of the formatter (must correspond to an $$.formatters property)
// }
// Internally when writing this value quark will call the formatter passing the value to format as parameter
// and using the result in a normal value binding.
ko.bindingHandlers.formatValue = {
    init: function (element, valueAccessor) {
        // Get the formatter configuration
        var config = valueAccessor();

        // Validate that is correctly invoked
        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        // If value its not an observable, create an observable and set the value inside
        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        // Create the interceptor that is a pure computed wich transforms the specified value with the formatter.
        var interceptor = ko.pureComputed({
            read: function () {
                // If the value and formatter are defined invoke the formatter and use the formatted result
                // else use the value as is.
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter)) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        // Apply the value binding to the element with the formatted output
        ko.applyBindingsToNode(element, { value: interceptor });
    }
}

// This binding is similar to the if binding, it shows and bind its content only when the specified dependency is ready
ko.bindingHandlers.waitReady = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var value = valueAccessor();
        var newAccessor = ko.observable(false);

        if (viewModel && viewModel.readiedSignal) {
            viewModel.readiedSignal.addOnce(function(propertyName) {
                if (propertyName == value) {
                    newAccessor(true);
                }
            });
        }

        return ko.bindingHandlers['if'].init(element, newAccessor, allBindingsAccessor, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.waitReady = true;

// Signals.js wrapper, returns a signal.
$$.signal = function() {
    return new signals.Signal();
}

// Removes all listener from the signal.
$$.signalClear = function(signal) {
    signal.removeAll();
}

// Locks allows to define functions that will not be called inmediately but will wait until when
// an event occurs unlocking the calls.
// Once the functions are called they are cleared from the waiting list.
function SyncLock() {
    var self = this;

    // Is the signal dispatched (and unlocked)
    var dispatched = false;
    // Signal to notify the unlocking and call all functions
    var signal = $$.signal();

    // Lock effectively blocking all function calls
    this.lock = function() {
        dispatched = false;
    }

    // Unlock calling all blocked functions
    this.unlock = function() {
        dispatched = true;
        signal.dispatch();
    }

    // Is this lock locked
    this.isLocked = function() {
        return !dispatched;
    }

    // Call the specified function when unlocked
    this.call = function(callback) {
        // If is alredy unlocked call inmediately
        if (dispatched) {
            callback();
        } else {
            // If not is unlocked add a listener to the unlock signal.
            signal.addOnce(function() {
                // When unlocked call the function and remove the listener from the signal
                dispatched = true;
                callback();
            });
        }
    }
}

// Returns a lock
$$.lock = function() {
    return new SyncLock();
}

// Blocks execution of the function until the specified lock unlocks
$$.wait = function(lock, callback) {
    lock.call(callback);
}

// Returns if the lock is locked or not
$$.isLocked = function(lock) {
    return lock.isLocked();
}

// Redirect the browser to the specified url
$$.redirect = function(url) {
    window.location.href = url;
    return true;
}

// Redirect the browser to the specified hash
$$.redirectHash = function(name, config) {
    var hash = $$.routing.hash(name, config);
    $$.redirect('#' + hash);
}

// Gets value of the parameter from the URL
$$.getParam = function (parameterName) {
    var result = undefined;
    var tmp = [];

    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });

    return result;
}

// UI Functions

// Replace the placeholder content with the html specified and bind the model to the new context
$$.replaceAndBind = function (placeholderSelector, html, model) {
    $(placeholderSelector).html(html);
    ko.cleanNode(placeholderSelector.get(0));
    ko.applyBindings(model, placeholderSelector.get(0));
}

// Encode the value as HTML
$$.htmlEncode = function (value) {
    if (value) {
        return $('<div />').text(value).html();
    } else {
        return '';
    }
}

// Decode the html to a string.
$$.htmlDecode = function (value) {
    if (value) {
        return $('<div />').html(value).text();
    } else {
        return '';
    }
};

// Limit the string to the specified number of chars. If the text is larger adds '...' to the end.
$$.limitText = function (value, limit) {
    if (!$$.isInt(limit)) {
        limit = 6;
    } else {
        if (limit < 6) {
            limit = 6;
        }
    }

    if ($$.isString(value)) {
        if (value.length > limit) {
            value = value.substr(0, limit - 3) + '...';
        }

        return value;
    } else {
        return '';
    }
}

// Sets the specified cookie, its value, and duration in seconds
$$.setCookie = function (name, value, duration) {
    var d = new Date();

    if (duration !== undefined) {
        d.setTime(d.getTime() + (duration * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + "; " + expires;
    } else {
        document.cookie = name + "=" + value + "; ";
    }
}

// Gets the value of the specified cookie
$$.getCookie = function (name) {
    name = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

// Clears the specified cookie
$$.clearCookie = function(name) {
    $$.setCookie(name,"",-1);
}

// Loads the specified css by adding a link element to the head tag
$$.loadCss = function(path) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = path;
    document.getElementsByTagName("head")[0].appendChild(link);
}

// Is quark authorizing?
var authorizing = false;

// Default ajax config.
// Sets the content for json, async calls and no cache.
// Define a default (overriden) authorization flow.
// Quark can automatically authorize your ajax calls, if you specify that an ajax calls needs authorization quark will go thru the
// authentication flow.
// First uses the authorization.has function to determine if the user has credentials, if the function returns true quark assumes that
// has credentials and doesn't need to ask for. (for example checking session storage for an existing token)
// If authorization.has function returns false, calls authorization.authorize function to ask for credentials, passing a callback
// that this function must call when credential has been obtained. (for example showing an popup to enter user and password)
// Finally before any ajax call that requires authentication calls configAuthorization to config ajax for pass the credentials to the
// server (i.e. adding a token to the request header)
// Both configAuthorization and authorize receive an opts object with the actual ajax configuration to use in any ajax call.
$$.ajaxConfig = {
    contentType: 'application/json',
    dataType : 'json',
    'async': true,
    cache: false,
    authorization: {
        has: function() {
            return true;
        },
        configAuthorization: function(opts) {
            return opts;
        },
        authorize: function(opts, callback) {
            callback(true);
        }
    }
}

// Executes an ajax call to the specified url
// Method is an string with the method to use, GET, PUT, POST, DELETE, etc.
// Data is an object with the data to send to the server.
// Callbacks allows to define an object with the methods:
//      onSuccess: this will be called if the ajax method returned ok, and will pass as parameter the data received.
//      onError: this will be called if the ajax method returns an error, must try to handle the error, and if it could return true,
//               if returns other than true the error will be handed to the error handlers.
//      onComplete: this will be called when ajax call finishes (ok or with error)
// If callbacks is not specified as an object but as a function it will be assumed that is the onSuccess function.
// auth is a boolean indicating if the ajax call needs authentication (triggering the authentication flow)
// Finally options allows to customize ajax options for the call.
$$.ajax = function (url, method, data, callbacks, auth, options) {
    // Default value for parameters
    var opts = options || {};
    var clbks = callbacks || {};

    // Error if target is not specified
    if (!url) {
        throw 'Must specify the target URL';
    }

    // Check if callbacks is defined as function or object
    var onSuccess;

    // If is function assume that it is the onSuccess, if not extract the onSuccess function.
    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    // Configure ajax options
    var ajaxOptions = {
        url: url,
        type: method || 'GET',
        data: data,
        success: onSuccess,
        complete: function() {
            if ($$.isDefined(clbks.onComplete)) {
                clbks.onComplete();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // Check if some handler processed the error.
            var handled = false;

            // If there is an error handler defined in the call excute it. If has handled the error it must return true
            if ($$.isDefined(clbks.onError)) {
                handled = clbks.onError(jqXHR, textStatus, errorThrown);
            }

            // If nobody has handled the error try to use a generic handler
            if (!handled) {
                // Call all handlers in registration order until someone handles it (must return true)
                for (var handlerName in $$.ajaxErrorHandlers) {
                    if ($$.ajaxErrorHandlers[handlerName](url, opts.source, jqXHR, textStatus, errorThrown)) {
                        // If its handled stop executing handlers
                        handled = true;
                        break;
                    }
                }
            }
        }
    }

    // Combine ajax options with the defaults
    ajaxOptions = $.extend(ajaxOptions, $$.ajaxConfig);
    // Override ajax default options with this call specifics
    ajaxOptions = $.extend(ajaxOptions, opts);

    // If we are authorizing or the ajax call doesnt need authorization we make the call directly (no authorization flow)
    // If the call needs authorization and we are not authorizing we do the authorization flow
    if (!authorizing && auth) {
        // Configures authorization and makes the ajax call
        function invoke() {
            // Configure authorization on ajax request
            ajaxOptions = ajaxOptions.authorization.configAuthorization(ajaxOptions);

            // AJAX call
            $.ajax(ajaxOptions);
        }

        // If don´t have authorization we must authorize
        if (!ajaxOptions.authorization.has()) {
            // Set the flag to true so any ajax call during authorization does not trigger the authorization flow (again)
            authorizing = true;

            // Call the function to authorize and wait for callback
            ajaxOptions.authorization.authorize(function(authorized) {
                // When authorization is obtained clear the authorizing flag
                authorizing = false;

                // Then if credentials are obtained make the ajax call
                if (authorized) {
                    invoke();
                }
            });
        } else {
            // If already have credentials invoke
            invoke();
        }
    } else {
        // If its authorizing do the ajax call directly (not doing the authorization flow again)
        $.ajax(ajaxOptions);
    }
}

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

// Modules List
$$.modules = ko.associativeObservable({});

// Starts the quark application
// You can specify a model to bind the page
$$.start = function(model) {
    if (!$$.started) {
        ko.applyBindings(model);
        $$.started = true;
    }
}

// Allows to define a module in quark.
// With this method you can encapsulate components, routes, css, and js dependencies in one module.
// The module must be defined as a require.js module. As dependency of this module you must define 'module'
// in wich require.js will inject the module info.
// Then you must pass this value as the first parameter to this function, this allows the quark module learn info about the associated
// require.js module in wich is defined.
// The config parameters allows to define, the components that your module includes, extra configuration for require
// to define your module's dependencies, css files that your module uses and extra routes you want to configure.
// The mainConstructor parameter is optional, but allow to define a class that will be called when the module is instantiated.
// This class will be called instantiated passing as parameter the name defined in require.js for this module.
// If the class has a ready function defined it will be called when the module is loaded
$$.module = function(moduleInfo, config, mainConstructor) {
    // Validate parameters
    if (!$$.isDefined(moduleInfo)) {
        throw 'Must specify the module configuration. You can define \'module\' as dependency and pass that value in this parameter';
    }

    // Get the modules name and path from the require module info removing all text after the last / (the file name)
    var moduleName = moduleInfo.id.substring(0, moduleInfo.id.lastIndexOf('/'));
    var modulePath = moduleInfo.uri.substring(0, moduleInfo.uri.lastIndexOf('/'));

    // If there is already a module with this name defined return it
    if ($$.modules.get(moduleName)) {
        return $$.modules.get(moduleName);
    }

    // If config is not defined create an empty one
    if (!config) {
        config = {};
    }

    // If there's a require configuration append module's path to the defined paths and apply
    if ($$.isDefined(config.require)) {
        if (config.require.paths) {
            // Iterate over the paths adding the module path as root
            for (var pathName in config.require.paths) {
                config.require.paths[pathName] = modulePath + '/' + config.require.paths[pathName];
            }
        }

        // Apply configuration to require
        require(config.require);
    }

    // If there's a components configuration add the prefix to the tag name of each component,
    // the module path to the component's path and register
    if (config.components) {
        // Iterate over the components
        for (var componentTagName in config.components) {
            // Add the prefix to the tag name and the module name as root to the module path
            var tagName = config.prefix + "-" + componentTagName;
            var path = moduleName + '/' + config.components[componentTagName];

            // Register the component
            $$.registerComponent(tagName, path);
        }
    }

    function configNamespace(namespace, components) {
        for (var name in components) {
            var item = components[name];

            var fullName;

            if (name) {
                fullName = namespace + '-' + name;
            } else {
                fullName = namespace;
            }

            if ($$.isString(item)) {
                $$.registerComponent(fullName, moduleName + '/' + item);
            } else {
                configNamespace(fullName, item);
            }
        }
    }

    // If theres namespace component registrations
    if (config.namespaces) {
        if (config.prefix) {
            configNamespace(config.prefix, config.namespaces);
        } else {
            configNamespace('', config.namespaces);
        }
    }

    // If extra routes are defined call the configure method
    if (config.routes) {
        $$.routing.configure(config.routes);
    }

    // If there's a css configuration add links in the header
    if ($$.isArray(config.css)) {
        // Iterate over the css file loading each one
        for (var i = 0; i < config.css.length; i++) {
            $$.loadCss(modulePath + '/' + config.css[i]);
        }
    }

    // Main object
    var main = {};

    // If there's a main object defined create it.
    if (mainConstructor) {
        main = new mainConstructor(moduleName);
    }

    // If the main object has an start method call it
    if (main['start']) {
        main.start();
    }

    // Add the module data to the associative array
    $$.modules.add(moduleName, {
        name: moduleName,
        path: modulePath,
        info: moduleInfo,
        config: config,
        main: main
    });

    return $$.modules.get(moduleName);
}

// Defines a quark component.
// The first parameter is the component model class, and the second is the component's template.
$$.component = function(viewModel, view) {
    // If only one parameter is specified we assume that is view only component
    if (!$$.isDefined(view)) {
        view = viewModel;
        $$.undefine(viewModel);
    }

    // Viewmodel constructor function
    function Model(p) {
        // Component's model
        var model;
        var self = model;
        // Creates empty scope
        var $scope = {
        };
        // Creates an empty imports object
        var $imports = {
        }

        // If theres a model defined
        if (viewModel && !model) {
            // Creates the model passing the received parameters an empty scope
            model = new viewModel(p, $scope, $imports);

            // Creates an error handler for the component
            var componentErrors = new ComponentErrors($$.controller, model);

            // Adds the componentErrors property
            if (model) {
                // Warns if the property already exists
                if (model.componentErrors) {
                    console.warn('This component already have a property named componentErrors, wich will be replaced by the quark component error list.')
                }
                model.componentErrors = componentErrors;
            }

            // Calls the function initComponent if exists
            if ($imports && $$.isFunction($imports.initComponent)) {
                $imports.initComponent();
            }

            // Adds the created model to the scope.
            $scope.model = model;
            // Add the imported objects to the scope
            $scope.imports = $imports;
            // Adds the defined error handler to the scope
            $scope.componentErrors = componentErrors;
            // Adds a reference to the controller to the scope
            $scope.controller = $$.controller;
        }

        // Creates model, scope and error handlers getters.
        // This are used by quark to access each element.
        this.getModel = function() { return model; }
        this.getScope = function() { return $scope; }
        this.getImports = function() { return $imports; }

        // When the component is disposed Knockout calls this method.
        // We use it to dispose all objects.
        this.dispose = function() {
            // If theres a model defined and has a dispose method call it
            if (model && model.dispose) {
                model.dispose();
            }

            // If there's a ready lock defined undefine it
            if ($imports && $imports.readyLock) {
                $$.undefine($imports.readyLock);
            }

            // If there's a readiedSignal defined clear all listeners and undefine it
            if ($imports && $imports.readiedSignal) {
                $$.signalClear($imports.readiedSignal);
                $$.undefine($imports.readiedSignal);
            }

            // If there's a loadedSignal defined clear all listeners and undefine it
            if ($imports && $imports.loadedSignal) {
                $$.signalClear($imports.loadedSignal);
                $$.undefine($imports.loadedSignal);
            }

            // If theres an scope defined and has a dispose method call it
            if ($scope && $scope.dispose) {
                $scope.dispose();
            }

            // If theres an componentErrors property clear it and remove it
            if (model && model.componentErrors) {
                model.componentErrors.clear();
                $$.undefine(model.componentErrors);
            }

            // Undefine all internal variables.
            $$.undefine(model);
            $$.undefine($scope);
            $$.undefine($imports);
        }
    }

    // Return the module definition and viewmodel as needed by knockout.
    if (viewModel) {
        return { template: view, viewModel: Model, modelType: viewModel }
    } else {
        return { template: view }
    }
}

// This function allows to define the accepted parameters of the quark component.
// In the first parameter you must specify an object with parameters and the default value.
// The second parameter must contain the parameters values, you can pass here the first parameter received in the component model
// definition.
// The third parameter allows to specify an object or an array of objects. Quark will create a property in the specified objects
// for each parameter defined.
// If the defined parameter is an observable, check the received parameter with the same name:
//      - If its an observable replace the defined with the received observable.
//      - If its not an observable set the received value in defined the observable.
// If the defined parameters is not an observable, check the received parameter with the same name:
//      - If its an observable set the defined parameter value with the received observable's content.
//      - if its not an observable set the received value in the defined parameter.
// This allows the defined parameter to maintain it's type while populating with the received values, and in the case of
// observables allows components to share an observable.
$$.parameters = function(params, values, objects) {
    // Checks the parameters configuration object
    if (!$$.isObject(params)) {
        throw 'You must specify a parameters config object';
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
    }

    // Check the objects parameter
    if (!$$.isDefined(objects)) {
        throw 'You must specify the viewmodel of the component in wich to load the parameters.';
    }

    // If objects parameter is not array create one with the specified value
    if (!$$.isArray(objects)) {
        objects = Array(objects);
    }

    // Iterate the parameters
    for (var name in params) {
        // Iterate the target objects
        for (var i = 0; i < objects.length; i++) {
            // Get the target object
            var object = objects[i];

            // Warn if config exists
            if ($$.isDefined(object[name])) {
                console.warn('There is already a property named ' + name + ' in the target component. It will be replaced with the specified parameter.');
            }

            // Create an object property with the parameter
            object[name] = params[name];

            // If there is a value defined in the component tag for the parameter
            if ($$.isDefined(values[name])) {
                // If both target and source params are observable try to overwrite it
                if (ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    object[name] = values[name];
                // If target is observable and source is not, then set the targets content with the source value
                } else if (ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    object[name](values[name]);
                // If target is not an observable and source is, then set the targets with the source content
                } else if (!ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    object[name] = values[name]();
                // If both are not observables
                } else if (!ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    // Check if the parameter should be a callback, if not set the value
                    if (!$$.isFunction(object[name])) {
                        object[name] = values[name];
                    } else {
                        // If the parameter should be a callback and the target is a function then replace it.
                        if ($$.isFunction(values[name])) {
                            object[name] = values[name];
                        } else {
                            // Err if not's a callback
                            if ($$.isDefined(values[name])) {
                                throw 'The parameter ' + name + ' must be a callback.';
                            }
                        }
                    }
                }
            }
        }
    }
}

// Copies one object into other. If recursively is false or not specified it copies all properties in the "to" object
// that exists in "from" object, if recursively is true does the same with each property (copying object graphs)}
// It copies observable's contents not the observable itself.
$$.inject = function (from, to, recursively) {
    if (!$$.isDefined(from)) {
        return;
    }

    if (!$$.isDefined(to)) {
        return;
    }

    for (var name in from) {
        if ($$.isDefined(to[name])) {
            var value;

            if (ko.isObservable(from[name])) {
                value = from[name]();
            } else {
                value = from[name];
            }

            if (ko.isObservable(to[name])) {
                if (recursively && $$.isObject(to[name]())) {
                    $$.inject(value, to[name](), true);
                } else {
                    to[name](value);
                }
            } else {
                if (recursively && $$.isObject(to[name])) {
                    $$.inject(value, to[name], true);
                } else {
                    to[name] = value;
                }
            }
        }
    }
}

// Returns an empty component template (useful when creating data components)
$$.emptyTemplate = function(virtual) {
    if (!virtual) {
        return '<quark-component></quark-component>';
    } else {
        return '<!-- quark-component --><!-- /quark-component -->'
    }
}

// Register the component making it available to use with a custom tag.
// You must specify the component's custom tag and the url to the definition.
$$.registerComponent = function(tag, url) {
    ko.components.register(tag, { require: url });
}

// Allows to group components in namespaces. The final component name is
// the namespace-component name. This method allows to chain calls to register
// to register various components under the same namespace, ie:
// $$.namespace('navbar')
//      .register('link')
//      .register('button')
//      .register('dropdown')
// Registers navbar-link, navbar-button and navbar-dropdown components.
$$.onNamespace = function(namespace) {
    var self = this;

    var ns = namespace;

    this.register = function(name, url) {
        $$.registerComponent(ns + '-' + name, url);

        return self;
    }

    this.namespace = function(namespace) {
        return new $$.onNamespace(ns + '-' + namespace);
    }

    return self;
}

// Loaded behaviours array
var behaviours = {};

// Define a behaviour with the specified name.
// Behaviours allows to attach functionality to an object. This makes possible to share the same code across various classes
// enabling a sort of hierachy.
// If an object has an specific behaviour we can assume it will have certain methods and properties associated with the behaviour.
// Basically a behaviour definition is a function that receives and object and a configuration and attaches the required methods
// and properties.
// The first parameter is the name of the behaviour, it will be used when applying this behaviour to an object.
// The second parameter is a function that accepts a parameter with the object to wich the behaviour must be applied
// The last parameter allows to define a function that runs when the object with this behaviour is disposed. This function must accept
// as parameter the object that is being disposed.
$$.behaviour = function(name, behaviour, dispose) {
    // Warn if behaviour is repeated
    if ($$.behaviour[name]) {
        console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
    }

    // Error if behaviour name is not a string
    if (!$$.isString(name)) {
        throw 'The behaviour name must be an string.';
    }

    // Error if behaviour is not a function
    if (!$$.isFunction(behaviour)) {
        throw 'The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.';
    }

    // Error if behaviour dispose is defined but not a function
    if ($$.isDefined(dispose) && !$$.isFunction(dispose)) {
        throw 'The behaviour dispose must be a function that performs cleanup of the behaviour when disposing.';
    }

    // Define the disposal of the behaviour
    behaviour.dispose = dispose;

    // Adds the new behaviour to the table
    behaviours[name] = behaviour;
}

// Applies a behaviour to the object
function applyBehaviour(behaviourName, object, config) {
    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
    }

    // Check if behaviour exists
    if (behaviours[behaviourName]) {
        // Apply new behaviour by calling the behaviour definition function with the target object and
        // the behaviour config
        behaviours[behaviourName](object, config);

        // Check if there's a $support variable on the object and if not create one. (Used by quark to store metadata)
        if (!$$.isDefined(object.$support)) {
            object.$support = {};
        }

        // Check if there's a behaviour array on the object. (Used to maintain the applied behaviours list)
        if (!$$.isDefined(object.$support.behaviours)) {
            object.$support.behaviours = {};
        }

        // Add the applied behaviour to the list
        object.$support.behaviours[behaviourName] = true;
    } else {
        throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
    }
}

// Applies the behaviour to the object. You can specify a string with the name of a defined behaviour
// or an array of behaviour names.
$$.behave = function(behaviour, object, config) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    if ($$.isArray(behaviour)) {
        // If it's an array we iterate it applying each behaviour
        for (var i = 0; i < behaviour.length; i++) {
            applyBehaviour(behaviour[i], object, config);
        }
    } else if ($$.isString(behaviour)) {
        // If it's a string apply the named behaviour
        applyBehaviour(behaviour, object, config);
    } else {
        // Everything else fails
        throw 'The behaviour name must be an string or an array of strings.';
    }
}

// Checks if the behaviour has been added to the object
$$.hasBehaviour = function(object, behaviourName) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to check the behaviour.';
    }

    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string.';
    }

    // Check if the object has the specified behaviour added
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.behaviours)) {
        if ($$.isDefined(object.$support.behaviours[behaviourName])) {
            return true;
        }
    }

    return false;
}

// Disposes object behaviours
$$.disposeBehaviours = function(object) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    // If theres a quark metadata defined with behaviours
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.behaviours)) {
        // Iterate applied behaviours calling the dispose function of each behaviour and passing the disposed object on each
        for (var name in object.$support.behaviours) {
            var behaviour = object.$support.behaviours[name];

            if (behaviour.dispose) {
                behaviour.dispose(object);
            }
        }
    }
}

// Registers the quark component in Knockout, it contains the component scope and model binder
ko.components.register('quark-component', {
    template: "<!-- ko componentScope --><!-- /ko --><!-- ko modelBinder --><!-- /ko -->"
});

// The component scope creates the context for the component and bind its template to the specified $scope,
// effectively separating the scope and model.
// The binding also overrides the context hiding the references to the quark-component object
ko.bindingHandlers.componentScope = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get the new accesor and context
        var newAccesor = createComponentScopeAccesor(context);
        var newContext = createComponentScopeContext(context);

        // Basically the binding is an extension of the template binding with an altered context
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, newContext.$data, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get the new accesor and context
        var newAccesor = createComponentScopeAccesor(context);
        var newContext = createComponentScopeContext(context);

        // Basically the binding is an extension of the template binding with an altered context
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, newContext.$data, newContext);
    }
};
ko.virtualElements.allowedBindings.componentScope = true;

// Creates the component scope accesor with the DOM nodes of the component.
function createComponentScopeAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

// Alters the binding context for the component scope.
// The component must bind at the parent level using it's scope as binding data, but all other reference
// must be to the component's model.
function createComponentScopeContext(context) {
    // The model and context is at parent level
    var component = context.$parent;
    var parentContext = context.$parentContext;

    // Extend the current context and overwrite properties
    var newContext = context.extend({
        $component: component.getModel(),
        $componentTemplateNodes: parentContext.$componentTemplateNodes,
        $data: component.getScope(),
        $parent: parentContext.$parent ? parentContext.$parent.model : undefined,
        $parentContext: parentContext.$parentContext,
        $parents: parentContext.$parents,
        $rawData: component.getScope(),
        $root: parentContext.$root
    });

    // If the parent array is defined and contains a valid quark-component parent
    if ($$.isArray(newContext.$parents) && newContext.$parents[0] && newContext.$parents[0].model) {
        // Replace the reference to the quark-component with it's model only to avoid exposing
        // the scope and imports object
        newContext.$parents[0] = newContext.$parents[0].model;
    }

    return newContext;
}

// Quark allows to specify the model-bind attribute in the component's custom tag.
// This bindings are applied to the component when it's contents are bound and are bound at the parent's context level
// The modelBinder searchs for the model-bind attribute and creates a virtual element inside the quark-component that
// applies the specified bindings when the element loads
ko.bindingHandlers.modelBinder = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get the new accessor and context for the binding
        var newAccesor = createModelBinderAccessor(element);
        var newContext = createModelBinderContext(context);

        // Basically the model binder is an extension of the template component
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get the new accessor and context for the binding
        var newAccesor = createModelBinderAccessor(element);
        var newContext = createModelBinderContext(context);

        // Basically the model binder is an extension of the template component
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.modelBinder = true;

// Returns if the specified element is child of the "search" element,
// taking into account even virtual elements.
function isChildOf(element, search) {
    // Get the element's childs
    var childs = ko.virtualElements.childNodes(element);

    // If the specified element is in the element childs list return true
    for (var i = 0; i < childs.length; i++) {
        if (childs[i] == search) {
            return true;
        }
    }

    // If not found return false.
    return false;
}

// Returns the parent of the specified element, taking into account even virtual elements.
function findParent(element) {
    // Get the previous sibling element (being a tag, text or comment)
    var previous = element.previousSibling;

    // It iterates over previous siblings of the given element trying to find wich one
    // has this element as child, if found, this is the parent element.
    while (previous != null) {
        if (isChildOf(previous, element)) {
            return previous;
        }

        previous = previous.previousSibling;
    }

    // If there are no previous siblings, the parent is effectively the
    // real parent tag of the element (non virtual)
    if (previous == null) {
        return element.parentNode;
    }
}

function findModelBinderAttribute(element) {
   // Given the type of tag we search the model-bind attribute in different ways.
    if (element.nodeType == 8) {
        // If node is virtual find the model-bind="<your binding here>" string
        var match = element.nodeValue.match(/model-bind[\s]*:[\s]*\"[\s\S]*?\"/);

        // If a match is found create the binding in the model space
        if (match) {
            var content = match[0].match(/\"[\s\S]*?\"/);

            if (content) {
                var start = content[0].indexOf('\"') + 1;
                var end = content[0].indexOf('\"', start);

                return content[0].substring(start, end);
            }
        }
    } else {
        // If node is a normal tag, check if it has attributes
        if (element.attributes) {
            // Then search along the element's attributes and trying to find the "model-bind" attribute.
            for (var i = 0; i < element.attributes.length; i++) {
                var attrib = element.attributes[i];

                // If found create the binding in the model space
                if (attrib.specified) {
                    if (attrib.name == "model-bind") {
                        return attrib.value;
                    }
                }
            }
        }
    }

    return false;
}

// The model binder allows to define bindings in the component's custom tag that binds when the component content
// loads. It's accessor searchs on the element's tag for the model-bind attribute and creates a knockout binding
// inside the element that will be bound when the element content loads.
function createModelBinderAccessor(element) {
    var newAccesor = function() {
        var nodes = Array();

        // Find the element's defining tag. It's the grandparent because the parent is the quark-object tag.
        var parent = findParent(element);
        parent = findParent(parent);

        var modelBind = findModelBinderAttribute(parent);

        if (modelBind) {
            nodes.push(document.createComment(" ko " + modelBind + " "));
            nodes.push(document.createComment(" /ko "));
        }

        // Add the bindings to the template
        return { nodes: nodes, if: nodes.length > 0 };
    };

    // Return the new accessor
    return newAccesor;
}

// The model binder operates at the component parent's level
// To bind at this level it has to use the grand parent's context because the parent is the quark-component.
// It also extends this context with a property named $container wich contains the component's model
function createModelBinderContext(context) {
    var seniorContext = context.$parentContext.$parentContext;
    var viewModel = context.$parent;

    var newContext = seniorContext.extend({
        $container: viewModel.getModel(),
        $containerContext: context.$parentContext
    });

    return newContext;
}

// Calls the ready method on the model and marks as ready on the parent if is tracking dependencies, then calls the function
// to reevaluate the parent's readiness
function markReadyAndInformParent(model, imports) {
    // Calls the object ready method and unlocks the readyLock
    callReady(model, imports);

    // If the object is tracked and has a parent, mark itself as ready on the parent
    // and call the function on the parent to reevaluate readiness.
    if ($$.isDefined(imports.$support) && $$.isDefined(imports.$support.tracking) && $$.isDefined(imports.$support.tracking.parent)) {
        // Mark the object ready on the parent
        imports.$support.tracking.parentState['ready'] = true;

        // Call the readied method and signal
        callReadied(imports.$support.tracking.parent, imports.$support.tracking.parentState.propertyName, imports);

        // Inform to the tracking system on the parent that a child is ready
        imports.$support.tracking.parent.$support.tracking.childReady();
    }
}

// Check if the object is ready verifying that all tracked childs are loaded and ready
function checkObjectReady(imports) {
    // If any dependency is not loaded or ready then exit
    // !! OPTIMIZE !! by using a counter and not iterating all array over and over
    for (var property in imports.$support.tracking.childs) {
        if (!imports.$support.tracking.childs[property]['loaded'] || !imports.$support.tracking.childs[property]['ready']) {
            return false;
        }
    }

    return true;
}

// Calls the object's readied function and signals passing the property name and model
function callReadied(object, propertyName, vm) {
    // If theres a readied function on the object call it passing the dependency name and model
    if ($$.isDefined(object['readied'])) {
        object.readied(propertyName, vm);
    }

    // If theres a readied signal on the object dispatch it with the readied object
    if ($$.isDefined(object['readiedSignal'])) {
        object.readiedSignal.dispatch(propertyName, vm);
    }
}

// Calls the object's loaded function and signals passing the property name and model
function callLoaded(object, propertyName, vm) {
    // If theres a loaded function on the object call it passing the dependency name and model
    if ($$.isDefined(object['loaded'])) {
        object.loaded(propertyName, vm);
    }

    // If theres a loaded signal on the object dispatch it with the readied object
    if ($$.isDefined(object['loadedSignal'])) {
        object.loadedSignal.dispatch(propertyName, vm);
    }
}

// Call Ready function and open lock on the object
function callReady(model, imports) {
    // If there´s a ready callback on the object invoke it
    if ($$.isFunction(imports['ready'])) {
        imports['ready']();
    }

    // If theres a ready lock on the object unlock it
    if ($$.isDefined(model['readyLock'])) {
        model.readyLock.unlock();
    }
}

// Start tracking the loading state of a child object.
function initTracking(model, imports, name) {
    // If the specified binding is not an string throw an error (to avoid a common mistake)
    if (!$$.isString(name)) {
        throw 'The import value must be an string with the name of the property to create on the parent object';
    }

    // If the target object doesn´t have a $support property initialize it
    if (!$$.isObject(imports.$support)) {
        imports.$support = {};
    }

    // Sets the childs array wich tracks the dependencies and state of each viewModel to import
    if (!$$.isObject(imports.$support.tracking)) {
        imports.$support.tracking = {
            childs: {}
        }
    }

    // Creates a ready lock to fire when the object is ready
    model.readyLock = $$.lock();

    // Creates a signal to fire when a dependency loads
    imports.loadedSignal = $$.signal();

    // Creates a signal to fire when a dependency is ready
    imports.readiedSignal = $$.signal();

    // Start tracking the dependency with the specified name.
    imports.$support.tracking.childs[name] = {};

    // The child components uses this function to notify that it finished loading.
    // PropertyName contains the child name, and vm the corresponding viewmodel.
    imports.$support.tracking.childs[name]['load'] = function(propertyName, vm, imp) {
        // Sets the child viewmodel and marks it as loaded
        imports[propertyName] = vm;
        imports.$support.tracking.childs[propertyName]['loaded'] = true;

        callLoaded(imports, propertyName, vm);

        // Save the property name
        imports.$support.tracking.childs[propertyName]['propertyName'] = propertyName;

        // If the child is tracking dependencies itself...
        if ($$.isDefined(imp.$support) && $$.isDefined(imp.$support.tracking)) {
            // If the child has dependencies mark the dependency as not ready and save
            // the parent data (reference and state)
            imports.$support.tracking.childs[propertyName]['ready'] = false;

            imp.$support.tracking.parent = imports;
            imp.$support.tracking.parentState = imports.$support.tracking.childs[propertyName];
        } else {
            // If the child hasn't dependencies mark the dependency on parent as ready
            imports.$support.tracking.childs[propertyName]['ready'] = true;

            callReadied(imports, propertyName, vm);
        }

        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(imports)) {
            markReadyAndInformParent(model, imports);
        }
    }

    // Initialize the tracking flag of the child component loaded state
    imports.$support.tracking.childs[name]['loaded'] = false;

    // Defines a function to call when one of this object childs is ready.
    // It forces the object to reevaluate this object readiness
    imports.$support.tracking.childReady = function(propertyName, vm) {
        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(imports)) {
            markReadyAndInformParent(model, imports);
        }
    }
}

// Add the export binding to the model-bindings of this component.
function addExportBinding(element, name, bindName) {
    // If the element is virtual
    if (element.nodeType == 8) {
        // Search for the model-bind attribute in the virtual tag
        var match = element.nodeValue.match(/model-bind[\s]*:[\s]*\"[\s\S]*?\"/);

        // If a match is found
        if (match) {
            // Get the content of the binding
            var content = match[0].match(/\"[\s\S]*?\"/);

            // If content is found add the specified binding to the existing
            if (content) {
                var start = content[0].indexOf('\"') + 1;
                var end = content[0].indexOf('\"', start);

                var value = content[0].substring(start, end);

                var newContent = "\"" + value;

                if (value) {
                    newContent += ", ";
                }

                newContent += bindName + ": '" + name + "'\"";
                element.nodeValue = element.nodeValue.replace(content[0], newContent);
            }
        } else {
            // If the model-bind attribute is not found create it with the specified binding
            element.nodeValue += "model-bind: \"" + bindName + ": \'" + name + "\'\"";
        }
    } else {
        var found = false;

        // If node is a normal tag, check if it has attributes
        if (element.attributes) {
            // Then search along the element's attributes and trying to find the "model-bind" attribute.
            for (var i = 0; i < element.attributes.length; i++) {
                var attrib = element.attributes[i];

                // If found create the binding in the model space
                if (attrib.specified) {
                    if (attrib.name == "model-bind") {
                        if (attrib.value) {
                            attrib.value += ", ";
                        }

                        attrib.value += bindName + ": '" + name + "'";
                        found = true;
                    }
                }
            }
        }

        // If the model-bind tag is not found create it with the specified tag
        if (!found) {
            var attrib = element.setAttribute("model-bind", bindName + ": '" + name + "'");
        }
    }
}
// Imports the component to its parent
ko.bindingHandlers.import = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
        // Gets the name of the property in wich to import the viewmodel
        var name = valueAccessor();

        var model;
        var imports;

        // If the target object has "model" and "imports" properties, then assume that is a quark scope and
        // extract the model and imports object
        if (viewModel && viewModel.imports && viewModel.model) {
            model = viewModel.model;
            imports = viewModel.imports;
        } else {
            model = viewModel;
            imports = viewModel;
        }

        // Start tracking the loading of imported childs
        initTracking(model, imports, name);

        // Init the dependency property in the target object
        imports[name] = {};

        // Adds the export binding to the element
        addExportBinding(element, name, 'export');
    }
}
ko.virtualElements.allowedBindings.import = true;

function callLoadMethod(property, imports, context) {
    // Check if the viewmodel is tracking childs properties
    if ($$.isDefined(imports.$support) && $$.isDefined(imports.$support.tracking)) {
        if ($$.isDefined(imports.$support.tracking['childs'])) {
            // If the viewmodel is tracking a model to be loaded in a property with the specified name
            if ($$.isDefined(imports.$support.tracking.childs[property])) {
                // Call the load method of the tracking object passing the child object with the viewModel of the child component
                imports.$support.tracking.childs[property]['load'](property, context.$container, context.$containerContext.$data.getImports());
            } else {
                throw 'The specified object doesn´t have a property named ' + property + '. Verify that the object has a property defined with the .components method with the name defined in the vm binding.';
            }
        } else {
            throw 'The specified object doesn´t have the tracking property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
        }
    } else {
        throw 'The specified object doesn´t have the tracking.childs property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
    }
}


ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // If the binding model has "model" and "imports" properties we assume that is a quark-component's scope.
        if (viewModel && viewModel.model && viewModel.imports) {
            viewModel = viewModel.imports;
        }

        var property;

        if ($$.isString(value)) {
            property = value;
        } else {
            throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
        }

        callLoadMethod(property, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.export = true;

ko.bindingHandlers.exportToController = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // Get the current route
        var current = $$.routing.current();

        // If theres a controller on the current route
        if (current && current.controller) {
            var value;

            // Get's the binded value
            value = ko.unwrap(valueAccessor());

            // If the binding model has "model" and "imports" properties we assume that is a quark-component's scope.
            if (routers[current.locationName].routes[current.routeName].controllerImports) {
                viewModel = routers[current.locationName].routes[current.routeName].controllerImports;
            }

            var property;

            if ($$.isString(value)) {
                property = value;
            } else {
                throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
            }

            callLoadMethod(property, viewModel, context);
        }
    }
}
ko.virtualElements.allowedBindings.exportToController = true;

// Uses jquery to select the nodes to show from the componentTemplateNodes
function createContentAccesor(valueAccessor, allBindingsAccessor, context) {
    // Gets the value
    var value = ko.unwrap(valueAccessor());
    // Get the namespace alias
    var replace = allBindingsAccessor.get('replace') || false;

    // New Accesor
    var newAccesor = function () {
        // If a value is specified use it as a jquery filter, if not use all the nodes.
        if ($$.isDefined(value)) {
            var nodes = $(context.$componentTemplateNodes).filter(value);

            if (replace) {
                nodes = nodes.contents();
            }

            return { nodes: nodes };
        } else {
            return { nodes: context.$componentTemplateNodes };
        }
    };

    // Returns the new accesor
    return newAccesor;
}

// Creates the context for the content binding. It binds at parent level and adds a property with the
// viewmodel of the contained component.
function createContentContext(context) {
    var parentContext = context.$parentContext;
    var viewModel = context.$data;

    var newContext = parentContext.extend({
        $containerContext: context,
        $container: viewModel.model
    });

    return newContext;
}

// This binding is used in the template of a component to show the custom markup passed to the component as content.
// It allows to define where in your component's template the specified content is shown.
// You can specify a jquery selector indicating wich part of the component content to show, if no selector is specified all
// content is shown
ko.bindingHandlers.content = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(valueAccessor, allBindingsAccessor, context);
        var newContext = createContentContext(context);

        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(valueAccessor, allBindingsAccessor, context);
        var newContext = createContentContext(context);

        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.content = true;

// Creates an accesor that returns true if there are elements that matches
// the specified jquery selector inside the component's content
function createHasContentAccesor(valueAccessor, context) {
    var value = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        return $(context.$componentTemplateNodes).filter(value).length > 0;
    };

    return newAccesor;
}

// Shows and bind its content only if there are elements that
// matches the specified jquery selector in the component's content
ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, context);

        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

// The inverse of the hasContent binding.
ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, context);

        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;

// This binding works in conjunction with the routing system.
// When configuring the routes you can define a page name and the component that must be shown when that route is matched.
// The specified component is shown inside a component that has a page binding with the matching name.
ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Page name on the route
        var name = ko.unwrap(valueAccessor());

        // Current component and parameters
        var current = {
            component: ko.observable(),
            parameters: ko.observable()
        };

        // This computed observable updates the current component and parameters when route changes
        var updater = ko.computed(function() {
            // Gets the current route
            var currentRoute = $$.routing.current();

            var component;
            var params = {};

            // If there's a current route
            if (currentRoute) {
                // If a component is not defined for the current route throw an error
                if (!currentRoute.config.components[name]) {
                    throw 'No component defined for page ' + name + ' in route ' + currentRoute.config.fullName;
                }

                // Get the component name
                component = currentRoute.config.components[name];

                // If the currentRoute has a controller defined
                if (currentRoute.controller) {
                    // Get the imports object of the controller
                    var imports = routers[currentRoute.locationName].routes[currentRoute.routeName].controllerImports;

                    // If the controller has a imports variable created
                    if (imports && imports.configPage) {
                        // Call the configPage method to get an object to pass as parameters
                        // for this page's component
                        params = imports.configPage(name);

                        // If the returned variable is not an object replace it by an empty
                        // object
                        if (!$$.isObject(params)) {
                            params = {};
                        }
                    }
                }

                // Set persistent flag to false
                // A persistent flag indicates that if the route changes, but the same component
                // is applied to this page then do not redraw it,
                // just change the parameters
                var persistent = false;

                // If the component name in the route starts with ! then is persistent
                if (component.charAt(0) == "!") {
                    // Set the persistent flag
                    persistent = true;
                    // Clear the component name of the !
                    component = component.substr(1);
                }

                // If its a diferent component name or the component is not persistent update component name and parameters
                // If its a persistent component the routing system will update the parameters values
                if (current.component() != component || !persistent) {
                    current.component(component);
                    current.parameters(params);
                }
            }
        });

        // Create an accessor for the component binding
        var newAccesor = function () {
            // Return the accesor for the component binding
            return {
                name: current.component,
                params: current.parameters
            }
        };

        addExportBinding(element, name, 'exportToController');

        // When disposing the page element (and this binding) dispose the computed observable
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            updater.dispose();
        });

        return ko.bindingHandlers.component.init(element, newAccesor, allBindingsAccessor, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.page = true;

// Creates an accesor for the if binding indicating if inside the components content there are elements that matches
// the specified jquery selector
function createHasPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var name = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        var current = $$.routing.current();

        if ($$.isDefined(current.route.components[name])) {
            return true;
        }

        return false;
    };

    return newAccesor;
}

// This binding is similar to the if binding, it shows and bind its content only the current route
// there are defined components to show with the specified name
ko.bindingHandlers.hasPage = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccessor = createHasPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);

        return ko.bindingHandlers['if'].init(element, newAccessor, allBindingsAccessor, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.hasPage = true;

// Initialize the crossroads routers for each location
var routers = {};


// Quark router object
function QuarkRouter() {
    var self = this;

    // An observable that has the current route
    this.current = ko.observable();

    // Routes configuration
    this.configuration = {};

    // List of defined location finders.
    // Quark allows to define routes grouped by "locations"
    // Each "location" have a set of routes defined independent of other.
    this.locationFinders = [];

    // List of defined location generators
    // Quark allows to define functions that given a location configuration return an url that
    // matches.
    this.urlGenerators = [];

    // Specific route configuration, contains all route data and register the route in crossroads.js
    function Route(locationName, routeName, config) {
        var routeObject = this;

        // Store the route's location name
        routeObject.locationName = locationName;

        // Store the route's route name
        routeObject.routeName = routeName;

        // Create the controller imports, this object holds the reference to the models
        // of the components defined in the route
        routeObject.controllerImports = {};

        // Changes the current route and sets the specified controller
        function changeCurrent(routeController) {
            var current = self.current();

            // If the controller of the current route is different from the new one
            // proceed to some cleanup
            if (current && current.controller != routeController) {
                // If the controller has a "leaving" method call it to allow
                // controller cleanup, if controller result is false do not reroute
                if (current.controller) {
                    if (current.controller.leaving) {
                        if (current.controller.leaving() === false) {
                            return;
                        }
                    }

                    // If the current controller contains a componentErrors variable
                    // clear the errors
                    if (current.controller.componentErrors) {
                        current.controller.componentErrors.clear();
                    }

                    // If the controller is not persistent clear the saved controller
                    // from the route configuration
                    if (routeController && current.config.controller.charAt(0) != "!") {
                        delete routeObject.controller;
                    }

                    // Clear the actual controller reference
                    delete current.controller;
                }
            }

            // Change the current route
            self.current({
                locationName: locationName,
                routeName: routeName,
                config: config,
                params: config.params,
                controller: routeController
            });

            // If the controller is defined and has a show method invoke it
            if (routeController && routeController.show) {
                routeController.show();
            }

            // Dispatch the routed signal
            self.routed.dispatch();

            // Unlock the first routing lock
            self.firstRouting.unlock();
        }

        // Initialize a controller creating the componentErrors property and initializing
        // the tracking of route components
        function initController(controller) {
            // If theres a route controller defined and it doesn't have an error handler created
            // create one.
            if (controller) {
                // If property will be overwritten warn the user
                if (controller.componentErrors) {
                    console.warn('This controller already have a property named componentErrors, wich will be replaced by the error handler.');
                }

                // Create the error handler
                controller.componentErrors = new ComponentErrors(controller);

                // If there's components defined in the component config init tracking in all of them
                // passing the controller imports object
                if ($$.isObject(config.components)) {
                    for (var name in config.components) {
                        initTracking(controller, routeObject.controllerImports, name);
                    }
                }
            }
        }

        // Create the controller passing the route data and imports object
        function createController(controllerCreated) {
            var routeController;

            // If the controller is a string then assume its a js module name
            if ($$.isString(config.controller)) {
                var controllerFile;

                // If the controller is persistent, extract the ! from the filename begining
                if (config.controller.charAt(0) == "!") {
                    controllerFile = config.controller.substr(1);
                } else {
                    controllerFile = config.controller;
                }

                // Require the controller file
                require([controllerFile], function(controllerObject) {
                    // Check that the returned js module is the controller's constructor function
                    if ($$.isFunction(controllerObject)) {
                        // Create the controller passing the route config and import object
                        routeController = new controllerObject(config, routeObject.controllerImports);
                        routeObject.controller = routeController;
                        controllerCreated(routeController);
                    } else {
                        throw 'The specified controller file ' + config.controller + ' must return the controller\'s constructor';
                    }
                });
            } else {
                // If controller is a function it must be the controller's constructor function
                if ($$.isFunction(config.controller)) {
                    // Create the controller passing the route config and import object
                    routeController = new config.controller(config, routeObject.controllerImports);
                    routeObject.controller = routeController;
                    controllerCreated(routeController);
                } else {
                    throw 'The specified controller file ' + config.controller + ' must return the controller\'s constructor';
                }
            }
        }

        // Add route in crossroad.
        // The actual routing in quark is performed by crossroads.js.
        // Foreach location defined, quark creates a crossroad router and adds all defined routes to it.
        var csRoute = routers[locationName].csRouter.addRoute(config.hash, function(requestParams) {
            // Set the value for all the parameters defined in the route
            for (var index in config.params) {
                config.params[index](requestParams[index]);
            }

            // If theres a controller created for the route use it if not initialize one and assign it to the route
            if (routeObject.controller) {
                changeCurrent(routeObject.controller);
            } else {
                // If theres a controller defined in this route's configuration
                if ($$.isDefined(config.controller)) {
                    // Creates the controller and invoke the callback when ready
                    createController(function(routeController) {
                        // Initialize the new controller and change the actual route
                        initController(routeController);
                        changeCurrent(routeController);
                    });
                } else {
                    // If there isn't a configured controller change the route
                    // without a controller
                    changeCurrent();
                }
            }
        });

        // Read the route configuration and store in the route object the parameters used by this route
        for (var index in csRoute._paramsIds) {
            config.params[csRoute._paramsIds[index]] = ko.observable();
        }

        // Interpolate the hash using configured routes hash and the specified values for the route variables
        routeObject.interpolate = function(values) {
            return csRoute.interpolate(values);
        }
    }

    // Get the route with the specified name (in the form locationName/routeName)
    function getRoute(name) {
        // Extract location and routeName
        var location = name.substr(0, name.indexOf('/'));
        var routeName = name.substr(name.indexOf('/') + 1);

        // Validate parameter
        if (!routeName) {
            throw new 'You must specifiy route name in the form location/routeName.';
        }

        // If there isn't a location with the specified name warn on console
        if (!self.configuration[location]) {
            console.warn('The location specified as ' + name + ' was not found in the routing configuration.');
        } else {
            // if there isn't a route in the location with the specified name warn on console
            if (!self.configuration[location]['routes'][routeName]) {
                console.warn('The route name specified as ' + name + ' was not found in the routing configuration for the ' + location + ' location.');
            }
        }

        // If the specified location and route exists return it
        if (routers[location] && routers[location]['routes'][routeName]) {
            return routers[location]['routes'][routeName];
        }
    }

    // Configure routing system using the specified routing config
    this.configure = function(routingConfig) {
        // For each location to be configured
        for (var locationName in routingConfig) {
            // Get this location and the specified config
            var location = routingConfig[locationName];

            // Location's configuration
            var dest;

            // If there's a previouly configurated location with the same name get it, if not create a new one
            if (!self.configuration[locationName]) {
                dest = self.configuration[locationName] = {};
            } else {
                dest = self.configuration[locationName];
            }

            // If there's a location config specified
            if (location.config) {
                // If the location hasn't got a previous configuration,
                // initialize one
                if (!dest.config) {
                    dest.config = {};
                }

                // Merge the new configuration into the existing
                $.extend(dest.config, location.config);
            }

            // If there isn't a router configuration for this location init one
            if (!routers[locationName]) {
                routers[locationName] = {};
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // Initialize component configuration object
                var components = {};

                // If there's a new default route defined in this location replace it (to have precedence over older one)
                if ($$.isDefined(location.defaults)) {
                    $.extend(components, location.defaults);
                }

                // Gets the route configuration
                var routeConfig = location.routes[routeName];

                // Replace this route configuration to have precedence over all previous configuration
                $.extend(components, routeConfig.components);

                // If the current location doesn't have the routes property create it
                if (!dest.routes) {
                    dest.routes = {};
                }

                // Add the route to the routes configuration
                dest.routes[routeName] = {
                    locationName: locationName,
                    routeName: routeName,
                    hash: routeConfig.hash,
                    fullName: locationName + '/' + routeName,
                    controller: routeConfig.controller,
                    components: components,
                    params: {}
                };

                // If there isn't a previously configured router in the location configuration create a new one
                if (!routers[locationName].csRouter) {
                    // Create a new crossroads router
                    routers[locationName].csRouter = crossroads.create();

                    routers[locationName].csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
                    routers[locationName].csRouter.ignoreState = true;
                }

                // If not previously created, init the router object to store all routes configuration
                if (!routers[locationName].routes) {
                    routers[locationName].routes = {};
                }

                // Creates the new route
                var newRoute = new Route(locationName, routeName, dest.routes[routeName]);

                // Save it on the location's routes
                routers[locationName].routes[routeName] = newRoute;
            }
        }
    }

    // Parses the specified route and location changing the current route
    this.parse = function(hash) {
        var found = false;

        // Iterate over location finders
        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            // Call the finder to get the actual location, if found call the crossroad parser passing the hash
            finder(function(locationName) {
                found = true;
                routers[locationName].csRouter.parse(hash);
            });

            // If location is found stop iterating
            if (found) return;
        }
    }

    // Returns a hash for the specified route and configuration.
    // Routes can have variables, you can define a value for this variables using the config parameter
    this.hash = function(name, config) {
        // Get the route with the specified name
        var route = getRoute(name);

        // If theres a  route with the specified name use the crossroad router to interpolate the hash
        if (route) {
            return route.interpolate(config);
        }
    }

    this.link = function(name, config) {
        var route = getRoute(name);

        if (route) {
            for (var index in self.urlGenerators) {
                var url = self.urlGenerators[index](route, config);
                if (url) {
                    return url;
                }
            }
        }
    }

    // Activates the quark routing system.
    // Allows to define a callback that is called each time the current hash is changed.
    // The callback accepts the new hash, and the old hash as parameters
    this.activateHasher = function(callback) {
        function parseHash(newHash, oldHash) {
            if ($$.isDefined(callback)) {
                callback(newHash, oldHash);
            } else {
                self.parse(newHash);
            }
        }

        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }

    // Create a route signal that is fired each time a route finishes loading
    this.routed = new signals.Signal();

    // Create a lock that opens when the routing system loads the first route.
    // This is useful to start the quark application once the first routing is finished, most likely to be used
    // when a custom route function is used.
    this.firstRouting = $$.lock();
}

// Create the quark router
$$.routing = new QuarkRouter();

// Initialize the current controller object
$$.controller = {};

// This computed sets the current controller in the $$.controller variable.
var controllerUpdater = ko.computed(function() {
    // Get the current route
    var current = $$.routing.current();

    // If the current route is defined and has a controller, set it on the $$.controller variable
    if (current) {
        if (current.controller) {
            $$.controller = current.controller;
        } else {
            $$.controller = {};
        }
    }
});

// A location finder is a function used by the quark routing system to resolve the location.
// The function receives a callback and if it understands the current location it invoke the callback
// passing the route configuration extracted from self.configuration.
// This is the default location finder, it search the location config for the path thah matches the
// window.location.pathname
// The location finders defined are called in order until one understands the location and invoke the callback.
$$.routing.locationFinders.push(function(callback) {
    // Get the windolw location pathname
    var path = window.location.pathname;

    // Iterate over the defined locations trying to find one that has a regular expression wich matches the
    // path
    for (var locationName in $$.routing.configuration) {
        // Get the location data
        var location = $$.routing.configuration[locationName];

        // If there's a match invoke the callback with the matching location
        if (path.toUpperCase() == location.config.path.toUpperCase()) {
            callback(locationName);
        }
    }
});

// A url generator is a function used by the quark routing system to create a link given a route name.
// The function receives the route and config and tries to create a link with the given route, if its able it returns
// The generated url
$$.routing.urlGenerators.push(function(route, config) {
    var location = $$.routing.configuration[route.locationName];

    if (location && location.config && location.config.path) {
        return location.config.path + "#" + route.interpolate(config);
    }
});

ko.bindingHandlers.namespace = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        // Get the namespace value
        var value = valueAccessor();

        // Get the namespace alias
        var alias = allBindings.get('alias') || 400;

        // Validate data
        if (!$$.isString(value)) {
            throw 'Must specify namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'';
        }

        // If namespace alias is not defined throw error
        if (!$$.isString(alias)) {
            throw 'Must specify alias to namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'';
        }

        // Transform values to lowercase
        var namespace = value.toLowerCase();
        alias = alias.toLowerCase();

        // If theres a context defined
        if (context) {
            // Check if theres a namespaces object defined in the context
            if (!context.namespaces) {
                context.namespaces = {};
            }

            // Add the alias to the list
            context.namespaces[alias] = namespace;
        }
    }
}
ko.virtualElements.allowedBindings.namespace = true;

// Node Preproccesors, allows the use of custom tags
ko.bindingProvider.instance.preprocessNode = function(node) {
    // Only react if this is a comment node of the form <!-- quark-component -->
    if (node.nodeType == 8) {

        // Allows component definition open with <!-- quark-component -->
        var match = node.nodeValue.match(/^\s*(quark-component[\s\S]+)/);
        if (match) {
            node.data = " ko component: { name: \'quark-component\' } ";
            return node;
        }

        // Allows component definition close with <!-- /quark-component -->
        var match = node.nodeValue.match(/^\s*(\/quark-component[\s\S]+)/);
        if (match) {
            node.data = " /ko ";

            return node;
        }
    }

    if (node && node.nodeName && ko.components.isRegistered(node.nodeName.toLowerCase())) {
        if (node.attributes['virtual']) {
            var params = node.attributes['params'];
            var bind = node.attributes['data-bind'];
            var modelBind = node.attributes['model-bind'];

            var comment = " ko component: { name: '" + node.nodeName.toLowerCase() + "' ";

            if (params) {
                comment += ", params: { " + params.value + " } ";
            }

            comment += " } ";

            if (bind) {
                comment += ", " + bind.value + " ";
            }

            if (modelBind) {
                comment += ", model-bind: \"" + modelBind.value + "\"";
            }

            var openTag = document.createComment(comment);
            var closeTag = document.createComment(" /ko ");

            node.parentNode.insertBefore(closeTag, node.nextSibling);
            node.parentNode.replaceChild(openTag, node);

            while (node.childNodes.length > 0) {
                openTag.parentNode.insertBefore(node.childNodes[0], closeTag);
            }

            return [openTag, closeTag];
        }
    }
}

// Custom node processor for custom components.
// It allows to use namespaces
ko.components.getComponentNameForNode = function(node) {
    // Get the tag name and transform it to lower case
    var tagNameLower = node.tagName && node.tagName.toLowerCase();

    // If the tag has a component registered as is use the component directly
    if (ko.components.isRegistered(tagNameLower)) {
        // If the element's name exactly matches a preregistered
        // component, use that component
        return tagNameLower;
    } else {
        // If the tag name contains a colon indicating that is using an alias notation
        if (tagNameLower.indexOf(':') !== -1) {
            // Get the tag parts
            var parts = tagNameLower.split(':');

            // Extract the alias and the tag name
            var alias = parts[0];
            var tag = parts[1];

            // Get the context for the node
            var context = ko.contextFor(node);

            // If there's namespaces alias defined in the context and...
            if (context && $$.isObject(context.namespaces)) {
                // If there's a matching alias on the context's list
                if (context.namespaces[alias]) {
                    // Get the namespace and form the component's full name
                    var namespace = context.namespaces[alias];
                    var fullName = namespace + '-' + tag;

                    // If component with the full name is registered then return it
                    if (ko.components.isRegistered(fullName)) {
                        return fullName;
                    }
                }
            }
        }

        // Treat anything else as not representing a component
        return null;
    }
}

// Initialize validators array
// This an object containing a property for each validator that quark supports.
// Each validator is an object receiving the observable to validate and the validation config (for example min and max allowed values)
// Then the validator must define a validate method that returns true if the validation passes
// You can attach a validator to an observable by using the validation method of the observable (Extension method added by Quark).
ko.validators = {};

// Validate the observables in the specified object.
// If subscribe is true, it adds a subscription so it revalidates each field on change.
// Returns true if the object is valid or false if it has some error
ko.validate = function(object, subscribe) {
    // Initializes validation in true
    var result = true;

    // Iterate all properties in the object
    for (var propertyName in object) {
        var property = object[propertyName];

        // If the property is observable and has a validator attached, validate
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Validates the property indicating if it must subscribe the validation
                if (!property.validate(subscribe)) {
                    result = false;
                }
            }
        }
    }

    // Returns the result
    return result;
}

// Unsubscribe validation from the object.
ko.unsubscribeValidation = function(object) {
    // Iterate each property
    for (var propertyName in object) {
        var property = object[propertyName];

        // If the property is an observable and has a validator attached..
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // If it has a subscription dispose and delete it
                if (property.validationSubscription) {
                    property.validationSubscription.dispose();
                    delete property.validationSubscription;
                }
            }
        }
    }
}

// Resets errors on all the observables of the object
ko.validationReset = function(object) {
    for (var propertyName in object) {
        var property = object[propertyName];

        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Resetea los errores de validacion del observable
                property.validationReset();
            }
        }
    }
}

// Adds the validation function to the observables. Calling this function will activate validation on the observable.
// Name is the field name to show on error messages. Validation config is an object with the configuration of validations to enfoce,
// if theres an error handler specified every validation error is added to the handler
ko.observable.fn.validation = function(name, validationConfig, componentErrors) {
    // Indicates that the field is validatable and the name of the field on the error messages
    this.validatable = name;

    // Loads the validation configuration
    this.validationConfig = validationConfig;

    // Extends the observable with properties that indicates if the observable has an error, and the error message
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // If an error handler has been specified
    if (componentErrors) {
        this.componentErrors = componentErrors;
    }

    // Returns the observable allowing to chain validate calls on the same
    return this;
}

// Resets validation errors on the observable and clears itself from the objects componentErrors
ko.observable.fn.validationReset = function () {
    var me = this;

    // If there is a validator attached
    if (this['validatable']) {
        // Clears error flag and message
        this.hasError(false);
        this.validationMessage('');

        // If an error handler is defined use stored error key and resolve it (clearing it from the list)
        if (this.componentErrors && this.errorKey) {
            this.componentErrors.resolve(this.errorKey);
        }
    }
}

// Performs the actual validation on the observable. Its on a separate function to allow subscription
function validateValue(newValue, target) {
    // If a target is not defined assume its the observable
    if (!target) {
        target = this;
    }

    // Resets observable validations
    target.validationReset();

    // Iterate over the validation configs in the observable
    for (var name in target.validationConfig) {
        var config = target.validationConfig[name];

        // If there a validator in the ko.validators array
        if (ko.validators[name]) {
            // Get the validator passing the target observable and the validation config
            var validator = ko.validators[name](target, config);

            // Perform the actual validation of the new value
            if (!validator.validate(newValue)) {
                // If there's an error handler defined add the validation error and store the error key.
                if (target.componentErrors) {
                    target.errorKey = target.componentErrors.add(target.validationMessage(), { level: 100, type: 'validation' });
                }

                // Return false if validation fails
                return false;
            }
        }
    }

    // If validation passes return true
    return true;
};

// Validates the observable using the defined rules. Subscribe indicates if the validators must subscribe to the observable
// to reevaluate on change.
ko.observable.fn.validate = function (subscribe) {
    // If it must subscribe and there is no previous subscrption, subscribe
    if (subscribe && !this['validationSubscription']) {
        this.validationSubscription = this.subscribe(validateValue, this);
    }

    // Validate value and return the result
    return validateValue(this(), this);
}

// Sets the form group error class if the specified observable or array of observables has error.
function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
    // Get the binding value
    var value = valueAccessor();
    // Init error status
    var hasError = false;

    // If binding value is an array
    if ($$.isArray(value)) {
        // Iterate over each item and check if it has an error
        for (var i = 0; i < value.length; i++) {
            // If one of the observables has an error mark error status and break
            if (!value[i].hasError()) {
                hasError = true;
                break;
            }
        }
    } else {
        // If binding value is only one element check if it has an error
        hasError = value.hasError();
    }

    // If we are in an error state add the has error class to the element, if not remove it
    if (hasError) {
        $(element).addClass('has-error');
    } else {
        $(element).removeClass('has-error');
    }
}

// Sets the error class to the form group if the specified observable or one of the observable in the array has
// a validation error.
ko.bindingHandlers.formGroupError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
    }
};

// This binding used in an element makes the element to show only if the specified observable has an error
// and fill the element text with the observable's error message
ko.bindingHandlers.fieldError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        // Create an accessor for the text binding with the validation message of the specified observable
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        // Use the text binding
        ko.bindingHandlers.text.init(element, textAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        // Create a visible accessor checking if the observable has an error
        var visibleAccessor = function() {
            return valueAccessor().hasError;
        }

        // Create an accessor for the text binding with the validation message of the specified observable
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        // Use the text and visible binding
        ko.bindingHandlers.visible.update(element, visibleAccessor, allBindings, viewModel, context);
        ko.bindingHandlers.text.update(element, textAccessor, allBindings, viewModel, context);
    }
}


if (typeof define === 'function' && define.amd) {
    define('knockout', function() {
        return ko;
    });      
}

// Register in the values from the outer closure for common dependencies
// as local almond modules
return $$;
}));

