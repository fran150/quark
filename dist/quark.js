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
$$.clientErrorHandlers = {};
// Server error handlers repository
$$.serverErrorHandlers = {};
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
                return { href: '#' + $$.routing.hash(value) }
            } else if ($$.isObject(value)) {
                var url;

                if (value.page) {
                    url = value.page;
                }

                if (value.routeName) {
                    url += "#" + $$.routing.hash(value.routeName, value.routeConfig);
                }

                return { href: url }
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
        signal.dispatch();
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
            signal.add(function() {
                // When unlocked call the function and remove the listener from the signal
                dispatched = true;
                callback();
                // TODO: This might not work, the remove must be with "this" or something alike
                signal.remove(callback);
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
    async: true,
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
                handled = clbks.onError();
            }

            // If nobody has handled the error try to use a generic handler
            if (!handled) {
                // If it's a server error
                if (jqXHR.status >= 500 && jqXHR.status < 600) {
                    // Call all handlers in registration order until someone handles it (must return true)
                    for (var handlerName in $$.serverErrorHandlers) {
                        if ($$.serverErrorHandlers[handlerName](url, opts.source, jqXHR.responseText)) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                } else {
                    // If it's a client error
                    for (handlerName in $$.clientErrorHandlers) {
                        // Call all handlers in registration order until someone handles it (must return true)
                        if ($$.clientErrorHandlers[handlerName](url, opts.source, jqXHR, textStatus, errorThrown)) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
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
// The module must be define like a quark component inside a require.js module. As dependency of this module you must define 'module'
// in wich require.js will inject the module info.
// Then you must pass this value as the first parameter to this function, this allows the quark module learn info about the associated
// require.js module in wich is defined.
// The config parameters allows to define, the components that includes your module, extra configuration for require to define your
// module's dependencies and css files that your module uses.
// The mainConstructor parameter is optional, but allow to define a class that will be called when the module is instantiated.
// This class will be called instantiated passing as parameter the name defined in require.js for this module.
// In this class you can define extra routes, modules variables, etc.
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
        viewModel = undefined;
    }

    // Viewmodel constructor function
    function Model(p) {
        // Component's model
        var model;
        var self = model;
        // Creates empty scope
        var $scope = {
        };

        // Get the error handler from the parameters, if not found try the controller, finally if not found init one
        var errorHandler;
        if (p.errorHandler) {
            errorHandler = p.errorHandler;
        } else if ($$.controller && $$.controller.errorHandler) {
            errorHandler = $$.controller.errorHandler;
        } else {
            errorHandler = new ComponentErrors();
        }

        // Valid Error Handler
        var $errorHandler = errorHandler;

        // If theres a model defined
        if (viewModel && !model) {
            // Creates the model passing the received parameters an empty scope and the error handler
            model = new viewModel(p, $scope, $errorHandler);

            // Adds the created model to the scope.
            $scope.model = model;
            // Adds the defined error handler to the scope
            $scope.errorHandler = $errorHandler;
            // Adds a reference to the controller to the scope
            $scope.controller = $$.controller;
        }

        // Creates model, scope and error handlers getters.
        // This are used by quark to access each element.
        this.getModel = function() { return model; }
        this.getScope = function() { return $scope; }
        this.getErrorHandler = function() { return $errorHandler; }

        // When the component is disposed Knockout calls this method.
        // We use it to dispose all objects.
        this.dispose = function() {
            // If theres a model defined and has a dispose method call it
            if (model && model.dispose) {
                model.dispose();
            }

            // If theres an scope defined and has a dispose method call it
            if ($scope && $scope.dispose) {
                $scope.dispose();
            }

            // Undefine all internal variables.
            model = undefined;
            $scope = undefined;
            $errors = undefined;
        }
    }

    // Return the module definition and viewmodel as needed by knockout.
    if (viewModel) {
        return { template: view, viewModel: Model }
    } else {
        return { template: view }
    }
}

// Register the component making it available to use with a custom tag.
// You must specify the component's custom tag and the url to the definition.
$$.registerComponent = function(tag, url) {
    ko.components.register(tag, { require: url });
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
                    // If target parameter is a computed do not overwrite it, the computed function MUST use the parameter
                    // directly (see ko.computedParameter)
                    if (!ko.isComputed(object[name])) {
                        object[name] = values[name];
                    }
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

// Similar to $$.parameters this methods allows the component to receive parameters but it transforms the value using a computed
// observable.
// Use it when your component must affect the received parameter before it reads or writes to it. For example if you want to format
// the received parameter when reading or writing to it.
// The main difference with the $$.parameter function is that the parameters specified in the params object must contain two methods
// the read that receive the param and returns it formatted, and a write method that receives the newValue, formats it and return it
$$.computedParameters = function (params, values, objects) {
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

    for (var name in params) {
        // Iterate the target objects
        for (var i = 0; i < objects.length; i++) {
            // Get the target object
            var object = objects[i];
            var value;

            // Warn if config exists
            if ($$.isDefined(object[name])) {
                console.warn('There is already a property named ' + name + ' in the target component. It will be replaced with the specified parameter.');
            }

            // If the received value for the param is not an observable create one with the value.
            if (!ko.isObservable(values[name])) {
                value = ko.observable(values[name]);
            } else {
                value = values[name];
            }

            // Create a computed observable wich in turn calls the defined accessors for the parameter
            function getComputed(field, value) {
                return ko.computed({
                    read: function () {
                        // If read accessor is defined return the modified value, if not return the value as is
                        if (field['read']) {
                            return field.read(value);
                        } else {
                            return value();
                        }
                    },
                    write: function (newValue) {
                        // If the write accessor is defined get the modified value and write it to the param, if the accessor
                        // is not defined write the parameter as is
                        if (field['write']) {
                            var modifiedValue = field.write(newValue);
                            value(modifiedValue);
                        } else {
                            value(newValue);
                        }
                    }
                }, object);
            }

            // Create an object property with the parameter
            object[name] = getComputed(params[name], value);
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
function applyBehaviour(object, behaviourName) {
    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
    }

    // Chek if behaviour exists
    if (behaviours[behaviourName]) {
        // Apply new behaviour by calling the behaviour definition function
        behaviours[behaviourName](object);

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
$$.behave = function(object, behaviour) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    if ($$.isArray(behaviour)) {
        // If it's an array we iterate it applying each behaviour
        for (var i = 0; i < behaviour.length; i++) {
            applyBehaviour(object, behaviour[i]);
        }
    } else if ($$.isString(behaviour)) {
        // If it's a string apply the named behaviour
        applyBehaviour(object, behaviour);
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

// Modules List
$$.modules = ko.associativeObservable({});

// Registers the quark component
ko.components.register('quark-component', {
    template: "<!-- ko componentShadyDom --><!-- /ko --><!-- ko modelExporter --><!-- /ko -->"
});

// Returns an empty component template (useful when creating data components)
$$.emptyTemplate = function(virtual) {
    if (!virtual) {
        return '<quark-component></quark-component>';
    } else {
        return '<!-- quark-component --><!-- /quark-component -->'
    }
}

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

        // Allows component use with <!-- $$ 'componentName', params: { paramsArray } -->
        var match = node.nodeValue.match(/^\s*\$\$[\s\S]+}/);
        if (match) {
            node.data = node.data.replace(match, " ko component: { name:" + match.toString().replace("$$", "").trim() + " }");

            var closeTag = document.createComment("/ko");
            node.parentNode.insertBefore(closeTag, node.nextSibling);

            return [node, closeTag];
        }
    }
}

// Marks the object as ready and inform its parent (if is tracking dependencies)
function markReadyAndInformParent(object) {
    // If there´s a ready callback on the object invoke it.
    if ($$.isFunction(object['ready'])) {
        object['ready']();
    }

    // Finally, if the object is tracked and has a parent, mark itself as ready on the parent
    // and call the function on the parent to reevaluate readiness.
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.tracking) && $$.isDefined(object.$support.tracking.parent)) {
        // Mark the object ready on the parent
        object.$support.tracking.parentState['ready'] = true;

        // Calls the readied function on the parent (if its defined)
        if ($$.isDefined(object.$support.tracking.parent['readied'])) {
            object.$support.tracking.parent.readied(propertyName, vm);
        }

        // Inform to the tracking system on the parent that a child is ready
        object.$support.tracking.parent.$support.tracking.childReady();
    }
}

function checkObjectReady(object) {
    // If any dependency is not loaded or ready then exit
    // !! OPTIMIZE !! by using a counter and not iterating all array over and over
    for (var property in object.$support.tracking.childs) {
        if (!object.$support.tracking.childs[property]['loaded'] || !object.$support.tracking.childs[property]['ready']) {
            return false;
        }
    }

    return true;
}

// This binding allows to import the viewmodel of a component into the parent creating a property with the specified name.
// This binding is executed at the target object context in the custom tag of the component to import. The component to import
// is not loaded when this binds, so it creates an array to track whem each dependency loads. When the dependency loads,
// it creates a property with the specified name in the parent and sets the child's viewmodel in it.
// This binding only prepares the parent object to track dependencies, each dependency inform that it has loaded in the export
// binding.
// We call a component "loaded" when is binded and his model loaded, but his dependencies may not be loaded yet.
// We call a component to be "ready" when is loaded and all it's dependencies are loaded and ready.
// When each dependendy loads calls the "loaded" function passing the dependency name (specified in it's import binding)
// and the loaded model.
// When each dependendy is ready calls the "readied" function passing the dependency name (specified in it's import binding)
// and the loaded model.
// When all dependencies are loaded calls the ready method on the object (if its defined)
ko.bindingHandlers.import = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
        // Gets the name of the property in wich to import the viewmodel
        var name = valueAccessor();

        var object;

        // If the target object has a model (is a quark-component's scope) set the target object to the model,
        // if not the target is the object itself.
        if (viewModel && viewModel.model) {
            object = viewModel.model;
        } else {
            object = viewModel;
        }

        // If the specified binding is not an string throw an error (to avoid a common mistake)
        if (!$$.isString(name)) {
            throw 'The import value must be an string with the name of the property to create on the parent object';
        }

        // If the target object doesn´t have a $support property initialize it
        if (!$$.isObject(object.$support)) {
            object.$support = {};
        }

        // Sets the childs array wich tracks the dependencies and state of each viewModel to import
        if (!$$.isObject(object.$support.tracking)) {
            object.$support.tracking = {
                childs: {}
            }
        }

        // Start tracking the dependency with the specified name.
        object.$support.tracking.childs[name] = {};

        // The child components uses this function to notify that it finished loading.
        // PropertyName contains the child name, and vm the corresponding viewmodel.
        object.$support.tracking.childs[name]['load'] = function(propertyName, vm) {
            // Sets the child viemodel and marks it as loaded
            object[propertyName] = vm;
            object.$support.tracking.childs[propertyName]['loaded'] = true;

            // If theres a loaded method on the object call it passing the dependency name and model
            if ($$.isDefined(object['loaded'])) {
                object.loaded(propertyName, vm);
            }

            // If the child is tracking dependencies itself...
            if ($$.isDefined(vm.$support) && $$.isDefined(vm.$support.tracking)) {
                // If the child has dependencies mark the dependency as not ready and save
                // the parent data (reference and state)
                object.$support.tracking.childs[propertyName]['ready'] = false;

                vm.$support.tracking.parent = object;
                vm.$support.tracking.parentState = object.$support.tracking.childs[propertyName];
            } else {
                // If the child hasn't dependencies mark the dependency on parent as ready
                object.$support.tracking.childs[propertyName]['ready'] = true;

                // If theres a readied function on the object call it passing the dependency name and model
                if ($$.isDefined(object['readied'])) {
                    object.readied(propertyName, vm);
                }

                // If there's a ready function on the child invoke it
                if ($$.isDefined(vm['ready'])) {
                    vm['ready']();
                }
            }

            // If the object is ready, mark it and inform its parent
            if (checkObjectReady(object)) {
                markReadyAndInformParent(object);
            }
        }

        // Initialize the tracking flag of the child component loaded state
        object.$support.tracking.childs[name]['loaded'] = false;

        // Defines a function to call when one of this object childs is ready.
        // It forces the object to reevaluate this object readiness
        object.$support.tracking.childReady = function() {
            // If the object is ready, mark it and inform its parent
            if (checkObjectReady(object)) {
                markReadyAndInformParent(object);
            }
        }

        // Import the dependency to the target object
        object[name] = {};

        // The qk- tags define bindings that must be executed when the component is loaded, this
        // bindings are executed in the "modelExporter" passing the child model in the $child property of the context.
        //
        // Depending if its a virtual o normal tag use one or other notation to mark the child
        // element to indicate that it has to be exported to the parent using the export binding.
        if (element.nodeType != 8) {
            element.setAttribute('qk-export', "\'" + name + "\'");
        } else {
            element.data += " qk-export=\'" + name + "\'";
        }
    }
}
ko.virtualElements.allowedBindings.import = true;

// Exports the component viewmodel to the parent object
// This binding is used with the qk- attributes. You can define bindings that executes when the components is used as attributes
// in the components tag. For example <some-component qk-export="'test'"> calls the binding "export" when the component is loaded
// passing the 'test' string as value. The bindings defined in this way executes in the modelExporter wich binds in a custom context
// that has the child model on the $child property.
// This binding is the other leg of the import binding, the "import" begins to track the dependencies and sets a qk-export attribute
// on the object's element. This is a binding that executes when the child component is loaded and marks the component as loaded
// on the parent using the functions created by the import binding.
ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // If the binding model has a model (is a quark-component's scope), the binding will be against the model.
        if (viewModel && viewModel.model) {
            viewModel = viewModel.model;
        }

        var property;

        // If the binding value is a string then is the name of a property in the viewmodel,
        // if not, must be an object indicating the target viewModel and the property in wich to set the dependency model
        if (!$$.isString(value)) {
            if ($$.isObject(value)) {
                if ($$.isString(value['property'])) {
                    property = value['property'];
                }

                if ($$.isDefined(value['model'])) {
                    viewModel = value['model'];
                }
            }
        } else {
            property = value;
        }

        // Validates objects and calls the load function on the parent (marking this component as loaded on the parent)
        if ($$.isString(property)) {
            if ($$.isDefined(viewModel.$support) && $$.isDefined(viewModel.$support.tracking)) {
                if ($$.isDefined(viewModel.$support.tracking['childs'])) {
                    if ($$.isDefined(viewModel.$support.tracking.childs[property])) {
                        viewModel.$support.tracking.childs[property]['load'](property, context.$child);
                    } else {
                        throw 'The specified object doesn´t have a property named ' + value + '. Verify that the object has a property defined with the .components method with the name defined in the vm binding.';
                    }
                } else {
                    throw 'The specified object doesn´t have the tracking property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
                }
            } else {
                throw 'The specified object doesn´t have the tracking.childs property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
            }
        } else {
            throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
        }
    }
}
ko.virtualElements.allowedBindings.export = true;

// Creates the componentShadyDom accessor passing the component template nodes as the nodes array to the template binding
function createComponentShadyDomAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

// This binding is used inside quark component object. It binds the quark-component tag content against the
// defined $scope object, effectively separating $scope from model.
ko.bindingHandlers.componentShadyDom = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createComponentShadyDomAccesor(context);
        context.$parentContext.$data = context.$parent.getScope();
        context.$parentContext.$rawData = context.$parent.getScope();
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent.getScope(), context.$parentContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createComponentShadyDomAccesor(context);
        context.$parentContext.$data = context.$parent.getScope();
        context.$parentContext.$rawData = context.$parent.getScope();
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent.getScope(), context.$parentContext);
    }
};
ko.virtualElements.allowedBindings.componentShadyDom = true;

// Returns if the specified element is child of the "search" element, taking into account even virtual elements.
function isChildOf(element, search) {
    // Get the element childs
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

    // It iterates over previous siblings of the given element trying to find one wich
    // has this element as a child, if found, this is the parent element.
    while (previous != null) {
        if (isChildOf(previous, element)) {
            return previous;
        }

        previous = previous.previousSibling;
    }

    // If there are no previous siblings, the parent is effectively the real parent tag of the element (non virtual)
    if (previous == null) {
        return element.parentElement;
    }
}

// The model exporter accesor searchs the tag wich defines the component to find the qk- attributes,
// and for each attribute find create a binding in it's template wich binds to a custom context with has the child model on
// the $child property.
// As the export binding executes in here it doesn't export the scope of the object
function createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var newAccesor = function() {
        var nodes = Array();

        // Find the elements defining tag. It's the grandparent because it's parents is the quark-object tag.
        var parent = findParent(element);
        parent = findParent(parent);

        // Given the type of tag we search the qk attributes in different ways.
        if (parent.nodeType == 8) {
            // If node is virtual find the qk-yourBindingHere="yourBindingContentHere" values
            var matches = parent.nodeValue.match(/qk-[\w]+[\s]*=[\s]*[\'\"][\s\S]+?[\'\"]/g);

            // For each match create the binding tag in the modelExporter template
            if (matches) {
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];

                    var parts = match.split('=');

                    var name = parts[0].toString().trim().replace('qk-', '');
                    var value = parts[1].toString().trim();

                    nodes.push(document.createComment("ko " + name + ": " + value));
                    nodes.push(document.createComment("/ko"));
                }
            }
        } else {
            // Find the qk attributes along the elements attributes, for each found create the binding tag in
            // the modelExporter template
            if (parent.attributes) {
                for (var i = 0; i < parent.attributes.length; i++) {
                    var attrib = parent.attributes[i];
                    if (attrib.specified) {
                        if (attrib.name.indexOf('qk-') === 0) {
                            nodes.push(document.createComment("ko " + attrib.name.replace('qk-', '') + ": " + attrib.value));
                            nodes.push(document.createComment("/ko"));
                        }
                    }
                }
            }
        }

        // Add the bindings to the template
        return { nodes: nodes, if: nodes.length > 0 };
    };

    return newAccesor;
}

// The model exporter searchs for qk attributes defined in the components custom tag, then it creates a binding with each
// attribute found, this produces that each binding be executed when the component loads, also this binding creates a custom
// context wich is at the level of the component parent, and has a property $child with the childs model and a $childContext
// with the child context.
// This $child property is used by the export binding to extract the childs model and send it to the parent.
ko.bindingHandlers.modelExporter = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent.getModel(), $childContext: context });
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent.getModel(), $childContext: context });
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.modelExporter = true;

// The content accesor returns the object needed by the template binding with the array of DOM nodes of the component content to whos.
// If the value is an integer it returns the slice of that number, if the value is not defined it returns all of the component
// content, finally if the value is defined is assumed to be a jquery selector wich selects the part of the DOM to show.
function createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    // Gets the value
    var value = ko.unwrap(valueAccessor());

    // New Accesor
    var newAccesor = function () {
        if (!$$.isInt(value)) {
            if ($$.isDefined(value)) {
                return { nodes: $(context.$componentTemplateNodes).filter(value) };
            } else {
                return { nodes: context.$componentTemplateNodes };
            }
        } else {
            return { nodes: context.$componentTemplateNodes.slice(value) };
        }
    };

    // Returns the new accesor
    return newAccesor;
}

// This binding is used in the template of a component to allow to show the custom markup passed to the component as content.
// It allows to define where in your component template the content defined in the component must be displayed.
// You can specify a jquery selector indicating wich part of the component content to show. For example:
// <quark-component><h1><div data-bind="content: .header></div></h1><p><div data-bind="content: .body></div></p></quark-comopnent>
// The component content defined inside a class header show inside de h1 tag and the content defined inside the class body shows in
// the paragraph.
ko.bindingHandlers.content = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel.model, $childContext: context });
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel.model, $childContext: context });
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.content = true;

// Creates an accesor for the if binding indicating if inside the components content there are elements that matches
// the specified jquery selector
function createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        return $(context.$componentTemplateNodes).filter(value).length > 0;
    };

    return newAccesor;
}

// This binding is similar to the if value, it shows and bind its content only if in the components content
// there are elements that matches the specified jquery selector
ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);

        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

// The inverse of the hasContent binding.
ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);

        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;

// Accesor for the "component" binding that returns the data defined with the specified name in the current route
function createPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    // Page name on the route
    var name = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        // Gets the current route
        var current = $$.routing.current();

        var component;
        var params;

        // Create the accesor getting the component defined in the current route with the page name.
        // If the route specify an array we assume that is component name and parameters.
        // If not, is the name of the component and as parameters pass the current route.
        if ($$.isArray(current.route.components[name])) {
            component = current.route.components[name][0];
            eval("params = {" + current.route.components[name][1] + "}");
        } else {
            component = current.route.components[name];
            params = current;
        }

        // Return the accesor for the component binding
        return {
            name: ko.pureComputed(function() {
                return component;
            }),
            params: params
        }
    };

    return newAccesor;
}

// This binding works in conjunction with the routing system. In the routes you can define the components that must be shown
// for an specific route in wich "page".
// This binding search in the current route for a component defined with the specified name in the route and shows it.
// For example: if in the route are defined this components { title: 'title-component', body: 'text-component' } and in the
// page we specify <div data-bind="page: 'body'"></div> will show the "title-component" inside the DIV.
ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccessor = createPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);

        var current = $$.routing.current();
        if ($$.isObject(current.controller)) {
            context = context.createChildContext(current.controller);
        }

        return ko.bindingHandlers.component.init(element, newAccessor, allBindingsAccessor, viewModel, context);
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

    // A location finder is a function used by the quark routing system to resolve the location.
    // The function receives a callback and if it understands the current location it invoke the callback
    // passing the route configuration extracted from self.configuration.
    // This is the default location finder, it matches allows to specify a regular expression in the location
    // that must match the window.location.pathname
    // The location finders defined are called in order until one understands the location and invoke the callback.
    this.locationFinders.push(function(callback) {
        // Get the windolw location pathname
        var path = window.location.pathname;

        // Iterate over the defined locations trying to find one that has a regular expression wich matches the
        // path
        for (var locationName in self.configuration) {
            // Get the location data
            var location = self.configuration[locationName];

            // Create a regular expression object with the location configuration string
            var exp = RegExp(location.config);

            // If there's a match invoke the callback with the matching location
            if (path.match(exp)) {
                callback(location);
            }
        }
    });

    // Object passed to the configure method that allows to chain routes definition with calls to the .on method and the .when
    // method
    function RoutingConfig() {
        // Self
        var routingConfig = this;

        // Resulting configuration
        routingConfig.configuration = {};

        // Current location's name
        var currentLocationName;

        // Adds a location to the routes.
        this.on = function(name, config) {
            // Check parameter
            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            // Initialize the location configuration on the resulting configuration
            routingConfig.configuration[name] = {
                config: config,
                routes: {}
            };

            // Sets the current location so it can be used by the .when method in chained calls.
            // All subsequent .when calls will apply to this location.
            currentLocationName = name;

            // Returns itself so config methods are chainable.
            return routingConfig;
        }

        // Adds a route to the last location specified with .on. The hash is a pattern to match on the hash, the
        // name parameter is the name of the route, and the components parameter is an object with each property being the
        // name of a placeholder and it's value the component name that must be binded on it (see the page binding).
        this.when = function(hash, name, components, controller) {
            // If only one parameter is specified we assume that its the components parameter
            if (!$$.isDefined(name) && !$$.isDefined(components)) {
                components = hash;
                name = '';
                hash = 'Any';
            } else if (!$$.isDefined(components) || !$$.isDefined(name)) {
                throw 'Must define the hash, name and components parameters'
            }

            // If .on was not called previously
            if (!$$.isDefined(currentLocationName)) {
                throw 'You must define the location to where this route applies using the .on method before calling .when.';
            }

            // Forms full name (location name/route name). Routes full name are the locationName + / + the route name
            var fullName = currentLocationName + '/' + name;

            // Loads the configuration
            routingConfig.configuration[currentLocationName]['routes'][name] = {
                hash: hash,
                components: components,
                fullName: fullName,
                name: name,
                controller: controller
            };

            // Returns itself so config methods are chainable.
            return routingConfig;
        }
    }

    // Specific route configuration, contains all route data and register the route in crossroads.js
    function Route(router, name, fullName, locationConfig, hash, components, controller) {
        var routeObject = this;

        // Add route in crossroad.
        // The actual routing in quark is performed by crossroads.js.
        // Foreach location defined, quark creates a crossroad router and adds all defined routes to it.
        var csRoute = router.addRoute(hash, function(requestParams) {
            // If the current route has a controller defined and the controller has a "leaving" method call it to allow
            // controller cleanup, if controller result is false do not reroute
            if (self.current() && self.current().controller && self.current().controller.leaving) {
                if (self.current().controller.leaving() === false) {
                    return;
                }
            }

            // Changes the current route
            function changeCurrent(routeController) {
                // If theres a route controller defined and it doesn't have an error handler created
                // create one.
                if (routeController && !routeController.errorHandler) {
                    // Create the default controller level error handler
                    routeController.errorHandler = $$.errorHandler();
                }

                // Change the current route
                self.current({
                    route: routeObject,
                    params: requestParams,
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

            // If the controller is a string then assume its a js module name
            if ($$.isString(controller)) {
                // Require the controller file
                require([controller], function(controllerObject) {
                    // If the module returns a constructor create an object, if not use it as is
                    var routeController = $$.isFunction(controllerObject) ? new controllerObject : controllerObject;

                    // Change current route using the loaded controller
                    changeCurrent(routeController);
                });
            } else {
                // If controller is a function, the function must create the controller object and
                // invoke the callback passed as first parameter
                if ($$.isFunction(controller)) {
                    controller(changeCurrent);
                } else {
                    // If the controller is not an string nor function then use it as specified
                    changeCurrent(controller);
                }
            }
        });

        // Name of the route
        this.name = name;
        // Full name of the route (including location)
        this.fullName = fullName;
        // Route hash
        this.hash = hash;
        // Route components for each page bind
        this.components = components;

        // Parse the hash using the current router
        this.parse = function(hash) {
            router.parse(hash);
        }

        // Interpolate the hash using configured routes hash and the specified values for the route variables
        this.interpolate = function(values) {
            return csRoute.interpolate(values);
        }
    }

    // Creates a new routing config, must be used as parameter in $$.routing.configure
    this.routes = function() {
        return new RoutingConfig();
    }

    // Configure routing system using the specified routing config (created by using $$.routing.routes)
    this.configure = function(routingConfig) {
        // For each location configured
        for (var locationName in routingConfig.configuration) {
            // Get this location and the specified config
            var location = routingConfig.configuration[locationName];

            // If there's a previouly configurated location with the same name get it, if not create a new one
            var dest;
            if (!self.configuration[locationName]) {
                dest = self.configuration[locationName] = {};
            } else {
                dest = self.configuration[locationName];
            }

            // If there isn't a previously configured router in the location configuration create a new one
            if (!dest.router) {
                // Create a new crossroads router
                dest.router = crossroads.create();
                dest.router.normalizeFn = crossroads.NORM_AS_OBJECT;
                dest.router.ignoreState = true;
            }

            // Adds the router to the location
            location.router = dest.router;

            // If there isn't a previously configured routes object in the location configuration create a new one
            if (!dest.routes) {
                dest.routes = {};
            }

            // Copy the configured location config to the quark configuration
            if (!dest.config) {
                dest.config = location.config;
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // If the routeName is not the generic one, load the configuration.
                if (routeName !== '') {
                    // Initialize component configuration object
                    var components = {};

                    // If there's a previously default route defined in configuration load the components with it
                    if ($$.isDefined(dest.routes[''])) {
                        $.extend(components, dest.routes[''].components);
                    }

                    // If there's a new default route defined in this location replace it (to have precedence over older one)
                    if ($$.isDefined(location.routes[''])) {
                        $.extend(components, location.routes[''].components);
                    }

                    // Gets the route configuration
                    var routeConfig = location.routes[routeName];

                    // Replace this route configuration to have precedence over all previous configuration
                    $.extend(components, routeConfig.components);

                    // Creates the new route
                    var newRoute = new Route(dest.router, routeConfig.name, routeConfig.fullName, location.config, routeConfig.hash, components, routeConfig.controller);

                    // Save it on the location's routes
                    dest.routes[routeName] = newRoute;
                }
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
            finder(function(locationConfig) {
                found = true;
                locationConfig.router.parse(hash);
            });

            // If location is found stop iterating
            if (found) return;
        }
    }

    // Get the route with the specified name (in the form locationName/routeName)
    this.getRoute = function(name) {
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
        if (self.configuration[location] && self.configuration[location]['routes'][routeName]) {
            return self.configuration[location]['routes'][routeName];
        }
    }

    // Returns a hash for the specified route and configuration.
    // Routes can have variables, you can define a value for this variables using the config parameter
    this.hash = function(name, config) {
        // Get the route with the specified name
        var route = self.getRoute(name);

        // If theres a route with the specified name use the crossroad router to interpolate the hash
        if (route) {
            return route.interpolate(config);
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
ko.observable.fn.validation = function(name, validationConfig, errorHandler) {
    // Indicates that the field is validatable and the name of the field on the error messages
    this.validatable = name;

    // Loads the validation configuration
    this.validationConfig = validationConfig;

    // Extends the observable with properties that indicates if the observable has an error, and the error message
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // If an error handler has been specified
    if (errorHandler) {
        this.errorHandler = errorHandler;
    }

    // Returns the observable allowing to chain validate calls on the same
    return this;
}

// Resets validation errors on the observable and clears itself from the objects errorHandler
ko.observable.fn.validationReset = function () {
    var me = this;

    // If there is a validator attached
    if (this['validatable']) {
        // Clears error flag and message
        this.hasError(false);
        this.validationMessage('');

        // If an error handler is defined use stored error key and resolve it (clearing it from the list)
        if (this.errorHandler && this.errorKey) {
            this.errorHandler.resolve(this.errorKey);
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
                if (target.errorHandler) {
                    target.errorKey = target.errorHandler.add(target.validationMessage(), { level: 100, type: 'validation' });
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

