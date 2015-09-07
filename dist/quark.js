(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define('quark', ['knockout', 'jquery', 'knockout-mapping', 'accounting-js', 'blockui'], factory);
  } else {
    // Browser globals.
    root.komapping = ko.mapping;
    root.$$ = factory(root.ko, root.$, root.komapping, root.accounting);
  }
}(this, function(ko, $, komapping, accounting) {

    define('modules/utils',['jquery', 'knockout-mapping'], function($, komapping) {

    function Utils() {
        var self = this;

        // Check if the specified var is a string
        this.isString = function (variable) {
            if (typeof variable === 'string' || variable instanceof String) {
                return true;
            }

            return false;
        };

        // Check if the specified var is defined
        this.isDefined = function (variable) {
            if (typeof variable === 'undefined') {
                return false;
            };

            return true;
        };

        // Check if the sepcified var is an integer
        this.isInt = function (variable) {
            return Number(variable) === variable && variable % 1 === 0;
        };

        // Check if the specified var is a number
        this.isNumeric = function (variable) {
            return variable === Number(variable) && variable % 1 !== 0;
        };

        // Check if the specified var is an array
        this.isArray = function (variable) {
            return $.isArray(variable);
        };

        // Check if the specified var is an object
        this.isObject = function (variable) {
            if (variable !== null && typeof variable === 'object') {
                return true;
            }

            return false;
        };

        // Check if the specified var is a function
        this.isFunction = function (variable) {
            if (variable !== null && typeof variable === 'function') {
                return true;
            }

            return false;
        };

        // Check if the specified var is a date
        this.isDate = function(variable) {
            if (variable instanceof Date) {
                return true;
            }

            return false;
        }

        // Check if the specified var is a valid date
        this.isValidDate = function (variable) {
            if (!self.isDate(variable)) {
                return false;
            }

            if (isNaN(variable.getTime())) {
                return false;
            }

            return true;
        };

        // Clone the specified object
        this.clone = function(source) {
            if (self.isObject(source)) {
                return $.extend(true, {}, source);
            } else {
                throw new 'You must specify a valid object to clone';
            }
        };

        // Clone the specified object to an observable object. An observable object is an object in wich all its properties are
        // observable, you can create one using komapping.fromJS.
        this.cloneObservable = function(source) {
            return komapping.fromJS(komapping.toJS(source));
        };

        // Check if the function (callback) is defined, and if it is calls it with the parameters passed.
        // ie.: call('onClick', 'hello', 'world', 3). will call the function onClick('hello', 'world' 3);
        this.call = function (callback) {
            if (self.isDefined(callback)) {
                var args = Array.prototype.slice.call(arguments, 1);
                return callback.apply(args);
            }

            return true;
        }

        // Force a value to be a date. If it's not a date try to create one with it, if it results in an invalid
        // date it returns undefined or the default date if the second parameter is true
        this.makeDate = function (value, useToday) {
            if (!self.isDate(value)) {
                value = new Date(value);
            }

            if (!self.isValidDate(value)) {
                if (!useToday) {
                    value = new Date();
                } else {
                    return undefined;
                }
            }

            return value;
        }
    }

    return new Utils();
});

define('modules/knockout-extensions',['knockout', 'knockout-mapping'], function(ko, komapping) {

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

    // Transform the model into an observable object using knockout-mapping
    ko.getJson = function (model) {
        var unmapped = komapping.toJS(model);

        for (var i in unmapped) {
            if (unmapped[i] === null || unmapped[i] === undefined) {
                delete unmapped[i];
            }
            else if (typeof unmapped[i] === "object") {
                ko.getJson(unmapped[i]);
            }
        }

        var result = komapping.toJSON(unmapped);

        result = result.replace(/\/Date\(\d+\)/g, function (a) { return '\\' + a + '\\'; });

        return result;
    }

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

    return ko;
});

define('ko-quark',['knockout', 'jquery', 'modules/utils', 'modules/knockout-extensions'], function(ko, $, utils) {

    ko.bindingProvider.instance.preprocessNode = function (node) {
        var testAndReplace = function(regExp) {
            var match = node.nodeValue.match(regExp);
            if (match) {
                // Create a pair of comments to replace the single comment
                var c1 = document.createComment("ko " + match[1]),
                    c2 = document.createComment("/ko");
                node.parentNode.insertBefore(c1, node);
                node.parentNode.replaceChild(c2, node);

                // Tell Knockout about the new nodes so that it can apply bindings to them
                return [c1, c2];
            } else {
                return false;
            }
        };

        // Only react if this is a comment node of the form <!-- vm: ... -->
        if (node.nodeType === 8) {
            var nodes;
            nodes = testAndReplace(/^\s*(vm\s*:[\s\S]+)/);
            nodes = !nodes ? testAndReplace(/^\s*(call\s*:[\s\S]+)/) : nodes;
            nodes = !nodes ? testAndReplace(/^\s*(inject\s*:[\s\S]+)/) : nodes;

            return nodes;
        }
    }

    // Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
    ko.bindingHandlers.onBind = {
        init: function (element, valueAccessor, allBindings, viewModel, context) {
            var value = ko.unwrap(valueAccessor());
            value(element, viewModel, context);
        }
    }

    ko.bindingHandlers.vm = {
        init: function (element, valueAccessor, allBindings, viewModel, context) {
            var value;
            value = ko.unwrap(valueAccessor());

            var property;

            if (!utils.isString(value)) {
                if (utils.isObject(value)) {
                    if (utils.isString(value['property'])) {
                        property = value['property'];
                    }

                    if (utils.isDefined(value['model'])) {
                        viewModel = value['model'];
                    }
                }
            } else {
                property = value;
            }

            if (utils.isString(property)) {
                if (utils.isDefined(viewModel['childs'])) {
                    if (utils.isDefined(viewModel['childs'][property])) {
                        viewModel['childs'][property]['load'](property, context.$child);
                    } else {
                        throw 'El objeto especificado no tiene una propiedad de nombre ' + value + '. Verifique que el objeto contenga una propiedad definida con el metodo .components a la que apunta este binding vm.';
                    }
                } else {
                    throw 'El objeto especificado no tiene la propiedad childs. Esto probablemente se deba a que no uso la funcion .components de quark para definir las propiedades en donde el binding vm debe asignar el viewmodel';
                }
            } else {
                throw 'El valor del binding vm debe ser un string con el nombre de la propiedad del objeto donde se debe cargar el viewmodel del componente anidado';
            }
        }
    }
    ko.virtualElements.allowedBindings.vm = true;


    function callBinding(valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        value();
    }

    ko.bindingHandlers.call = {
        init: function (element, valueAccessor, allBindings, viewModel, context) {
            callBinding(valueAccessor);
        },
        update: function (element, valueAccessor, allBindings, viewModel, context) {
            callBinding(valueAccessor);
        }
    }
    ko.virtualElements.allowedBindings.call = true;


    function injectBinding(valueAccessor, viewModel, context) {
        var value = ko.unwrap(valueAccessor());

        var target = context.$child;
        var data = value;

        if (utils.isObject(value)) {
            if (utils.isDefined(value['data']) && utils.isDefined(value['target'])) {
                target = value.target;
                data = value.data;
            }
        }

        utils.inject(data, target);
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

    function createComponentShadyDomAccesor(context) {
        var newAccesor = function () {
            return { nodes: context.$componentTemplateNodes };
        };

        return newAccesor;
    }

    ko.bindingHandlers.componentShadyDom = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            var newAccesor = createComponentShadyDomAccesor(context);
            return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, context.$parentContext);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            var newAccesor = createComponentShadyDomAccesor(context);
            return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, context.$parentContext);
        }
    };
    ko.virtualElements.allowedBindings.componentShadyDom = true;


    function createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = function () {
            var nodes = Array();

            for (var i = 0; i < context.$parentContext.$componentTemplateNodes.length; i++) {
                var node = context.$parentContext.$componentTemplateNodes[i];
                if (node.nodeType === 8) {
                    var match = node.nodeValue.indexOf("vm:") > -1;
                    if (match) {
                        nodes.push(node);
                    }
                    match = node.nodeValue.indexOf("call:") > -1;
                    if (match) {
                        nodes.push(node);
                    }
                    match = node.nodeValue.indexOf("inject:") > -1;
                    if (match) {
                        nodes.push(node);
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
            var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent, $childContext: context });
            return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            var newAccesor = createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
            var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent, $childContext: context });
            return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
        }
    };
    ko.virtualElements.allowedBindings.modelExporter = true;

    function createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        var newAccesor = function () {
            if (!utils.isInt(value)) {
                return { nodes: $(context.$componentTemplateNodes).filter(value) };
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

    return ko;
});
define('quark',['knockout', 'jquery', 'modules/utils', 'ko-quark'], function(ko, $, utils) {
    var self = utils;

    // Loaded behaviours array
    utils.behaviours = {};

    // Loads a behaviour with the specified name
    utils.behaviour = function(name, behaviour) {
        // Warn if repeated
        if (self.behaviour[name]) {
            console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
        }

        // Error if behaviour name is not a string
        if (!self.isString(name)) {
            throw 'The behaviour name must be an string.';
        }

        // Error if behaviour is not a function
        if (!self.isFunction(behaviour)) {
            throw 'The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.';
        }

        // Adds the new behaviour to the table
        self.behaviours[name] = behaviour;
    }

    // Applies a behaviour to the object
    function applyBehaviour(object, behaviourName) {
        // Error if behaviour name is not a string
        if (!self.isString(behaviourName)) {
            throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
        }

        // Chek if behaviour exists
        if (self.behaviours[behaviourName]) {
            // Apply new behaviour
            self.behaviours[behaviourName](object);
        } else {
            throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
        }
    }

    // Applies the behaviour to the object. You can specify a string with the name of a loaded behaviour
    // or an array of behaviour names.
    utils.behave = function(object, behaviour) {
        // Validates object
        if (!self.isObject(object)) {
            throw 'You must specifify a valid object to apply the behaviour.';
        }

        if (self.isArray(behaviour)) {
            // If it's an array we iterate it applying each behaviour
            for (var i = 0; i < behaviour.length; i++) {
                applyBehaviour(object, behaviour[i]);
            }
        } else if (self.isString(behaviour)) {
            // If it's a string apply the named behaviour
            applyBehaviour(object, behaviour);
        } else {
            // Everything else fails
            throw 'The behaviour name must be an string or an array of strings.';
        }
    }

    // Receive configuration params extacting the value if neccesary.
    utils.config = function(config, values, object) {
        // Checks the configuration object
        if (!self.isObject(config)) {
            throw 'You must specify a config object';
        }

        // Checks the values object
        if (!self.isObject(values)) {
            throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
        }

        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the configuration.';
        }

        // Check object's config object and if not exists creates it.
        if (!self.isDefined(object['config'])) {
            object.config = {};
        }

        // Iterates configuration...
        for (var name in config) {
            // Warn if config exists
            if (!self.isDefined(object.config[name])) {
                console.warn('There is already a config property named ' + name + ' in the target component. The property will be replaced.');
            }

            // Sets the new config property with the default value to the target component
            object.config[name] = config[name];

            // Warn if property is defined as observable
            if (ko.isObservable(object.config[name])) {
                console.warn('Property ' + name + ' should not be observable. The configuration parameters should be static, if you want the object to react to parameter changes use the parameters method.');
            }

            // If there is a value for the configuration then replace it in the configuration property
            if (self.isDefined(values[name])) {
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
    utils.parameters = function(params, values, object) {
        // Checks the parameters configuration object
        if (!self.isObject(params)) {
            throw 'You must specify a parameters config object';
        }

        // Checks the values object
        if (!self.isObject(values)) {
            throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
        }

        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the parameters.';
        }

        // Iterate the parameters
        for (var name in params) {
            // Warn if config exists
            if (!self.isDefined(object[name])) {
                console.warn('There is already a property named ' + name + ' in the target component. It will be replaced with the specified parameter.');
            }

            // Create an object property with the parameter
            object[name] = params[name];

            // If there is a value defined in the component tag for the parameter
            if (self.isDefined(values[name])) {
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
                    if (!self.isFunction(object[name])) {
                        object[name] = values[name];
                    } else {
                        // If the parameter should be a callback and the target is a function then replace it.
                        if (self.isFunction(values[name])) {
                            object[name] = values[name];
                        } else {
                            // Err if not's a callback
                            if (self.isDefined(values[name])) {
                                throw 'The parameter ' + name + ' must be a callback.';
                            }
                        }
                    }
                }
            }
        }
    }

    // Define child components, used in conjunction with the vm binding, it obtains the childs viewmodels
    // and waits for them to be fully binded, then it invokes the callback or the object's ready function if defined.
    utils.components = function(childs, object, callback) {
        // Checks the childs definition object
        if (!self.isObject(childs)) {
            throw 'You must specify a childs config object';
        }

        // Checks the target object
        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the child viewmodels.';
        }

        // Check if there is a 'childs' property on the component
        if (self.isDefined(object['_tracking'])) {
            console.warn('The object already contains a property _tracking, it will be replaced by the tracking array');
        }

        // Sets the childs array wich tracks the dependencies and state
        object.tracking = {
            childs: {}
        }

        // For each expected dependency..
        for (var name in childs) {
            // Start tracking the dependency
            object.tracking.childs[name] = {};

            // Define a function to call when the child finishes loading.
            // PropertyName contains the child name, and vm the corresponding viewmodel
            object.tracking.childs[name]['load'] = function(propertyName, vm) {
                // Sets the child viemodel and marks it as loaded
                if (ko.isObservable(object[propertyName])) {
                    object[propertyName](vm);
                } else {
                    object[propertyName] = vm;
                }
                object.tracking.childs[propertyName]['loaded'] = true;

                if (self.isDefined(vm.tracking)) {
                    // If the child has dependencies mark the dependency as not ready and save
                    // the parent data (reference and state)
                    object.tracking.childs[propertyName]['ready'] = false;

                    vm.tracking.parent = object;
                    vm.tracking.parentState = object.tracking.childs[propertyName];
                } else {
                    // If the child hasn't dependencies mark the dependency on parent as ready
                    object.tracking.childs[propertyName]['ready'] = true;

                    // If there's a ready function on the child invoke it
                    if (self.isDefined(vm['ready'])) {
                        vm['ready']();
                    }
                }

                // If any property in the child is not loaded then exit
                // !! OPTIMIZE !! by using a counter and not iterating all array over and over
                for (var property in childs) {
                    if (!object.tracking.childs[property]['loaded']) {
                        return;
                    }
                }

                // If any property in the child is not ready then exit
                // !! OPTIMIZE !! by using a counter and not iterating all array over and over
                for (var property in childs) {
                    if (!object.tracking.childs[property]['ready']) {
                        return;
                    }
                }

                // If utils point is reached then all dependencies are loaded and ready.
                // So, invoke the callback (if it's defined)
                if (self.isDefined(callback)) {
                    callback();
                }

                // And the ready method...
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }

                // Finally if the object is tracked and has a parent, mark itself as ready on the parent
                // object and call the function on the parent to reevaluate readiness.
                if (self.isDefined(object['tracking']) && self.isDefined(object.tracking['parent'])) {
                    object.tracking.parentState['ready'] = true;
                    object.tracking.parent.childReady();
                }
            }

            // Initialize the tracking of the child component
            object.tracking.childs[name]['loaded'] = false;

            // Defines a function to call when one of its childs is ready.
            // It forces the object to reevaluate its readiness
            object.tracking.childReady = function() {
                // If there is a child that is not ready the exits
                for (var property in childs) {
                    if (!object.tracking.childs[property]['ready']) {
                        return;
                    }
                }

                // At utils point, all childs are ready, therefore the object itself is ready
                // So, invoke the callback (if it's defined)
                if (self.isDefined(callback)) {
                    callback();
                }

                // And the ready method...
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }

                // Finally if the object is tracked and has a parent, mark itself as ready on the parent
                // object and call the function on the parent to reevaluate readiness.
                if (self.isDefined(object['parent'])) {
                    object.traking.parentState['ready'] = true;
                    object.tracking.parent.childReady();
                }
            }

            // Import the dependency to the target object
            object[name] = childs[name];
        }
    }

    // Copies one object into other. If recursively is false or not specified it copies all properties in the "to" object
    // that exists in "from" object, if recursively is true does the same with each property (copying object graphs)
    utils.inject = function (from, to, recursively) {
        if (!self.isDefined(from)) {
            return;
        }

        if (!self.isDefined(to)) {
            return;
        }

        for (var name in from) {
            if (self.isDefined(to[name])) {
                var value;

                if (ko.isObservable(from[name])) {
                    value = from[name]();
                } else {
                    value = from[name];
                }

                if (ko.isObservable(to[name])) {
                    if (recursively && self.isObject(to[name]())) {
                        self.inject(to[name](), value);
                    } else {
                        to[name](value);
                    }
                } else {
                    if (recursively && self.isObject(to[name])) {
                        self.inject(to[name], value);
                    } else {
                        to[name] = value;
                    }
                }
            }
        }
    }

    return utils;
});

        if (typeof define === 'function' && define.amd) {
      define('knockout', function() {
        return ko;
      });

    }

}));


require.config({
  "bundles": {}
});
