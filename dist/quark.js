(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['knockout', 'jquery', 'knockout-mapping', 'accounting-js', 'blockui'], factory);
    } else {
        // Browser globals.
        root.komapping = ko.mapping;
        root.$$ = factory(root.ko, root.$, root.komapping, root.accounting);
    }
}(this, function(ko, $, komapping, accounting) {
var $$ = {};

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
        if (!$$.isDefined(object[name])) {
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

// Define child components, used in conjunction with the vm binding, it obtains the childs viewmodels
// and waits for them to be fully binded, then it invokes the callback or the object's ready function if defined.
$$.components = function(childs, object, callback) {
    // Checks the childs definition object
    if (!$$.isObject(childs)) {
        throw 'You must specify a childs config object';
    }

    // Checks the target object
    if (!$$.isDefined(object)) {
        throw 'You must specify the viewmodel of the component in wich to load the child viewmodels.';
    }

    // Check if there is a 'childs' property on the component
    if ($$.isDefined(object['_tracking'])) {
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

            if ($$.isDefined(vm.tracking)) {
                // If the child has dependencies mark the dependency as not ready and save
                // the parent data (reference and state)
                object.tracking.childs[propertyName]['ready'] = false;

                vm.tracking.parent = object;
                vm.tracking.parentState = object.tracking.childs[propertyName];
            } else {
                // If the child hasn't dependencies mark the dependency on parent as ready
                object.tracking.childs[propertyName]['ready'] = true;

                // If there's a ready function on the child invoke it
                if ($$.isDefined(vm['ready'])) {
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

            // If this point is reached then all dependencies are loaded and ready.
            // So, invoke the callback (if it's defined)
            if ($$.isDefined(callback)) {
                callback();
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object['tracking']) && $$.isDefined(object.tracking['parent'])) {
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

            // At this point, all childs are ready, therefore the object itself is ready
            // So, invoke the callback (if it's defined)
            if ($$.isDefined(callback)) {
                callback();
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object['parent'])) {
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
            if ($$.isDefined(viewModel['tracking'])) {
                if ($$.isDefined(viewModel.tracking['childs'])) {
                    if ($$.isDefined(viewModel.tracking.childs[property])) {
                        viewModel.tracking.childs[property]['load'](property, context.$child);
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

    if ($$.isObject(value)) {
        if ($$.isDefined(value['data']) && $$.isDefined(value['target'])) {
            target = value.target;
            data = value.data;
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
        if (!$$.isInt(value)) {
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

// Redirect the browser to the specified url
$$.redirect = function(url) {
    window.location.href = url;
    return true;
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


// Adds client error handlers repository
$$.clientErrorHandlers = {};
// Adds server error handlers repository
$$.serverErrorHandlers = {};

// Executes ajax call to the specified url
$$.ajax = function (target, method, data, callbacks, options) {
    var opts = options || {};
    var clbks = callbacks || {};

    if (!target) {
        throw 'Must specify the target URL';
    }

    // If headers not defined send empty
    if (!$$.isDefined(opts.headers)) {
        opts.headers = {};
    }

    // If auth is required send the access token saved on session storage
    if (opts.auth) {
        opts.headers = {
            access_token: sessionStorage.getItem('token')
        };
    }

    var onSuccess;

    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    $.ajax({
        url: target,
        type: opts.method || 'GET',
        cache: opts.cache || false,
        data: data,
        async: opts.async || true,
        success: onSuccess,
        headers: opts.headers || {},
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
                        if ($$.serverErrorHandlers[handlerName](target, JSON.parse(jqXHR.responseText))) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                } else {
                    // If it's a client error
                    for (handlerName in $$.clientErrorHandlers) {
                        // Call all handlers in registration order until someone handles it (must return true)
                        if ($$.clientErrorHandlers[handlerName](target, jqXHR, textStatus, errorThrown)) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                }
            }
        }
    });
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

function clearFields(unmapped) {
    for (var i in unmapped) {
        if (unmapped[i] === null || unmapped[i] === undefined) {
            delete unmapped[i];
        }
        else if (typeof unmapped[i] === "object") {
            clearFields(unmapped[i]);
        }
    }

    return unmapped;
}

// Transform the model into JSON using knockout-mapping, if a field is null or undefined it deletes it.
ko.getJson = function (model) {
    var unmapped = komapping.toJS(model);

    unmapped = clearFields(unmapped);

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

// Uses accounting js to show a numeric input
ko.bindingHandlers.numericValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

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
// Name is the field name to show on error messages. Validation config is an object with the configuration of validations to enfoce, parent
// is the parent object in wich the observable resides, if specified it creates a property 'validationSummary' with an array showing the
// list of validation errors in the object.
ko.observable.fn.validation = function(name, validationConfig, parent) {
    // Indica que el campo es validable, y el nombre con el cual debe aparecer en los mensajes
    this.validatable = name;

    // Carga la configuracion de validacion
    this.validationConfig = {};
    this.validationConfig = validationConfig;

    // Extiende el observable con observables que indican si el observable tiene error
    // y el mensaje
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // Si se especifico un objeto padre crea una propiedad para guardarlo
    if (parent) {
        this.parent = parent;

        // Si el objeto padre no tiene un sumario de validaciones crea uno que es un
        // array observable que un elemento por cada error de validacion
        if (!parent['validationSummary']) {
            parent.validationSummary = ko.observableArray();
        }
    }

    // Devuelve el propio observable, permitiendo encadenar la llamada en la misma llamada a ko.observable
    return this;
}

// Resets validation errors on the observable and clears itself from the objects validation summary
ko.observable.fn.validationReset = function () {
    var me = this;
    // Si se configuraron validaciones sobre este observable
    if (this['validatable']) {
        // Saca el flag de error y limpia el mensaje
        this.hasError(false);
        this.validationMessage('');

        // Si ademas se definio el objeto padre elimina el error del sumario de errores
        if (this['parent']) {
            this.parent.validationSummary.remove(function (item) {
                return item.name === me.validatable;
            });
        }
    }
}

// Performs the actual validation on the observable. Its on a separate function
function validateValue(newValue) {
    // Resetea las validaciones del observable
    this.validationReset();

    // Recorro las configuraciones de validacion del observable
    for (var name in this.validationConfig) {
        // Obtengo la configuracion del validador
        var config = this.validationConfig[name];

        // Si hay un validador configurado con el nombre especificado
        if (ko.validators[name]) {
            // Obtengo el validador ;) pasandole el observable y la configuracion
            var validator = ko.validators[name](this, config);

            // Valido utilizando el valor obtenido y el valor pasado a la funcion
            if (!validator.validate(newValue)) {
                // Si se produjo un error de validacion lo cargo en el summary
                if (this['parent']) {
                    this.parent.validationSummary.push({ name: this.validatable, message: this.validationMessage() });
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
    if (subscribe && !this['subscription']) {
        this.subscription = this.subscribe(validateValue, this);
    }

    return validateValue(this());
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

if (typeof define === 'function' && define.amd) {
    define('knockout', function() {
        return ko;
    });
}

// Register in the values from the outer closure for common dependencies
// as local almond modules
return $$;
}));

