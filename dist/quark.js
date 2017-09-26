(function (root, factory) {
	if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		// CommonJS or Node: hard-coded dependency on "knockout"
		factory(require(['knockout', 'jquery', 'knockout-mapping', 'crossroads', 'hasher', 'signals', 'stacktrace']), exports);
	} else if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['knockout', 'jquery', 'knockout-mapping', 'crossroads', 'hasher', 'signals', 'stacktrace'], factory);
    } else {
        // Browser globals.
        throw new Error('Quark.js must be used as an AMD module, it must not be included with an script tag');
    }
}(this, function(ko, $, komapping, crossroads, hasher, signals, stacktrace) {
// Quark global
var $$ = {};
// Quark started
$$.started = false;
// Ajax error handlers repository
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
        throw new Error('Callback can not be an observable');
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

// Can be used in two forms, the first parameter is always the string to format
// If only two parameters are specified and the second is an object
// Replaces {propertyName} in the specified string for the value of the
// property with the same name in the object
// Otherwise replaces {0}, {1}.. in the specified string for the first, second..
//  etc parameter after the string.
// I.e: $$.format('Hello {0}, {1}', 'World', '2016') will return Hello World 2016
$$.formatString = function() {
    // Get the arguments of the function
    var args = Array.prototype.slice.call(arguments);

    var str = args[0];

    // If the function has exactly two arguments, the first is the string
    // and the second is an object assume the first is the string and the
    // second an object
    if (args.length == 2 && $$.isString(args[0]) && $$.isObject(args[1])) {
        var object = args[1];
        var string = str;

        for (var name in object) {
            string = replaceAll(string, '{' + name + '}', object[name]);
        }

        return string;
    } else {
        for (var i = 1; i < args.length; i++) {
            str = replaceAll(str, '{' + (i - 1) + '}', args[i]);
        }

        return str;
    }
}

// Allows to extend a class
$$.extends = function(newClass, baseClass) {
    newClass.prototype = new baseClass();
    newClass.prototype.constructor = newClass;
    newClass.super = baseClass.prototype;
}

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

// Allows for using ${object} to pass an entire object as parameters on the custom elements
// Thanks to: Jeff Mercado
// http://stackoverflow.com/questions/25692720/can-a-custom-element-be-passed-an-object-for-the-params-like-the-component-bindi
var originalParseBindingsString = ko.bindingProvider.prototype.parseBindingsString,
    re = /^\$\{(.+)\}$/;

function extractBindableObject(objExpr, bindingContext, node, options) {
    var objBindingString = '_object: ' + objExpr,
        objGetter = originalParseBindingsString.call(this, objBindingString, bindingContext, node, options),
        obj = objGetter['_object']();
    return objectMap(obj, function (value) {
        return function () { return value; };
    });
}

function objectMap(obj, mapper) {
    if (!obj) return obj;
    var result = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            result[prop] = mapper(obj[prop], prop, obj);
    }
    return result;
}

ko.bindingProvider.prototype.parseBindingsString = function (bindingsString, bindingContext, node, options) {
    var m = bindingsString.match(re);
    if (m) {
        return extractBindableObject.call(this, m[1], bindingContext, node, options);
    }
    return originalParseBindingsString.apply(this, arguments);
};

// This binding can be used on links to specify a page name as href and quark will
// automatically convert it to the url mapped.
// You can specify a page name and an additional binding with page options
ko.bindingHandlers.href = {
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        // Gets the value of the binding
        var value = ko.unwrap(valueAccessor());

        // Get the options object if defined
        var options = ko.unwrap(allBindings.get('params'));

        // Create the new accessor
        var newAccesor = function() {
            return { href: "#" + $$.routing.hash(value, options) }
        }

        // Use the attr binding to add the href to the element
        return ko.bindingHandlers.attr.update(element, newAccesor, allBindings, viewModel, context);
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function as parameters.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

// Returns the format binding accessor
function createFormatAccessor(valueAccessor, allBindings) {
    // Get the formatter configuration
    var value = valueAccessor();
    var formatterName = allBindings.get('formatter');

    // Validate that is correctly invoked
    if (!$$.isString(formatterName) && !$$.isObject(formatterName) && !$$.isFunction(formatterName)) {
        throw new Error("Must specify formatter name, function or object");
    }

    // If value its not an observable, create an observable and set the value inside
    if (!ko.isObservable(value)) {
        value = ko.observable(value);
    }

    var formatter;

    if ($$.isString(formatterName)) {
        formatter = $$.formatters[formatterName];
    } else {
        formatter = formatterName;
    }

    var computedConfig = {};

    if ($$.isDefined(formatter)) {
        if ($$.isFunction(formatter)) {
            computedConfig.read = function() {
                if ($$.isDefined(value())) {
                    return formatter(value());
                } else {
                    return value();
                }
            }
        } else if ($$.isObject(formatter)) {
            if ($$.isFunction(formatter.read)) {
                computedConfig.read = function() {
                    if ($$.isDefined(value())) {
                        return formatter.read(value());
                    } else {
                        return value();
                    }
                }
            }

            if ($$.isFunction(formatter.write)) {
                computedConfig.write = function(newValue) {
                    if ($$.isDefined(newValue)) {
                        value(formatter.write(newValue));
                    } else {
                        value(newValue);
                    }
                }
            }
        } else {
            throw new Error('The formatter object must be a function or an object with read and write properties');
        }
    } else {
        throw new Error('No formatter found with the specified name: ' + formatterName);
    }

    // Create the interceptor that is a pure computed wich transforms the
    // specified value with the formatter.
    return ko.pureComputed(computedConfig);

}

// $$.formatters is an object in wich each property is a function
// that accepts an object and returns the value formatted as must be passed to
// the binding.
// This allows to specify an observable or item to format
// and a formatter name (must correspond to an $$.formatters property)
// and transform the value before sending it to the actual binding.
// By default this send the formatted value to the text binding. You can
// specify another binding using bindTo and the name of the binding.
// For example "format: item, formatter: 'money', bindTo: 'value'"
ko.bindingHandlers.format = {
    init: function (element, valueAccessor, allBindings) {
        // Get the format accessor
        var interceptor = createFormatAccessor(valueAccessor, allBindings);
        // Get the target binding name or use text as default
        var bindingName = allBindings.get('bindTo') || 'text';

        // Create the binding object using the specified binding
        var binding = {};
        binding[bindingName] = interceptor;

        // Apply the binding to the element with the formatted output
        ko.applyBindingsToNode(element, binding);
    }
}

// This binding is similar to the if binding, it shows and bind its content only
// when the specified dependency is ready
ko.bindingHandlers.waitReady = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get binding value with the dependency name
        var value = ko.unwrap(valueAccessor());

        // Validate the binding value
        if (!$$.isString(value)) {
            throw new Error('The binding must be an string with the property name of the imported dependency');
        }

        var newAccessor = ko.observable(false);

        function checkReady(propertyName) {
            if (propertyName == value) {
                newAccessor(true);
                viewModel.imports.readied.remove(checkReady);
            }
        }

        if (viewModel && viewModel.imports && viewModel.imports.readied) {
            viewModel.imports.readied.add(checkReady);
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
function SyncLock(unlocked) {
    var self = this;

    // Is the signal dispatched (and unlocked)
    var dispatched = unlocked || false;
    // Signal to notify the unlocking and call all functions
    var signal = $$.signal();

    // Lock effectively blocking all function calls
    this.lock = function() {
        dispatched = false;
    }

    // Unlocks the object without triggering the attached functions
    this.force = function() {
        dispatched = true;
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

    // Dispose locks
    this.dispose = function() {
        $$.signalClear(signal);
    }
}

// Returns a lock
$$.lock = function(unlocked) {
    return new SyncLock(unlocked || false);
}

// Blocks execution of the function until the specified lock unlocks
$$.wait = function(lock, callback) {
    lock.call(callback);
}

// Redirect the browser to the specified url
$$.redirect = function(url) {
    window.location.href = url;
    return true;
}

// Redirect the browser to the specified page
$$.redirectHash = function(page, config) {
    var hash = $$.routing.hash(page, config);
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
    ko.cleanNode($(placeholderSelector).get(0));
    $(placeholderSelector).empty();
    $(placeholderSelector).html(html);
    ko.applyBindings(model, $(placeholderSelector).get(0));
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
// Quark can automatically authorize your ajax calls, if you specify that an ajax calls needs authorization quark will go trough the
// authentication flow.
// First uses the authorization.has function to determine if the user has credentials, if the function returns true quark assumes that
// has credentials and doesn't need to ask for. (for example checking session storage for an existing token)
// If authorization.has function returns false, calls authorization.authorize function to ask for credentials, passing a callback
// that must be called when a valid credential has been obtained. (for example after showing an popup to enter user and password)
// Finally, before any ajax call that requires authentication calls configAuthorization to config ajax for pass the credentials to the
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
    },
    globalEvents: {
        start: $$.signal(),
        authorizing: $$.signal(),
        authorized: $$.signal(),
        complete: $$.signal()
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
        throw new Error('Must specify the target URL');
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
            $$.ajaxConfig.globalEvents.complete.dispatch(url, method, data, ajaxOptions);

            if ($$.isDefined(clbks.onComplete)) {
                clbks.onComplete();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $$.ajaxConfig.globalEvents.complete.dispatch(url, method, data, ajaxOptions);
            
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
                    if ($$.ajaxErrorHandlers[handlerName](url, jqXHR, textStatus, errorThrown)) {
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

    $$.ajaxConfig.globalEvents.start.dispatch(url, method, data, ajaxOptions);

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

            $$.ajaxConfig.globalEvents.authorizing.dispatch(url, method, data, ajaxOptions);

            // Call the function to authorize and wait for callback
            ajaxOptions.authorization.authorize(function(authorized, data) {
                // When authorization is obtained clear the authorizing flag
                authorizing = false;

                // Then if credentials are obtained make the ajax call
                if (authorized) {
                    $$.ajaxConfig.globalEvents.authorized.dispatch(url, method, data, ajaxOptions);
                    invoke();
                } else {
                    if ($$.isObject(clbks) && $$.isFunction(clbks.onAuthorizeError)) {
                        clbks.onAuthorizeError(data);
                    }
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

// Function to be call in case of error.
// It can return a boolean indicating if it handled the error or not.
// Also can return an object with two properties:
// handled: indicating that the error has been handled
// stack: a function that will be called when the stack trace of the error is ready
// This is because the stack trace is processed asynchonously
$$.onError = function(msg, error) { return false; }

// This signal is dispatched whenever an error ocurrs and the stack trace
// of that error is ready
$$.errorSignal = $$.signal();

// Error object extension for binding errors
// Warning it has a reference to the node and component with the error, this
// might result in this elements not being disposed by the garbage collector
// ensure that this object is not keeped in memory (even in the console!)
function BindingError(message, component, node, error) {
    this.component = component;
    this.node = node;
    this.message = message;
    this.stack = error.stack;
}

Object.setPrototypeOf(BindingError, Error);
BindingError.prototype = Object.create(Error.prototype);
BindingError.prototype.name = "BindingError";
BindingError.prototype.message = "";
BindingError.prototype.constructor = BindingError;

// Trap all errors
window.onerror = function (msg, file, line, column, error) {
    var sendStack;
    var handled;

    // Call the error function passing the message and error
    var result = $$.onError(msg, error);

    // If result is an object try to get all expected properties
    if ($$.isObject(result)) {
        // Get the handled value
        if (result.handled) {
            handled = result.handled;
        }

        // Get the function to be called when the stack trace is processed
        if (result.stack) {
            sendStack = result.stack;
        }
    } else {
        // If the result is not an object get the result
        handled = result;
    }

    // Process the error stack, when ready dispatch the error signal
    // And call the stack function if defined
    stacktrace.fromError(error).then(function(stack) {
        $$.errorSignal.dispatch(error, stack);

        if (sendStack) {
            sendStack(stack);
        }
    });

    // Return if the error is handled (if true it doesn't show the error on
    // the console)
    return handled;
}

// If an require js error is raised rethrow it so the windows.error can
// process it
requirejs.onError = function (error) {
    throw error;
};

// If a knockout error is raised rethrow it so the windows.error can
// process it
ko.onError = function(error) {
    throw error;
};

// Custom Knockout Binding Provider that wraps the binding process inside
// a try catch block

var ErrorHandlingBindingProvider = function() {
    // Get the standard binding provider
    var original = new ko.bindingProvider();

    // Determine if an element has any bindings using the standard method
    this.nodeHasBindings = original.nodeHasBindings;

    // Return the bindings given a node and the bindingContext
    this.getBindings = function(node, bindingContext) {
        var result;

        // Process the bindings with the standard provider if it produces an
        // error throw a binding error specifying the node and component
        try {
            result = original.getBindings(node, bindingContext);
        } catch (ex) {
            var component = bindingContext.$component;
            throw new BindingError('Binding Error: ' + ex.message, component, node, ex);
        }

        return result;
    };
};
ko.bindingProvider.instance = new ErrorHandlingBindingProvider();

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

// Config the given components in the specified namespace
function configNamespace(namespace, components, moduleName) {
    moduleName = moduleName || '';

    // Iterate each specified component
    for (var name in components) {
        var item = components[name];

        // Construct the component's full name
        var fullName;

        if (name) {
            if (namespace) {
                fullName = namespace + '-' + name;
            } else {
                fullName = name;
            }
        } else {
            fullName = namespace;
        }

        // If the specified component value is a string register as component
        // if not assume its another namespace and call this function
        // recursively
        if ($$.isString(item)) {
            if (moduleName) {
                $$.registerComponent(fullName, moduleName + '/' + item);
            } else {
                $$.registerComponent(fullName, item);
            }
        } else {
            configNamespace(fullName, item, moduleName);
        }
    }
}


// Allows to define a module in quark.
// With this method you can package together components, css, js dependencies, pages and routes in one module.
// The module must be defined as a require.js module. As dependency of this module you must define 'module'
// in wich require.js will inject the module info.
// Then you must pass this value as the first parameter to this function, this allows the quark module learn info about the associated
// require.js module in wich is defined.
// The config parameters allows to define, the components that your module includes, extra configuration for require
// to define your module's dependencies, css files that your module uses, page definitions and routes.
// The mainConstructor parameter is optional, but allow to define a function that will be called when the module is instantiated.
// It receives as parameter the name defined in require.js for this module, the module path, and the require js module info.
$$.module = function(moduleInfo, config, mainConstructor) {
    // Validate parameters
    if (!$$.isDefined(moduleInfo)) {
        throw new Error('Must specify the module configuration. You can define \'module\' as dependency and pass that value in this parameter');
    }

    // Get the modules name and path from the require module info removing all text after the last / (the file name)
    var moduleName = moduleInfo.id.substring(0, moduleInfo.id.indexOf('/'));
    var modulePath = moduleInfo.uri.substring(0, moduleInfo.uri.lastIndexOf('/'));

    // If there is already a module with this name defined return it
    if ($$.modules.exists(moduleName)) {
        return $$.modules.get(moduleName);
    }

    // If config is not defined create an empty one
    if (!config) {
        config = {};
    }

    // If there's a require configuration append module's path to the defined paths and apply
    if ($$.isDefined(config.require)) {
        // Apply configuration to require
        require.config(config.require);
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

    // If theres namespace component registrations
    if (config.namespaces) {
        if (config.prefix) {
            configNamespace(config.prefix, config.namespaces, moduleName);
        } else {
            configNamespace('', config.namespaces, moduleName);
        }
    }

    // If there's a css configuration add links in the header
    if ($$.isArray(config.css)) {
        // Iterate over the css file loading each one
        for (var i = 0; i < config.css.length; i++) {
            $$.loadCss(modulePath + '/' + config.css[i]);
        }
    }

    // If there's a pages configurations add them to the routing
    // system
    if (config.pages) {
        // If there are also parameters defined for the routes
        if (config.params) {
            $$.routing.pages(config.pages, config.params, moduleName);
        } else {
            $$.routing.pages(config.pages, undefined, moduleName);
        }
    }

    // If there's a route configuration add the route mappings to the
    // routing system
    if (config.routes) {
        $$.routing.mapRoute(config.routes);
    }

    // Main object
    var main;

    // If there's a main object defined create it.
    if (mainConstructor) {
        main = new mainConstructor(moduleName, modulePath, moduleInfo);
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
        // Creates empty scope
        var $scope = {
        };
        var $context;

        // Creates an empty imports object
        var $imports = new Tracker();

        // If theres a model defined
        if (viewModel && !model) {
            $context = $$.serviceContext(p);

            // Creates the model passing the received parameters an empty scope and the
            // tracker object
            model = new viewModel(p, $scope, $imports, $context);

            // Sets the tracker main model
            $imports.setMainModel(model);
            $imports.ready.force();

            // Calls the function initComponent if exists
            if ($imports && $$.isFunction($imports.initComponent)) {
                $imports.initComponent();
            }

            // Adds the created model to the scope.
            $scope.model = model;
            // Add the imported objects to the scope
            $scope.imports = $imports;
            // Adds the context to the scope
            $scope.context = $context;
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

            // If theres an scope defined and has a dispose method call it
            if ($scope && $scope.dispose) {
                $scope.dispose();
            }

            // If there's an imports object dispose it
            if ($imports) {
                $imports.dispose();
            }

            // Undefine all internal variables.
            delete model;
            delete $scope;
            delete $imports;
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
        throw new Error('You must specify a parameters config object');
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw new Error('You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.');
    }

    // Check the objects parameter
    if (!$$.isDefined(objects)) {
        throw new Error('You must specify the viewmodel of the component in wich to load the parameters.');
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
                        if ($$.isObject(params[name]) && $$.isObject(values[name])) {
                            $$.parameters(params[name], values[name], object[name]);
                        } else {
                            object[name] = values[name];
                        }
                    } else {
                        // If the parameter should be a callback and the target is a function then replace it.
                        if ($$.isFunction(values[name])) {
                            object[name] = values[name];
                        } else {
                            // Err if not's a callback
                            if ($$.isDefined(values[name])) {
                                throw new Error('The parameter ' + name + ' must be a callback.');
                            }
                        }
                    }
                }
            }
        }
    }
}

$$.repackParameters = function(params, values) {
    var result = {};
    var toExport = new Array();
    var toSend = {};

    if ($$.isArray(params)) {
        toExport = params;
    } else if ($$.isObject(params)) {
        if ($$.isArray(params['export']) || $$.isString(params['export']) || $$.isObject(params['send'])) {
            if ($$.isDefined(params['export'])) {
                toExport = params['export'];
            }

            if ($$.isObject(params['send'])) {
                toSend = params['send'];
            }
        } else {
            throw new Error('The params object must be an array of values to export, or an object with at least an export or send property, or a string with the name of the property to export');
        }
    } else if ($$.isString(params)) {
        toExport = params;
    } else {
        throw new Error('The params object must be an array of values to export, or an object with at least an export or send property, or a string with the name of the property to export');
    }

    if ($$.isArray(toExport)) {
        for (var i = 0; i < toExport.length; i++) {
            var name = toExport[i];

            if ($$.isDefined(values[name])) {
                result = $.extend(result, values[name]);
            }
        }
    } else {
        if ($$.isDefined(values[toExport])) {
            result = $.extend(result, values[toExport]);
        }
    }

    for (var name in toSend) {
        result[name] = toSend[name];
    }

    return result;
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

$$.registerComponents = function(config) {
    configNamespace('', config);
}


ko.components.register('empty', { template: ' ' });

// Allows to group components in namespaces. The final component name is
// the namespace-component name. This method allows to chain calls to register
// to register various components under the same namespace, ie:
// $$.namespace('navbar')
//      .register('link')
//      .register('button')
//      .register('dropdown')
// Registers navbar-link, navbar-button and navbar-dropdown components.
$$.onNamespace = function(namespace, previous) {
    var self = this;

    var ns = namespace;

    this.register = function(name, url) {
        $$.registerComponent(ns + '-' + name, url);

        return self;
    }

    this.namespace = function(namespace) {
        return new $$.onNamespace(ns + '-' + namespace, self);
    }

    this.endNamespace = function() {
        return previous;
    }

    return self;
}

// Loaded behaviours array
function Behaviours() {
    var behaviours = {};

    // Define a behaviour with the specified name.
    // Behaviours allows to attach functionality to an object. This makes possible to share the same code across various classes
    // enabling a sort of hierachy.
    // If an object has an specific behaviour we can assume it will have certain methods and properties associated with the behaviour.
    // Basically, a behaviour definition is a function that receives a target object and a configuration
    // and attaches the required methods and properties based on the configuration to the target object.
    // The first parameter is the behaviour's name, it will be used when applying this behaviour to an object.
    // The second parameter is a function that accepts a parameter with the target object and a behaviour configuration.
    // The last parameter allows to define a function that accepts a target object and disposes the behaviour from the
    // the given object.
    this.define = function(name, behaviour, dispose) {
        // Warn if behaviour is repeated
        if (behaviours[name]) {
            console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
        }

        // Error if behaviour name is not a string
        if (!$$.isString(name)) {
            throw new Error('The behaviour name must be an string.');
        }

        // Error if behaviour is not a function
        if (!$$.isFunction(behaviour)) {
            throw new Error('The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.');
        }

        // Error if behaviour dispose is defined but not a function
        if ($$.isDefined(dispose) && !$$.isFunction(dispose)) {
            throw new Error('The behaviour dispose must be a function that performs cleanup of the behaviour when disposing.');
        }

        // Adds the dispose method to the behaviour with the specified function
        behaviour.dispose = dispose;

        // Adds the new behaviour to the table
        behaviours[name] = behaviour;
    }

    // Applies a behaviour to the object
    function applyBehaviour(behaviourName, object, config) {
        // Error if behaviour name is not a string
        if (!$$.isString(behaviourName)) {
            throw new Error('The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names');
        }

        // Check if behaviour exists
        if (behaviours[behaviourName]) {
            // Apply new behaviour by calling the behaviour definition function with the target object and
            // the behaviour config
            behaviours[behaviourName](object, config);

            // If the behaviours object is not defined, init an empty one
            if (!$$.isDefined(object.behaviours)) {
                object.behaviours = {};
            }

            // Add the applied behaviour to the list
            object.behaviours[behaviourName] = true;
        } else {
            throw new Error('The are no behaviours loaded with the name ' + behaviourName + '.');
        }
    }

    // Applies the behaviour to the object.
    // Behaviour is a string with the name of a defined behaviour
    // or an array of behaviour names.
    // Object is the target object
    // Config is the configuration of the behaviour or behaviours to apply
    this.apply = function(behaviour, object, config) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to apply the behaviour.');
        }

        // If an array of behaviours is specified
        if ($$.isArray(behaviour)) {
            // Iterate it applying each behaviour
            for (var i = 0; i < behaviour.length; i++) {
                applyBehaviour(behaviour[i], object, config);
            }
        } else if ($$.isString(behaviour)) {
            // If it's a string apply the named behaviour
            applyBehaviour(behaviour, object, config);
        } else {
            // Everything else fails
            throw new Error('The behaviour name must be an string or an array of strings.');
        }
    }

    // Checks if the behaviour has been added to the object
    this.has = function(behaviourName, object) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to check the behaviour.');
        }

        // Error if behaviour name is not a string
        if (!$$.isString(behaviourName)) {
            throw new Error('The behaviour name must be an string.');
        }

        if ($$.isDefined(object.behaviours) && $$.isDefined(object.behaviours[behaviourName])) {
            return true;
        }

        return false;
    }

    // Disposes object behaviours
    this.dispose = function(object) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to apply the behaviour.');
        }

        // If theres a behaviours property in the object
        if ($$.isDefined(object.behaviours)) {
            // Iterate applied behaviours calling the dispose function of each behaviour
            for (var name in object.behaviours) {
                // Get the behaviour
                var behaviour = behaviours[name];

                // If has a dispose method use it to clear the object
                if (behaviour && $$.isFunction(behaviours[behaviourName].dispose)) {
                    behaviours[behaviourName].dispose(object);
                }
            }
        }
    }
}

$$.behaviour = new Behaviours();

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
        $child: viewModel.getModel(),
        $childContext: context.$parentContext
    });

    return newContext;
}

$$.tracker = function() {
    return new Tracker();
}

function Tracker() {
    var self = this;

    var mainModel;

    // Tracked dependencies
    var dependencies = {};

    // Reference to this tracker's parent and the name on the parent
    var parent = false;
    var nameOnParent = "";

    // Stores dependency data
    function DependencyData(name) {
        this.name = name;
        this.loaded = false;
        this.ready = false;
        this.model = undefined;
        this.tracker = undefined;
    }

    // Lock to be released when the tracker readies
    this.ready = $$.lock();
    // Signal fired when a dependency loads
    this.loaded = $$.signal();
    // Signal fired when a dependency is ready
    this.readied = $$.signal();

    // Return if this tracker is ready
    this.isReady = function() {
        return !self.ready.isLocked();
    }

    // Adds a dependency to this tracker
    this.addDependency = function(name) {
        // Lock the ready property
        self.ready.lock();

        // Start tracking the dependency state by adding it to the list
        dependencies[name] = new DependencyData(name);
    }

    // Delete the dependency with the specified name
    this.removeDependency = function(name) {
        // If the dependency exists..
        if (dependencies[name]) {
            // Get the dependency's tracker
            var tracker = dependencies[name].tracker;

            // If it has a tracker delete the parent reference
            if (tracker) {
                tracker.parent = '';
            }

            // Delete the dependency from this tracker
            delete dependencies[name];
        }
    }

    // Used to indicate that a dependency has loaded
    this.loadDependency = function(name, model, tracker) {
        // Save the model and mark the dependency as loaded
        dependencies[name].model = model;
        dependencies[name].tracker = tracker;
        dependencies[name].loaded = true;

        // Signal the load of this dependency
        self.loaded.dispatch(name, model);

        // If the dependency is tracking itself..
        if (tracker) {
            // Set the dependency parent data
            tracker.setParent(self, name);

            // Check the dependency state and set it on this tracker
            if (tracker.isReady()) {
                self.readyDependency(name);
            } else {
                dependencies[name].ready = false;
            }
        } else {
            // If the dependency has no tracker mark it as ready on
            // this tracker
            self.readyDependency(name);
        }
    }

    // Used to indicate that a dependency is ready
    this.readyDependency = function(name) {
        // Mark the dependency as ready
        dependencies[name].ready = true;

        // Signal the dependency readiness
        self.readied.dispatch(name, dependencies[name].model);

        // Check this tracker readiness and if its ready mark it and inform
        // the parent
        if (checkReady()) {
            self.ready.unlock();

            // If this tracker has a parent, invoke the readyDependency method
            // on the parent to signal the readiness
            if (parent) {
                parent.readyDependency(nameOnParent, mainModel, self);
            }
        }
    }

    // Set the main model of this tracker
    this.setMainModel = function(model) {
        mainModel = model;
    }

    // Sets this tracker parent and dependency name on the parent
    this.setParent = function(parentTracker, name) {
        parent = parentTracker;
        nameOnParent = name;
    }

    // Returns the dependency model with the specified name
    this.get = function(name) {
        // Get the dependency with the specified name
        var dependency = dependencies[name];

        // If there's a dependency defined return the model
        if (dependency) {
            return dependency.model;
        }
    }

    this.reset = function() {
        self.ready.lock();

        // Iterate over all dependencies deleting each one
        for (var name in dependencies) {
            self.removeDependency(name);
        }
    }

    // Dispose this tracker removing all dependencies
    this.dispose = function() {
        self.ready.dispose();
        $$.signalClear(self.loaded);
        $$.signalClear(self.readied);

        // Iterate over all dependencies deleting each one
        for (var name in dependencies) {
            self.removeDependency(name);
        }
    }

    function checkReady() {
        // Iteate over all dependencies, and if one dependency is not loaded
        // or ready return false
        for (var name in dependencies) {
            var state = dependencies[name];
            if (!state.loaded || !state.ready) {
                return false;
            }
        }

        // Otherwise all dependencies are ready and this tracker is ready
        return true;
    }
}

// Add the model binding to the specified element
function addModelBinding(element, name, bindName) {
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
        } else if (viewModel && viewModel.$imports) {
            model = viewModel;
            imports = viewModel.$imports;
        } else {
            throw new Error('The import binding can only import to Quark components or objects with a propery $imports that contains a Tracker object');
        }

        // Start tracking this dependency
        imports.addDependency(name);

        // Adds the export binding to the element
        addModelBinding(element, name, 'export');
    }
}
ko.virtualElements.allowedBindings.import = true;

ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        var model;
        var imports;

        // If the target object has "model" and "imports" properties, then assume that is a quark scope and
        // extract the model and imports object
        if (viewModel && viewModel.imports && viewModel.model) {
            model = viewModel.model;
            imports = viewModel.imports;
        } else if (viewModel && viewModel.$imports) {
            model = viewModel;
            imports = viewModel.$imports;
        } else {
            throw new Error('The import binding can only import to Quark components or objects with a propery $imports that contains a Tracker object');
        }

        var property;

        if ($$.isString(value)) {
            property = value;
        } else {
            throw new Error('The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component');
        }

        if (imports) {
            var childModel = context.$childContext.$data.getModel();
            var childTracker = context.$childContext.$data.getImports();

            imports.loadDependency(property, childModel, childTracker);
        }
    }
}
ko.virtualElements.allowedBindings.export = true;

// Generates the content binding accessor wich uses jquery to select the nodes to
// show from the componentTemplateNodes
function createContentAccesor(valueAccessor, allBindingsAccessor, context) {
    // Gets the value of the content binding
    var value = ko.unwrap(valueAccessor());
    // Check if the virtual binding is specified
    var virtual = allBindingsAccessor.get('virtual') || false;

    // Create the new accesor
    var newAccesor = function () {
        // If the virtual binding is specified we must use the content between
        // virtual tags with the specified name
        // <!-- example -->This<!-- /example -->
        if (virtual) {
            // Init the result array of nodes and the number of coincidences
            var result = [];
            var found = 0;

            // Iterate each node in the componentTemplateNodes
            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                // Get the node
                var node = context.$componentTemplateNodes[i];

                // If the node is virtual and node name and value coincides mark as a
                // found and this and next nodes will be part of the result
                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        found++;
                    }
                }

                // If an opening tag is found then this node is pushed to the result
                if (found > 0) {
                    result.push(node);

                    // If the actual node is virtual and is the closing tag, substract
                    // one coincidence
                    if (node.nodeType == 8) {
                        if (node.nodeValue.trim().toUpperCase() == "/" + value.toUpperCase()) {
                            found--;
                        }
                    }
                }
            }

            // Return the found nodes
            return { nodes: result };
        } else {
            // If a value is specified use it as a jquery filter, if not use all the nodes.
            if ($$.isDefined(value)) {
                var nodes = $(context.$componentTemplateNodes).filter(value);
                return { nodes: nodes };
            } else {
                return { nodes: context.$componentTemplateNodes };
            }
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
// the specified jquery selector inside the component's content, or if virtual
// node are used, try to find a virtual node with the specified name
function createHasContentAccesor(valueAccessor, allBindings, context) {
    // Gets the value of the content binding
    var value = ko.unwrap(valueAccessor());
    // Check if the virtual binding is specified
    var virtual = allBindings.get('virtual') || false;

    // Creates the new accessor
    var newAccesor = function () {
        // If virtual node is used
        if (virtual) {
            // Iterate over all nodes
            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                var node = context.$componentTemplateNodes[i];

                // If an opening node with the specified name is found return true
                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        return true;
                    }
                }
            }

            return false;
        } else {
            // Check if the filter has any value
            return $(context.$componentTemplateNodes).filter(value).length > 0;
        }
    };

    return newAccesor;
}

// Shows and bind its content only if there are elements that
// matches the specified jquery selector in the component's content
ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, allBindingsAccessor, context);

        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

// The inverse of the hasContent binding.
ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, allBindingsAccessor, context);

        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;


// Default controller provider
$$.controllerProvider = function(page, successCallback, errorCallback) {
    var self = this;

    // Module path
    var path = '';

    // Set the controllers base
    this.controllersBase = 'controllers';

    // Get the page config
    var pageConfig = $$.routing.getPageConfig(page);

    // If is a page module
    if (pageConfig.module) {
        path = pageConfig.module + '/' + self.controllersBase + '/' + page + '.controller';
    } else {
        path = self.controllersBase + '/' + page + '.controller';
    }

    // Base path of the controllers
    require([path], function(ControllerClass) {
        successCallback(ControllerClass);
    }, function(error) {
        errorCallback();
    });
}

function QuarkRouter() {
    var self = this;

    // Create a new crossroads router
    var csRouter = crossroads.create();
    csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
    csRouter.ignoreState = true;

    // Current page data
    var current = {
        name: ko.observable(),
        module: ko.observable(),
        controllers: {},
        trackers: {}
    };

    // Current route name observable
    this.current = current.name;
    this.currentModule = current.module;
    this.currentHash = ko.observable();

    // Routed signal
    this.routed = $$.signal();

    // Defined pages, mappings, crossroads routes and parameters
    var pages = {};
    var mappings = {};
    var routes = {};
    var params = {};

    // Used to store the module in wich the page was defined
    var pagesModule = {};

    // Adds defined pages to the collection
    this.pages = function(pagesConfig, paramsConfig, module) {
        // If a module is defined
        if (module) {
            for (var pageName in pagesConfig) {
                var pageParts = pageName.split('/');

                var fullName = '';

                for (var i = 0; i < pageParts.length; i++) {
                    var part = pageParts[i];

                    if (fullName != '') {
                        fullName += '/';
                    }

                    fullName += part;

                    if (!pages[fullName]) {
                        pagesModule[fullName] = module;
                    }
                }
            }
        }

        // Combine current configuration with the new
        $.extend(pages, pagesConfig);

        // If a parameter configuration is specified combine it with the
        // previous
        if (paramsConfig) {
            $.extend(params, paramsConfig);

            for (var pageName in paramsConfig) {
                if (!$$.isDefined(pages[pageName])) {
                    pages[pageName] = {};
                }
            }
        }
    }

    // Returns the configuration of the specified page
    this.getPageConfig = function(pageName) {
        var config = {};

        if (pages[pageName]) {
            config.name = pageName;
            config.outlets = pages[pageName];
        }

        if (mappings[pageName]) {
            config.route = mappings[pageName];
        }

        if (params[pageName]) {
            config.param = params[pageName];
        }

        if (pagesModule[pageName]) {
            config.module = pagesModule[pageName];
        }

        return config;
    }

    // Gets the index and full path name of the shared parts
    // between the old and the new page
    function findPosition(newPage) {
        // Get the current page name
        var currentName = current.name();

        // If theres a current page, split its components
        // If not return the first position
        var oldNames;
        if (currentName) {
            oldNames = currentName.split('/')
        } else {
            return { index: 0 }
        }

        // Split the new name parts
        var newNames = newPage.split('/');
        var fullName;

        // Compare each route and return the position where
        // they diverge
        for (var i = 0; i < newNames.length; i++) {
            if (oldNames[i] != newNames[i]) {
                return { index: i, fullName: fullName };
            } else {
                fullName = fullName ? fullName + '/' + oldNames[i] : oldNames[i];
            }
        }

        // The page is the same, return the last index and the full name
        return { index: newNames.length, fullName: fullName }
    }

    // Default controller class (empty)
    function DefaultController() {
    }

    // Configs an newly created controller
    function configControllerAndTracker(fullName, controller, tracker, parentController) {
        // Sets the tracker main model to the controller and force open the lock
        tracker.setMainModel(controller);
        tracker.ready.force();

        // Set the trackers and controllers of the current page
        current.trackers[fullName] = tracker;
        current.controllers[fullName] = controller;

        // If the previous controller is defined
        if (parentController) {
            // Add a property to the current controller pointing to the parent
            controller.parent = parentController;
        }
    }

    // Loads controllers given the new page, position where the previous and new page
    // differ and call the callback when ready
    function addControllers(page, position, callback) {
        // Page names array
        var names = [];

        // If page is specified, divide it in its parts
        if (page) {
            names = page.split('/');
        }

        // If the differing position is before the end of the names array
        if (position.index < names.length) {
            // Get the name at the current position
            var name = names[position.index];
            // Save the previous fullname
            var previousName = position.fullName;

            // Get parent controller
            var parentController;

            if (previousName && current.controllers[previousName]) {
                parentController = current.controllers[previousName];
            }

            // Get the new full name combining the full name and this position's name
            var fullName = position.fullName ? position.fullName + '/' + name : name;

            // Calculate new position
            var newPosition = { index: position.index + 1, fullName: fullName };

            // Load with Require the controller
            $$.controllerProvider(fullName, function(ControllerClass) {
                // If a controller class is found and loaded create the object
                var tracker = new Tracker();
                var newController = new ControllerClass(parentController, tracker);

                // Config the new controller and tracker
                configControllerAndTracker(fullName, newController, tracker, parentController);

                // Recursively add the next controller
                addControllers(page, newPosition, callback);
            }, function(error) {
                // If a controller class is not found create the default controller
                var tracker = new Tracker();
                var newController = new DefaultController(parentController, tracker);

                // Config the new controller and tracker
                configControllerAndTracker(fullName, newController, tracker, parentController);

                // Recursively add the next controller
                addControllers(page, newPosition, callback);
            });
        } else {
            // If differing position is at the end of the array we are done
            // routing
            callback();
        }
    }

    // Clears the old controllers passing the given position
    function clearControllers(position) {
        // Get the current page name
        var currentName = current.name();

        // If theres a current page, split its components, if not
        // init an empty array
        var names = [];
        if (currentName) {
            names = currentName.split('/');
        }

        // Get the position full name
        var fullName = position.fullName

        // Iterate over all name parts starting in the specified position
        for (var i = position.index; i < names.length; i++) {
            // Get the name and fullName
            var name = names[i];
            fullName = fullName ? fullName + '/' + name : name;

            // Get current controller
            var controller = current.controllers[fullName];
            var tracker = current.trackers[fullName];

            // If the controller has a dispose method call it allowing code
            // clean up
            if (controller) {
                if ($$.isFunction(controller.dispose)) {
                    controller.dispose();
                }
            }

            if (tracker) {
                tracker.dispose();
            }

            // Delete the controller reference
            delete current.controllers[fullName];
            delete current.trackers[fullName];
        }
    }

    // Clears the outlets defined in the current routes
    // passing the specified position
    function clearOutlets(position) {
        // Get the current page name
        var currentName = current.name();

        // Page name parts
        var names = [];

        // If theres a current page, split its components
        if (currentName) {
            names = currentName.split('/');
        }

        // Get the first position full name
        var fullName = position.fullName;

        // Iterate over all name parts starting in the specified position
        for (var i = position.index; i < names.length; i++) {
            // Get the name and fullName of the next position
            var name = names[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Get the part components and current controller
            var components = pages[fullName];
            var controller = current.controllers[fullName];

            // Iterate over part components and set the empty template
            for (var item in components) {
                controller.outlets[item] = 'empty';
            }
        }
    }

    // Add all componentes defined in the page parts passing the specified
    // position
    function addOutlets(newPage, position) {
        // Page name parts
        var newNames = [];

        // If theres a new page defined split it's parts
        if (newPage) {
            newNames = newPage.split('/');
        }

        // Init the full name at the specified position
        var fullName = position.fullName;

        // Iterate over all name parts stating on the specified position
        for (var i = position.index; i < newNames.length; i++) {
            // Get the name and full name
            var name = newNames[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Current controller at position
            var controller = current.controllers[fullName];

            // Get all components name for the current position index
            var componentsValues = pages[fullName];

            // If the outlets object is not created on the controller init an
            // empty object
            if (!controller.outlets) {
                controller.outlets = {};
            }

            // Iterate over all components and add the configured outlets
            // to current controller
            for (var item in componentsValues) {
                controller.outlets[item] = componentsValues[item];
            }

            // Get all the parameters configured for this page
            var parameters = params[fullName];

            // If the params object is not created on the controller init an
            // empty object
            if (!controller.params) {
                controller.params = {};
            }

            // If there are parameters defined for this route
            if (parameters) {
                if ($$.isArray(parameters)) {
                    // Iterate over all defined parameters and create an observable
                    // in the controller's param object for each
                    for (var j = 0; j < parameters.length; j++) {
                        controller.params[parameters[j]] = ko.observable();
                    }
                } else if ($$.isObject(parameters)) {
                    for (var name in parameters) {
                        controller.params[name] = ko.observable(parameters[name]);
                    }
                } else {
                    throw new Error('The parameters of \'' + fullName + '\' must be an object or array');
                }
            }
        }
    }

    // Sets the parameters values with the values specified in the route
    function setParameters(parameterValues, page) {
        // Page parts and full name
        var names = [];
        var fullName;

        // If a page is defined split its parts
        if (page) {
            names = page.split('/');
        }

        // For each name in the route
        for (var i = 0; i < names.length; i++) {
            // Get the  name and full name at the current position
            var name = names[i];
            fullName = fullName ? fullName + '/' + name : name;

            // If there are parameters at the current position
            if (params[fullName]) {
                // Get the current controller
                var controller = current.controllers[fullName];

                // If the controller params object is created
                if (controller && controller.params) {
                    // Iterate over each param name and set the parameter value
                    for (var paramName in controller.params) {
                        if ($$.isDefined(parameterValues[paramName])) {
                            var value = parameterValues[paramName];
                            controller.params[paramName](value);
                        }
                    }
                }
            }
        }
    }

    // Calls init method on all new controllers
    function initControllers(newPage, position) {
        // Page name parts
        var newNames = [];

        // If theres a new page defined split it's parts
        if (newPage) {
            newNames = newPage.split('/');
        }

        // Init the full name at the specified position
        var fullName = position.fullName;

        // Iterate over all name parts stating on the specified position
        for (var i = position.index; i < newNames.length; i++) {
            // Get the name and full name
            var name = newNames[i];
            fullName = fullName ? fullName + "/" + name : name;

            // Current controller at position
            var controller = current.controllers[fullName];

            // If controller and init method are defined call it
            if (controller && controller.init) {
                controller.init();
            }
        }
    }

    // Creates a new crossroad route for each specified page map
    function createRoute(page, hash) {
        // Create a route for the page and hash
        routes[page] = csRouter.addRoute(hash, function(parameters) {
            // Get's the shared position between the old and new page
            var position = findPosition(page);

            // Delete all components of the old page
            clearOutlets(position);
            // Clear the old controllers
            clearControllers(position);

            addControllers(page, position, function() {
                // Add the components of the new page
                addOutlets(page, position);

                // Set the new set of parameters
                setParameters(parameters, page);

                // Call init method on all new controllers
                initControllers(page, position);

                // Set the new page name and module
                current.name(page);

                var pageConfig = self.getPageConfig(page);
                if (pageConfig.module) {
                    current.module(pageConfig.module);
                } else {
                    $$.undefine(current.module);
                }


                // Dispatch the routed signal
                self.routed.dispatch(page);
            });
        });
    }

    // Configure routes for pages
    this.mapRoute = function(maps) {
        // For each page to be mapped
        for (var page in maps) {
            // Get the hash
            var hash = maps[page];

            // Create and configure a crossroad route for each route and page
            createRoute(page, hash);

            // Add the mapping between page and hash to the object
            mappings[page] = hash;
        }
    }

    // Parse the specified hash
    this.parse = function(hash) {
        // Sets the current Hash
        self.currentHash(hash);

        // Use the crossroad route to parse the hash
        csRouter.parse(hash);
    }

    // Gets the hash for the specified page
    this.hash = function(page, options) {
        // Get the crossroad route of the specified page
        var route = routes[page];

        // If a route is found interpolate the hash
        if (route) {
            return route.interpolate(options);
        }
    }

    // Activate the crossroad hasher, you can define a custom function
    // to execute when the route changes (inside must call to the parse method
    // to actually perform the routing)
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

    // Outlet binding, allows to show the configured component for the actual route
    ko.bindingHandlers.outlet = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            // Get outlet name
            var value = ko.unwrap(valueAccessor());
            // Current controller name
            var currentController;
            // Component name to show on this outlet
            var componentData = ko.observable({ name: 'empty' });

            var resetScroll = allBindingsAccessor.get('resetScroll') || true;

            function updateValue(newValue) {
                // Route names
                var names = [];

                // If a new route value is specified
                if (newValue) {
                    names = newValue.split('/');
                }

                var controller;
                var fullName;

                var newComponentName;
                var newController;
                var newTracker;

                // For each part in the new route
                for (var i = 0; i < names.length; i++) {
                    // Get the name a full name at the given position
                    var name = names[i];
                    fullName = fullName ? fullName + '/' + name : name;

                    // Get the controller at this position
                    var controller = current.controllers[fullName];
                    var tracker = current.trackers[fullName];

                    // Iterate the outlets defined in the controller
                    for (var outletName in controller.outlets) {
                        // If the outlet name corresponds to the configured
                        if (outletName == value) {
                            // Set the new component name and controller
                            newComponentName = controller.outlets[outletName];
                            newController = controller;
                            newTracker = tracker;
                        }
                    }
                }

                // If there is a new component defined
                if (newComponentName) {
                    // If the new component name and controller differs from previous
                    if (newComponentName != componentData().name || newController != currentController) {
                        // Init the binding data with the component name
                        var data = { name: newComponentName };

                        // If the new controller has a sendParameters method call it to
                        // obtain component's parameters and add them to the binding data
                        if (newController && newController.sendParameters) {
                            data.params = newController.sendParameters(value, newComponentName);
                        } else {
                            data.params = {};
                        }

                        newTracker.addDependency(value);

                        // Save the current controller and bind the new value
                        currentController = newController;
                        componentData(data);

                        if (resetScroll) {
                            window.scrollTo(0, 0);
                        }
                    }
                } else {
                    // if there isn't a new component clear controller and
                    // bind to the empty template
                    currentController = '';
                    componentData({ name: 'empty' });
                }
            }

            // Subscribe to name changes (routing)
            var subscription = current.name.subscribe(updateValue);

            updateValue(current.name());

            // Destroy subscription on element disposal
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                subscription.dispose();
                currentController = '';
            });

            // Add model binding to export to controller
            addModelBinding(element, value, 'exportToController');

            // Apply component binding to node with the new component data
            //ko.applyBindingsToNode(element, { 'component': componentData });

            var newAccessor = function() {
                return componentData;
            }

            return ko.bindingHandlers.component.init(element, newAccessor, allBindingsAccessor, viewModel, context);
        }
    }
    ko.virtualElements.allowedBindings.outlet = true;

    ko.bindingHandlers.exportToController = {
        init: function(element, valueAccessor, allBindings, viewModel, context) {
            // Get dependency name
            var value = ko.unwrap(valueAccessor());

            // Route names
            var names = [];

            var currentName = current.name();

            // If a new route value is specified
            if (currentName) {
                names = currentName.split('/');
            }

            var controller;
            var fullName;

            var actualComponentName;
            var actualController;
            var actualTracker;

            // For each part in the new route
            for (var i = 0; i < names.length; i++) {
                // Get the name a full name at the given position
                var name = names[i];
                fullName = fullName ? fullName + '/' + name : name;

                // Get the controller at this position
                var controller = current.controllers[fullName];
                var tracker = current.trackers[fullName];

                // Iterate the outlets defined in the controller
                for (var outletName in controller.outlets) {
                    // If the outlet name corresponds to the configured
                    if (outletName == value) {
                        // Set the new component name and controller
                        actualComponentName = controller.outlets[outletName];
                        actualController = controller;
                        actualTracker = tracker;
                    }
                }
            }

            if (actualController && actualTracker) {
                var childModel = context.$childContext.$data.getModel();
                var childTracker = context.$childContext.$data.getImports();

                actualTracker.loadDependency(value, childModel, childTracker);
            }

            actualController = '';
            actualTracker = '';
        }
    }
    ko.virtualElements.allowedBindings.exportToController = true;

}

// Create the quark router
$$.routing = new QuarkRouter();

ko.bindingHandlers.namespace = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        // Get the namespace value
        var value = valueAccessor();

        // Get the namespace alias
        var alias = allBindings.get('alias');

        // Validate data
        if (!$$.isString(value)) {
            throw new Error('Must specify namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'');
        }

        // If namespace alias is not defined throw error
        if (!$$.isString(alias)) {
            throw new Error('Must specify alias to namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'');
        }

        // Transform values to lowercase
        var namespace = value.toLowerCase();
        alias = alias.toLowerCase();

        // If theres a context defined
        if (context) {
            var extension;

            // Check if theres a namespaces object defined in the context
            if (!context.namespaces) {
                extension = { namespaces: {} };
            } else {
                extension = { namespaces: context.namespaces };
            }

            // Add the alias to the list
            extension.namespaces[alias] = namespace;

            var innerBindingContext = context.extend(extension);
            ko.applyBindingsToDescendants(innerBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
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
                var directParamRegExp = /^\$\{(.+)\}$/;
                var directParamMatch = params.value.match(directParamRegExp);

                if (directParamMatch) {
                    comment += ", params: " + directParamMatch[1] + " ";
                } else {
                    comment += ", params: { " + params.value + " } ";
                }
            } else {
                comment += ", params: {}";
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
                    // Flag the overall result as false, but not return yet because we want
                    // to iterate over all properties to find all errors
                    result = false;
                }
            }
        }
    }

    // Returns the result
    return result;
}

// Unsubscribe validation from the object.
// This must be called when the ko.validate was used with subscription to allow
// all subscriptions to be correctly disposed
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
    // Iterate over each property of the object
    for (var propertyName in object) {
        var property = object[propertyName];

        // If its an observable an has a validator attached
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Reset its validation errors
                property.validationReset();
            }
        }
    }
}

// Attach a validator to the observable.
// Calling this function will activate validation on the observable.
// Name is the field name to show on error messages.
// Validation config is an object with the configuration of validations to enforce,
ko.observable.fn.validation = function(name, validationConfig) {
    // Indicates that the field is validatable and the name of the field on the error messages
    this.validatable = name;

    // Loads the validation configuration
    this.validationConfig = validationConfig;

    // Extends the observable with properties that indicates if the observable has an error,
    // and the error message
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // Returns the observable allowing to chain validate calls
    return this;
}

// Resets validation errors on the observable
ko.observable.fn.validationReset = function () {
    var me = this;

    // If there is a validator attached
    if (this['validatable']) {
        // Clears error flag and message
        this.hasError(false);
        this.validationMessage('');
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
                // Return false if validation fails
                return false;
            }
        }
    }

    // If validation passes return true
    return true;
};

// Validates the observable using the defined rules.
// Subscribe indicates if the validators must subscribe to the observable
// to reevaluate on change.
ko.observable.fn.validate = function(subscribe) {
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

function ServiceContext() {
    var self = this;

    var services = {};

    this.get = function(name) {
        if (services[name]) {
            return services[name];
        } else {
            var ServiceClass = require("service!" + name);
            var service = new ServiceClass(self);
            services[name] = service;
            return service;
        }
    }
}

$$.serviceContext = function(params) {
    if (params && params.context && params.context instanceof ServiceContext) {
        return params.context;
    } else {
        return new ServiceContext();
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

