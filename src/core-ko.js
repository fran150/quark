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
    callReady(object);

    // Finally, if the object is tracked and has a parent, mark itself as ready on the parent
    // and call the function on the parent to reevaluate readiness.
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.tracking) && $$.isDefined(object.$support.tracking.parent)) {
        // Mark the object ready on the parent
        object.$support.tracking.parentState['ready'] = true;

        callReadied(object.$support.tracking.parent, object.$support.tracking.parentState.propertyName, object);

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

// Calls the object's readied function and signals
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

// Calls the object's loaded function and signals
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

// Call Ready function and signals on the object
function callReady(object) {
    // If there´s a ready callback on the object invoke it
    if ($$.isFunction(object['ready'])) {
        object['ready']();
    }

    // If theres a ready lock on the object unlock it
    if ($$.isDefined(object['readyLock'])) {
        object.readyLock.unlock();
    }
}

function initTracking(object, name) {
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
            childs: {},
        }
    }

    // Creates a ready lock to fire when the object is ready
    object.readyLock = $$.lock();

    // Creates a signal to fire when a dependency loads
    object.loadedSignal = $$.signal();

    // Creates a signal to fire when a dependency is ready
    object.readiedSignal = $$.signal();

    // Start tracking the dependency with the specified name.
    object.$support.tracking.childs[name] = {};

    // The child components uses this function to notify that it finished loading.
    // PropertyName contains the child name, and vm the corresponding viewmodel.
    object.$support.tracking.childs[name]['load'] = function(propertyName, vm) {
        // Sets the child viemodel and marks it as loaded
        object[propertyName] = vm;
        object.$support.tracking.childs[propertyName]['loaded'] = true;

        callLoaded(object, propertyName, vm);

        // Save the property name
        object.$support.tracking.childs[propertyName]['propertyName'] = propertyName;

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

            callReadied(object, propertyName, vm);
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
    object.$support.tracking.childReady = function(propertyName, vm) {
        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(object)) {
            markReadyAndInformParent(object);
        }
    }
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

        initTracking(object, name);

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
        return element.parentNode;
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


// This binding works in conjunction with the routing system. In the routes you can define the components that must be shown
// for an specific route in wich "page".
// This binding search in the current route for a component defined with the specified name in the route and shows it.
// For example: if in the route are defined this components { title: 'title-component', body: 'text-component' } and in the
// page we specify <div data-bind="page: 'body'"></div> will show the "title-component" inside the DIV.
ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Page name on the route
        var name = ko.unwrap(valueAccessor());

        // C is the component name
        var c = ko.observable();
        // P is the parameters object
        var p = ko.observable();

        // This computed updates C and P when the current route changes
        var updater = ko.computed(function() {
            // Gets the current route
            var current = $$.routing.current();

            var component;
            var params;

            // Create the accesor getting the component defined in the current route with the page name.
            // If the route specify an array we assume that is component name and parameters.
            // If not, is the name of the component and as parameters pass the current route.
            if ($$.isArray(current.route.components[name])) {
                component = current.route.components[name][0];
                var componentParams = current.route.components[name][1];

                if ($$.isString(componentParams)) {
                    eval("params = {" + componentParams + "}");
                }

                if ($$.isObject(componentParams) && $$.isString(componentParams.controller)) {
                    eval("params = $$.controller." + componentParams.controller + "()");
                }

            } else {
                component = current.route.components[name];
                params = current;
            }

            // Set persistent flag to false
            // A persistent flag indicates that if the route changes, but the same component is applied to this page then do not redraw it,
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
            // If its a persistent component the routing system will update the parameters
            if (c() != component || !persistent) {
                c(component);
                p(params);
            }
        });

        // Create an accessor for the component binding
        var newAccesor = function () {
            // Return the accesor for the component binding
            return {
                name: c,
                params: p
            }
        };

        // Gets the current route
        var current = $$.routing.current();

        // If theres a controller defined create a new context with the controller specified
        if ($$.isObject(current.controller)) {
            context = context.createChildContext(current.controller);
        }

        // When disposing the page element (and this binding) dispose the computed observable
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            updater.dispose();
        });

        // Apply the import binding to node
        ko.applyBindingsToNode(element, { import: name }, context);

        // Bind as component binding
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
