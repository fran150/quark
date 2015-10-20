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

        // Sets the childs array wich tracks the dependencies and state
        if (!$$.isObject(object.tracking)) {
            object.tracking = {
                childs: {}
            }
        }

        // Start tracking the dependency
        object.tracking.childs[name] = {};

        // Define a function to call when the child finishes loading.
        // PropertyName contains the child name, and vm the corresponding viewmodel
        object.tracking.childs[name]['load'] = function(propertyName, vm) {
            // Sets the child viemodel and marks it as loaded
            object[propertyName] = vm;
            object.tracking.childs[propertyName]['loaded'] = true;

            if ($$.isDefined(object['loaded'])) {
                object.loaded(propertyName, vm);
            }

            if ($$.isDefined(vm.tracking)) {
                // If the child has dependencies mark the dependency as not ready and save
                // the parent data (reference and state)
                object.tracking.childs[propertyName]['ready'] = false;

                vm.tracking.parent = object;
                vm.tracking.parentState = object.tracking.childs[propertyName];
            } else {
                // If the child hasn't dependencies mark the dependency on parent as ready
                object.tracking.childs[propertyName]['ready'] = true;

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
            for (var property in object.tracking.childs) {
                if (!object.tracking.childs[property]['loaded'] || !object.tracking.childs[property]['ready']) {
                    return;
                }
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object['tracking']) && $$.isDefined(object.tracking['parent'])) {
                object.tracking.parentState['ready'] = true;

                if ($$.isDefined(object.tracking.parent['readied'])) {
                    object.tracking.parent.readied(propertyName, vm);
                }

                object.tracking.parent.tracking.childReady();
            }
        }

        // Initialize the tracking of the child component
        object.tracking.childs[name]['loaded'] = false;

        // Defines a function to call when one of its childs is ready.
        // It forces the object to reevaluate its readiness
        object.tracking.childReady = function() {
            // !! OPTIMIZE !! By using a counter. If there is a child that is not ready then exits
            for (var property in object.tracking.childs) {
                if (!object.tracking.childs[property]['ready']) {
                    return;
                }
            }

            // And the ready method...
            if ($$.isFunction(object['ready'])) {
                object['ready']();
            }

            // Finally if the object is tracked and has a parent, mark itself as ready on the parent
            // object and call the function on the parent to reevaluate readiness.
            if ($$.isDefined(object['parent']) && $$.isDefined(object.parent.tracking)) {
                object.tracking.parentState['ready'] = true;
                object.tracking.parent.tracking.childReady();
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
