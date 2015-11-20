(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['knockout', 'jquery', 'knockout-mapping', 'accounting-js', 'crossroads', 'hasher', 'signals', 'blockui'], factory);
    } else {
        // Browser globals.
        root.komapping = ko.mapping;
        root.$$ = factory(root.ko, root.$, root.komapping, root.accounting, root.crossroads, root.hasher, root.signals);
    }
}(this, function(ko, $, komapping, accounting, crossroads, hasher, signals) {
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
    return Number(variable) == variable && variable % 1 === 0;
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

$$.clear = function(object) {
    $.each(object, function(key, property) {
        if (ko.isObservable(property)) {
            property(undefined);
        } else {
            property = undefined;
        }
    });
}

$$.undefine = function(object) {
    if (ko.isObservable(object)) {
        object(undefined);
    } else {
        object = undefined;
    }
}

$$.signal = function() {
    return new signals.Signal();
}

$$.signalClear = function(signal) {
    signal.removeAll();
}

function ComponentError(key, text, data) {
    this.key = key;
    this.text = text;
    this.data = data;

    this.level = data && data.level ? data.level : 0;
    this.type = data && data.type ? data.type : '';
}

function ComponentErrors() {
    var self = this;

    var repository = ko.observableArray();

    this.keys = 1;

    this.add = function(text, data) {
        var key = self.keys++;
        var error = new ComponentError(key, text, data);

        repository.push(error);

        return key;
    }

    this.throw = function(text, data) {
        var key = self.add(text, data);
        throw repository()[key];
    }

    this.resolve = function(key) {
        var error = self.getByKey(key);

        if (error) {
            repository.remove(error);
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

        for (var index in errors) {
            var error = errors[index];

            if (error.key == key) {
                return error;
            }
        }
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

    this.get = function() {
        return ko.pureComputed(function() {
            return repository;
        });
    }
}

$$.errorHandler = function() {
    return new ComponentErrors();
}

$$.start = function(model) {
    if (!$$.started) {
        ko.applyBindings(model);
        $$.started = true;
    }
}

$$.module = function(moduleInfo, config, mainConstructor) {
    // Validate parameters
    if (!$$.isDefined(moduleInfo)) {
        throw 'Must specify the module configuration. You can define \'module\' as dependency and pass that value in this parameter';
    }

    // Get the modules name and path removing all text after the last / (the file name)
    var moduleName = moduleInfo.id.substring(0, moduleInfo.id.lastIndexOf('/'));
    var modulePath = moduleInfo.uri.substring(0, moduleInfo.uri.lastIndexOf('/'));

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
            for (var pathName in config.require.paths) {
                config.require.paths[pathName] = modulePath + '/' + config.require.paths[pathName];
            }
        }

        require(config.require);
    }

    // If there's a components configuration add the prefix to the tag name of each component, the module path to the component's path
    // and register
    if (config.components) {
        for (var componentTagName in config.components) {
            var tagName = config.prefix + "-" + componentTagName;
            var path = moduleName + '/' + config.components[componentTagName];

            ko.components.register(tagName, { require: path });
        }
    }

    // If there's a css configuration add links in the header
    if ($$.isArray(config.css)) {
        for (var i = 0; i < config.css.length; i++) {
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = modulePath + '/' + config.css[i];
            document.getElementsByTagName("head")[0].appendChild(link);
        }
    }

    var main = {};

    // If there's a main object defined create it.
    if (mainConstructor) {
        main = new mainConstructor(moduleName);
    }

    if (main['start']) {
        main.start();
    }

    $$.modules.add(moduleName, {
        name: moduleName,
        path: modulePath,
        info: moduleInfo,
        config: config,
        main: main
    });

    return $$.modules.get(moduleName);
}

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

        var $errorHandler = errorHandler;

        // If theres a viewModel defined
        if (viewModel && !model) {
            // Creates the model passing parameters and empty scope
            model = new viewModel(p, $scope, $errorHandler);
            $scope.model = model;
            $scope.errorHandler = $errorHandler;
            $scope.controller = $$.controller;
        }

        // Creates model and scope getters to allow quark to bind to each part
        this.getModel = function() { return model; }
        this.getScope = function() { return $scope; }
        this.getErrorHandler = function() { return $errorHandler; }

        // Dispose the model and scope on objects destruction
        this.dispose = function() {
            if (model && model.dispose) {
                model.dispose();
            }

            if ($scope && $scope.dispose) {
                $scope.dispose();
            }

            model = undefined;
            $scope = undefined;
            $errors = undefined;
        }
    }

    if (viewModel) {
        return { template: view, viewModel: Model }
    } else {
        return { template: view }
    }
}

// Receive configuration params extacting the value if neccesary.
$$.config = function(config, values, objects) {
    // Checks the configuration object
    if (!$$.isObject(config)) {
        throw 'You must specify a config object';
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
    }

    if (!$$.isDefined(objects)) {
        throw 'You must specify the viewmodel of the component in wich to load the configuration.';
    }

    if (!$$.isArray(objects)) {
        objects = Array(objects);
    }

    // Iterates configuration...
    for (var name in config) {
        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];

            // If config object doesnt exists, it creates one
            if (!$$.isDefined(object.config)) {
                object.config = {};
            }

            // Warn if config exists
            if ($$.isDefined(object.config[name])) {
                console.warn('There is already a config property named ' + name + ' in the target component. The property will be replaced.');
            }

            // Sets the new config property with the default value to the target component
            object.config[name] = config[name];

            // Warn if property is defined as observable
            if (ko.isObservable(object.config[name])) {
                console.warn('Property ' + name + ' should not be observable. The configuration parameters should be static, if you want the object to react to parameter changes use the parameters method.');
            }

            // If there is a value for the configuration then replace it in the configuration property
            if ($$.isDefined(values[name])) {
                // if the source value is an observable extract value if not use as is
                if (ko.isObservable(values[name])) {
                    object.config[name] = values[name]();
                } else {
                    object.config[name] = values[name];
                }
            }
        }
    }
}

// Receive parameters from the component tag and set them into the viewmodel
$$.parameters = function(params, values, objects) {
    // Checks the parameters configuration object
    if (!$$.isObject(params)) {
        throw 'You must specify a parameters config object';
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
    }

    if (!$$.isDefined(objects)) {
        throw 'You must specify the viewmodel of the component in wich to load the parameters.';
    }

    if (!$$.isArray(objects)) {
        objects = Array(objects);
    }

    // Iterate the parameters
    for (var name in params) {
        for (var i = 0; i < objects.length; i++) {
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

// Copies one object into other. If recursively is false or not specified it copies all properties in the "to" object
// that exists in "from" object, if recursively is true does the same with each property (copying object graphs)
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
                    $$.inject(to[name](), value, true);
                } else {
                    to[name](value);
                }
            } else {
                if (recursively && $$.isObject(to[name])) {
                    $$.inject(to[name], value, true);
                } else {
                    to[name] = value;
                }
            }
        }
    }
}

// Loaded behaviours array
var behaviours = {};

// Loads a behaviour with the specified name
$$.behaviour = function(name, behaviour, dispose) {
    // Warn if repeated
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
        // Apply new behaviour
        behaviours[behaviourName](object);

        if (!$$.isDefined(object.$support)) {
            object.$support = {};
        }

        if (!$$.isDefined(object.$support.behaviours)) {
            object.$support.behaviours = {};
        }

        object.$support.behaviours[behaviourName] = true;
    } else {
        throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
    }
}

// Applies the behaviour to the object. You can specify a string with the name of a loaded behaviour
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

    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.behaviours)) {
        for (var name in object.$support.behaviours) {
            var behaviour = object.$support.behaviours[name];

            if (behaviour.dispose) {
                behaviour.dispose(object);
            }
        }
    }
}

ko.associativeObservable = function (initialValue) {
    function associative() {
        if (arguments.length > 0) {
            // Write
            associative.underlying(arguments[0]);
            return this;
        }
        else {
            return associative.underlying();
        }
    }

    associative.underlying = ko.observable(initialValue);

    associative.add = function(key, item) {
        var object = associative.underlying();

        if (!object) {
            object = {};
        }

        object[key] = item;

        associative.underlying(object);
    }

    associative.get = function(key) {
        var object = associative.underlying();

        if (object) {
            return object[key];
        }
    }

    associative.remove = function(key) {
        var object = associative.underlying();

        if (object && $$.isDefined(object[key])) {
            delete object[key];
        }

        associative.underlying(object);
    }

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

    associative.each = function(callback) {
        var object = associative.underlying();

        if (object) {
            for (var key in object) {
                callback(key, object[key]);
            }
        }
    }

    associative.subscribe = function(callback) {
        return associative.underlying.subscribe(callback);
    }


    return associative
}

// Modules List
$$.modules = ko.associativeObservable({});

// Defines a computed parameter. You must specify the parameter (received in component's constructor), the read and write accessors with the form
// and the component's viewmodel
ko.computedParameter = function (param, accessors, object) {
    if (!ko.isObservable(param)) {
        param = ko.observable(param);
    }

    return ko.computed({
        read: function () {
            return accessors.read(param);
        },
        write: function (newValue) {
            return accessors.write(param, newValue);
        }
    }, object);
}

// Registers the quark component
ko.components.register('quark-component', {
    template: "<!-- ko componentShadyDom --><!-- /ko --><!-- ko modelExporter --><!-- /ko -->"
});

// Sets the component tracking in the parent and awaits the component to be fully binded then it calls the ready function.
ko.bindingHandlers.import = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var object = viewModel.model;
        var name = valueAccessor();

        if (!$$.isString(name)) {
            throw 'The import value must be an string with the name of the property to create on the parent object';
        }

        if (!$$.isObject(object.$support)) {
            object.$support = {};
        }

        // Sets the childs array wich tracks the dependencies and state
        if (!$$.isObject(object.$support.tracking)) {
            object.$support.tracking = {
                childs: {}
            }
        }

        // Start tracking the dependency
        object.$support.tracking.childs[name] = {};

        // Define a function to call when the child finishes loading.
        // PropertyName contains the child name, and vm the corresponding viewmodel
        object.$support.tracking.childs[name]['load'] = function(propertyName, vm) {
            // Sets the child viemodel and marks it as loaded
            object[propertyName] = vm;
            object.$support.tracking.childs[propertyName]['loaded'] = true;

            if ($$.isDefined(object['loaded'])) {
                object.loaded(propertyName, vm);
            }

            if ($$.isDefined(vm.$support) && $$.isDefined(vm.$support.tracking)) {
                // If the child has dependencies mark the dependency as not ready and save
                // the parent data (reference and state)
                object.$support.tracking.childs[propertyName]['ready'] = false;

                vm.$support.tracking.parent = object;
                vm.$support.tracking.parentState = object.$support.tracking.childs[propertyName];
            } else {
                // If the child hasn't dependencies mark the dependency on parent as ready
                object.$support.tracking.childs[propertyName]['ready'] = true;

                if ($$.isDefined(object['readied'])) {
                    object.readied(propertyName, vm);
                }

                // If there's a ready function on the child invoke it
                if ($$.isDefined(vm['ready'])) {
                    vm['ready']();
                }
            }

            // If any property in the child is not loaded or ready then exit
            // !! OPTIMIZE !! by using a counter and not iterating all array over and over
            for (var property in object.$support.tracking.childs) {
                if (!object.$support.tracking.childs[property]['loaded'] || !object.$support.tracking.childs[property]['ready']) {
                    return;
                }
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object.$support) && $$.isDefined(object.$support.tracking) && $$.isDefined(object.$support.tracking.parent)) {
                object.$support.tracking.parentState['ready'] = true;

                if ($$.isDefined(object.$support.tracking.parent['readied'])) {
                    object.$support.tracking.parent.readied(propertyName, vm);
                }

                object.$support.tracking.parent.$support.tracking.childReady();
            }
        }

        // Initialize the tracking of the child component
        object.$support.tracking.childs[name]['loaded'] = false;

        // Defines a function to call when one of its childs is ready.
        // It forces the object to reevaluate its readiness
        object.$support.tracking.childReady = function() {
            // !! OPTIMIZE !! By using a counter. If there is a child that is not ready then exits
            for (var property in object.$support.tracking.childs) {
                if (!object.$support.tracking.childs[property]['ready']) {
                    return;
                }
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object['parent']) && $$.isDefined(object.parent.$support.tracking)) {
                object.$support.tracking.parentState['ready'] = true;
                object.$support.tracking.parent.$support.tracking.childReady();
            }
        }

        // Import the dependency to the target object
        object[name] = {};

        element.setAttribute('qk-export', "\'" + name + "\'");
    }
}

// Exports the parent viewmodel to the parent object
ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        value = ko.unwrap(valueAccessor());

        viewModel = viewModel.model;

        var property;

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


function createComponentShadyDomAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

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


function createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var newAccesor = function () {
        var nodes = Array();
        var parent = element.parentNode.parentNode;

        for (var i = 0; i < parent.attributes.length; i++) {
            var attrib = parent.attributes[i];
            if (attrib.specified) {
                if (attrib.name.indexOf('qk-') === 0) {
                    nodes.push(document.createComment("ko " + attrib.name.replace('qk-', '') + ": " + attrib.value));
                    nodes.push(document.createComment("/ko"));
                }
            }
        }

        return { nodes: nodes, if: nodes.length > 0 };
    };

    return newAccesor;
}

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

ko.bindingHandlers.call = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value();
    }
}
ko.virtualElements.allowedBindings.call = true;


function injectBinding(valueAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var target = context.$child;
    var data = value;

    if ($$.isObject(value)) {
        if ($$.isDefined(value['data']) && $$.isDefined(value['target'])) {
            target = value.target;
            if (ko.isObservable(value.data)) {
                data = value.data();
            } else {
                data = value.data;
            }
        }
    }

    $$.inject(data, target);
}

ko.bindingHandlers.inject = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    }
};
ko.virtualElements.allowedBindings.inject = true;




function createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());
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
    return newAccesor;
}

ko.bindingHandlers.content = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};

ko.virtualElements.allowedBindings.content = true;

function createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        return $(context.$componentTemplateNodes).filter(value).length > 0;
    };

    return newAccesor;
}

ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;

function createPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var name = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        var current = $$.routing.current();

        var component;
        var params;

        if ($$.isArray(current.route.components[name])) {
            component = current.route.components[name][0];
            eval("params = {" + current.route.components[name][1] + "}");
        } else {
            component = current.route.components[name];
            params = current;
        }

        return {
            name: ko.pureComputed(function() {
                return component;
            }),
            params: params
        }
    };

    return newAccesor;
}

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

ko.bindingHandlers.hasPage = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccessor = createHasPageAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);

        return ko.bindingHandlers['if'].init(element, newAccessor, allBindingsAccessor, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.hasPage = true;

ko.bindingHandlers.stopBinding = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        return { controlsDescendantBindings: true };
    }
}

ko.bindingHandlers.upContext = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.init(element, valueAccessor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.update(element, valueAccessor, allBindingsAccessor, context.$parent, newContext);
    }
};

ko.virtualElements.allowedBindings.upContext = true;

//crossroads, hasher
function QuarkRouter() {
    var self = this;

    this.current = ko.observable();
    this.configuration = {};

    this.locationFinders = [];

    this.locationFinders.push(function(currentLocation, callback) {
        var path;

        if (!currentLocation) {
            path = window.location.pathname;
        } else {
            path = currentLocation;
        }

        for (var locationName in self.configuration) {
            var location = self.configuration[locationName];

            var exp = RegExp(location.config);

            if (path.match(exp)) {
                callback(location);
            }
        }
    });

    function RoutingConfig() {
        // Self
        var routingConfig = this;

        // Router Configuration
        routingConfig.configuration = {};

        // Location's name
        var currentLocationName;

        // Adds a location to the route. The routes applied to it using the .when method are parsed if the location.pathname
        // matches the specified pattern
        this.on = function(name, config) {
            if (!$$.isDefined(name)) {
                throw 'Must define a name for the routes on the page.';
            }

            // Initialize the location configuration
            routingConfig.configuration[name] = {
                config: config,
                routes: {}
            };

            // Sets the current location and current so it can be used by the .when method in chained calls.
            currentLocationName = name;

            // Returns itself so config methods are chainable.
            return routingConfig;
        }

        // Adds a route to the last location specified with .on. The hash is a pattern to match on the hash, the
        // name parameter is the name of the route, and the components parameter is an object with each property being the name of a placeholder
        // and it's value the component that must be binded on it.
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

            // Forms full name (location name/route name)
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

    function Route(router, name, fullName, locationConfig, hash, components, controller) {
        var routeObject = this;

        // Add route in crossroad
        var csRoute = router.addRoute(hash, function(requestParams) {
            // If the current route has a controller defined and the controller has a leaving method call it to allow
            // controller cleanup, if controller result is false do not reroute
            if (self.current() && self.current().controller && self.current().controller.leaving) {
                if (self.current().controller.leaving() === false) {
                    return;
                }
            }

            // Changes route setting the specified controller
            function changeCurrent(routeController) {
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
                // invoke the callback passed as firt parameter
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

    // Configure routing system using the specified routing config (created by using $$.routes)
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

            if (!dest.config) {
                dest.config = location.config;
            }

            // For each hash configured for this location
            for (var routeName in location.routes) {
                // If the routeName is not the generic one, load the configuration (generic config is apllied to each detailed route)
                if (routeName !== '') {
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

                    // Save it on the location routes
                    dest.routes[routeName] = newRoute;
                }
            }
        }
    }



    // Parses the specified route and location changing the current route
    this.parse = function(location, hash) {
        // If only one parameter is specified we assume that is the hash, and the location must be taken from the
        // window location object.
        if (!$$.isDefined(hash)) {
            hash = location;
            location = undefined;
        }

        var found = false;

        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            finder(location, function(locationConfig) {
                found = true;
                locationConfig.router.parse(hash);
            });

            if (found) return;
        }
    }

    this.getRoute = function(name) {
        var location = name.substr(0, name.indexOf('/'));
        var routeName = name.substr(name.indexOf('/') + 1);

        if (!routeName) {
            throw new 'You must specifiy route name in the form location/routeName.';
        }

        if (!self.configuration[location]) {
            console.warn('The location specified as ' + name + ' was not found in the routing configuration.');
        } else {
            if (!self.configuration[location]['routes'][routeName]) {
                console.warn('The route name specified as ' + name + ' was not found in the routing configuration for the ' + location + ' location.');
            }
        }

        if (self.configuration[location] && self.configuration[location]['routes'][routeName]) {
            return self.configuration[location]['routes'][routeName];
        }
    }

    this.hash = function(name, config) {
        var route = self.getRoute(name);

        if (route) {
            return route.interpolate(config);
        }
    }

    this.listLocation = function(location) {
        var locations = [];

        for (var index in self.locationFinders) {
            var finder = self.locationFinders[index];

            finder(location, function(locationConfig) {
                locations.push(locationConfig.routes);
            });
        }

        return locations;
    }

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

    this.routed = new signals.Signal();
}

$$.routing = new QuarkRouter();

$$.controller = {};

var controllerUpdater = ko.computed(function() {
    var current = $$.routing.current();

    if (current && current.controller) {
        $$.controller = current.controller;
    }
});

// Redirect the browser to the specified url
$$.redirect = function(url) {
    window.location.href = url;
    return true;
}

// Redirect the browser to the specified route
$$.redirectRoute = function(name, config, location) {
    var link = $$.routing.link(name, config, location);
    $$.redirect(link);
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


// Blocks user input for the specified target showing a message. If no target specified blocks entire screen
$$.block = function (message, target) {
    if (!message)
        message = 'Loading...';

    var options = {
        message: message,
        css: {
            border: 'none',
            padding: '5px',
            backgroundColor: '#000',
            '-webkit-border-radius': '5px',
            '-moz-border-radius': '5px',
            opacity: .7,
            color: '#fff'
        },
        baseZ: 5000
    }

    if (target) {
        $(target).block(options);
    } else {
        $.blockUI(options);
    }
}

// Unblock user input from the specified target (JQuery Selector)
$$.unblock = function (target) {
    if (target) {
        $(target).unblock();
    } else {
        $.unblockUI();
    }
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

// Executes ajax call to the specified url
$$.ajax = function (url, method, data, callbacks, auth, options) {
    var opts = options || {};
    var clbks = callbacks || {};

    if (!url) {
        throw 'Must specify the target URL';
    }

    // If headers not defined send empty
    if (!$$.isDefined(opts.headers)) {
        opts.headers = {};
    }

    // If auth is required send the access token saved on session storage
    if (auth) {
        opts.headers['access_token'] = sessionStorage.getItem('token');
    }

    var onSuccess;

    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    var ajaxOptions = {
        url: url,
        type: method || 'GET',
        cache: opts.cache || false,
        data: data,
        async: opts.async || true,
        success: onSuccess,
        headers: opts.headers || {},
        complete: function() {
            if ($$.isDefined(clbks.onComplete)) {
                clbks.onComplete();
            }
        },
        contentType: 'application/json',
        dataType : 'json',
        xhrFields: {
            withCredentials: true
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
                        if ($$.serverErrorHandlers[handlerName](url, JSON.parse(jqXHR.responseText))) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                } else {
                    // If it's a client error
                    for (handlerName in $$.clientErrorHandlers) {
                        // Call all handlers in registration order until someone handles it (must return true)
                        if ($$.clientErrorHandlers[handlerName](url, jqXHR, textStatus, errorThrown)) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    $.ajax(ajaxOptions);
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

ko.tryBlock = function(observable, message) {
    if (observable.block) {
        observable.block(message);
    }
}

ko.tryUnblock = function(observable) {
    if (observable.unblock) {
        observable.unblock();
    }
}

ko.extenders.blockable = function(target, defaultMessage) {
    target.blocked = ko.observable('');

    target.block = function(message) {
        var msg = message || defaultMessage;
        target.blocked(msg);
    }

    target.unblock = function() {
        target.blocked('');
    }

    //return the original observable
    return target;
};

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

function block(element, value) {
    if (value) {
        $$.block(value, $(element));
    } else {
        $$.unblock($(element));
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.block = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        block(element, value);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        block(element, value);
    }
}

function blockWithError(element, value, style) {
    if (value.length) {
        $(element).block({
            message: 'Error',
            overlayCSS: {
                backgroundColor: '#A94442',
                opacity: 0.5,
            },
            css: {
                border: 'none',
                padding: '5px',
                backgroundColor: '#000',
                '-webkit-border-radius': '5px',
                '-moz-border-radius': '5px',
                backgroundColor: '#A94442',
                opacity: 1,
                color: '#fff'
            },
            baseZ: 900
        });
    } else {
        $(element).unblock();
    }
}

function blockWithWarning(element, value, style) {
    if (value.length) {
        $(element).block({
            message: 'Hay problemas con este elemento.',
            overlayCSS: {
                backgroundColor: '#FCF8E3',
                opacity: 0.4,
            },
            css: {
                border: 'none',
                padding: '5px',
                backgroundColor: '#000',
                '-webkit-border-radius': '5px',
                '-moz-border-radius': '5px',
                backgroundColor: '#FCF8E3',
                opacity: 1,
                color: '#000'
            },
            baseZ: 900
        });
    } else {
        $(element).unblock();
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var handler = viewModel.errorHandler;
        var value = handler.getByLevel(2000, 9999);

        function validate(value) {
            if ($$.isArray(value)) {
                blockWithError(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnWarning = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var handler = viewModel.errorHandler;
        var value = handler.getByLevel(1000, 9999);

        function validate(value) {
            if ($$.isArray(value)) {
                var hasWarning = false;

                for (var index in value) {
                    var error = value[index];

                    if (error.level > 2000) {
                        blockWithError(element, value);
                        return;
                    }

                    if (error.level >= 1000 && error.level < 2000) {
                        hasWarning = true;
                    }
                }

                blockWithWarning(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

// Applies the success style to the element if the specified condition is met. Useful highlight the selected row on a table:
// <div data-bind="rowSelect: id == $parent.idSeleccionado">
ko.bindingHandlers.rowSelect = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var options = ko.unwrap(valueAccessor());

        var selectedValueAccessor = function () {
            if ($$.isFunction(options.isSelected)) {
                return { success: options.isSelected(viewModel) };
            } else {
                return { success: options.isSelected };
            }

        };

        ko.bindingHandlers.css.update(element, selectedValueAccessor, allBindingsAccessor, viewModel, context);

        var clickValueAccessor = function () {
            return options.select;
        };

        ko.bindingHandlers.click.init(element, clickValueAccessor, allBindingsAccessor, viewModel, context);
    }
};

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnErrorCondition = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var condition = ko.unwrap(valueAccessor);
        var handler = viewModel.errorHandler;
        var value = handler.getBy(condition);

        function validate(value) {
            if ($$.isArray(value)) {
                blockWithError(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

// Uses accounting js to show a numeric input
ko.bindingHandlers.numericValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
}

ko.bindingHandlers.moneyValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
}


// Uses accounting js to show a numeric input
ko.bindingHandlers.numericText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

// Uses accounting js to show a numeric input
ko.bindingHandlers.numericText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

ko.bindingHandlers.moneyText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

// Uses accounting js to show a numeric input
ko.bindingHandlers.numericText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

ko.bindingHandlers.format = {
    init: function (element, valueAccessor) {
        var config = valueAccessor();

        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter())) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}
// Initialize validators array
ko.validators = {};

// Validates the observables in the specified object. It can subscribe to the observables so it revalidates each field on change.
ko.validate = function(object, subscribe) {
    var result = true;

    for (var propertyName in object) {
        var property = object[propertyName];

        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Valida el observable pasandole si debe subscribir
                if (!property.validate(subscribe)) {
                    result = false;
                }
            }
        }
    }

    return result;
}

ko.unsubscribeValidation = function(object) {
    for (var propertyName in object) {
        var property = object[propertyName];

        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Valida el observable pasandole si debe subscribir
                if (property.validationSubscription) {
                    property.validationSubscription.dispose();
                    delete property.validationSubscription;
                }
            }
        }
    }
}

// Resets error on all the observables of the object
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
    // Indica que el campo es validable, y el nombre con el cual debe aparecer en los mensajes
    this.validatable = name;

    // Carga la configuracion de validacion
    this.validationConfig = {};
    this.validationConfig = validationConfig;

    // Extiende el observable con observables que indican si el observable tiene error
    // y el mensaje
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // Si se especifico un errorHandler
    if (errorHandler) {
        this.errorHandler = errorHandler;
    }

    // Devuelve el propio observable, permitiendo encadenar la llamada en la misma llamada a ko.observable
    return this;
}

// Resets validation errors on the observable and clears itself from the objects errorHandler
ko.observable.fn.validationReset = function () {
    var me = this;
    // Si se configuraron validaciones sobre este observable
    if (this['validatable']) {
        // Saca el flag de error y limpia el mensaje
        this.hasError(false);
        this.validationMessage('');

        // Si ademas se definio un errorHandler y se cargo un error lo resuelvo utilizando la clave almacenada
        if (this.errorHandler && this.errorKey) {
            this.errorHandler.resolve(this.errorKey);
        }
    }
}

// Performs the actual validation on the observable. Its on a separate function to allow subscription
function validateValue(newValue, target) {
    if (!target) {
        target = this;
    }

    // Resetea las validaciones del observable
    target.validationReset();

    // Recorro las configuraciones de validacion del observable
    for (var name in target.validationConfig) {
        // Obtengo la configuracion del validador
        var config = target.validationConfig[name];

        // Si hay un validador configurado con el nombre especificado
        if (ko.validators[name]) {
            // Obtengo el validador ;) pasandole el observable y la configuracion
            var validator = ko.validators[name](target, config);

            // Valido utilizando el valor obtenido y el valor pasado a la funcion
            if (!validator.validate(newValue)) {
                if (target.errorHandler) {
                    target.errorKey = target.errorHandler.add(target.validationMessage(), { level: 100, type: 'validation' });
                }

                return false;
            }
        }
    }

    return true;
};

// Validates the observable using the defined rules. Subscribe indicates if the validators must subscribe to the observable
// to reevaluate on change.
ko.observable.fn.validate = function (subscribe) {
    // Si se debe subscribir y no hay una subscripcion previa
    if (subscribe && !this['validationSubscription']) {
        this.validationSubscription = this.subscribe(validateValue, this);
    }

    return validateValue(this(), this);
}

// Sets the form group error class if the specified observable or array of observables has error.
function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
    var value = valueAccessor();
    var hasError = false;

    if ($$.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            if (!value[i].hasError()) {
                hasError = true;
            }
        }
    } else {
        hasError = value.hasError();
    }

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

ko.bindingHandlers.fieldError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        ko.bindingHandlers.text.init(element, textAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        var visibleAccessor = function() {
            return valueAccessor().hasError;
        }

        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

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

