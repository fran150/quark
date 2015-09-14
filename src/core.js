// Loaded behaviours array
var behaviours = {};

// Loads a behaviour with the specified name
$$.behaviour = function(name, behaviour) {
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

        if (!$$.isDefined(object.behaviours)) {
            object.behaviours = {};
        }

        object.behaviours[behaviourName] = true;
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
    if ($$.isDefined(object.behaviours)) {
        if ($$.isDefined(object.behaviours[behaviourName])) {
            return true;
        }
    }

    return false;
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
        // Creates empty scope
        var $scope = {};

        // If theres a viewModel defined
        if (viewModel && !model) {
            // Creates the model passing parameters and empty scope
            model = new viewModel(p, $scope);
        }

        // Creates model and scope getters to allow quark to bind to each part
        this.getModel = function() { return model; }
        this.getScope = function() { return $scope; }

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
        }
    }

    if (viewModel) {
        return { template: view, viewModel: Model }
    } else {
        return { template: view }
    }
}

// Receive configuration params extacting the value if neccesary.
$$.config = function(config, values, object) {
    // Checks the configuration object
    if (!$$.isObject(config)) {
        throw 'You must specify a config object';
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
    }

    if (!$$.isDefined(object)) {
        throw 'You must specify the viewmodel of the component in wich to load the configuration.';
    }

    // Check object's config object and if not exists creates it.
    if (!$$.isDefined(object['config'])) {
        object.config = {};
    }

    // Iterates configuration...
    for (var name in config) {
        // Warn if config exists
        if (!$$.isDefined(object.config[name])) {
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

// Receive parameters from the component tag and set them into the viewmodel
$$.parameters = function(params, values, object) {
    // Checks the parameters configuration object
    if (!$$.isObject(params)) {
        throw 'You must specify a parameters config object';
    }

    // Checks the values object
    if (!$$.isObject(values)) {
        throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
    }

    if (!$$.isDefined(object)) {
        throw 'You must specify the viewmodel of the component in wich to load the parameters.';
    }

    // Iterate the parameters
    for (var name in params) {
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
                    $$.inject(to[name](), value);
                } else {
                    to[name](value);
                }
            } else {
                if (recursively && $$.isObject(to[name])) {
                    $$.inject(to[name], value);
                } else {
                    to[name] = value;
                }
            }
        }
    }
}
