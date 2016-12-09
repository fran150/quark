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

    // Config the given components in the specified namespace
    function configNamespace(namespace, components) {
        // Iterate each specified component
        for (var name in components) {
            var item = components[name];

            // Construct the component's full name
            var fullName;

            if (name) {
                fullName = namespace + '-' + name;
            } else {
                fullName = namespace;
            }

            // If the specified component value is a string register as component
            // if not assume its another namespace and call this function
            // recursively
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
            $$.routing.pages(config.pages, config.params);
        } else {
            $$.routing.pages(config.pages);
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

        // Creates an empty imports object
        var $imports = new Tracker();

        // If theres a model defined
        if (viewModel && !model) {
            // Creates the model passing the received parameters an empty scope and the
            // tracker object
            model = new viewModel(p, $scope, $imports);

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

            if (model && model.ready) {

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
                                throw new Error('The parameter ' + name + ' must be a callback.');
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
