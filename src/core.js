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

        // If theres a viewModel defined
        if (viewModel && !model) {
            // Creates the model passing parameters and empty scope
            model = new viewModel(p, $scope);
            $scope.model = model;
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
