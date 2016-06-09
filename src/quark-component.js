// Registers the quark component in Knockout, it contains the component scope and model binder
ko.components.register('quark-component', {
    template: "<!-- ko componentScope --><!-- /ko --><!-- ko modelBinder --><!-- /ko -->"
});

// Creates the component scope accesor with the DOM nodes of the component.
function createComponentScopeAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

// Alters the binding context for the component scope.
// The component must bind at the parent level using the scope as binding data, but all other reference
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

// The component scope creates the context for the component and bind its template to the specified $scope,
// effectively separating the scope and model.
// The binding also overrides the context hiding the quark-component object references
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

// The model exporter accesor searchs the tag wich defines the component to find the qk- attributes,
// and for each attribute find create a binding in it's template wich binds to a custom context with has the child model on
// the $child property.
// As the export binding executes in here it doesn't export the scope of the object
function createModelBinderAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var newAccesor = function() {
        var nodes = Array();

        // Find the elements defining tag. It's the grandparent because it's parents is the quark-object tag.
        var parent = findParent(element);
        parent = findParent(parent);

        // Given the type of tag we search the qk attributes in different ways.
        if (parent.nodeType == 8) {
            // If node is virtual find the qk-yourBindingHere="yourBindingContentHere" values
            var matches = parent.nodeValue.match(/model-bind[\s]*=[\s]*[\'\"][\s\S]+?[\'\"]/g);

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

function createModelBinderContext(context) {
    var seniorContext = context.$parentContext.$parentContext;
    var viewModel = context.$parent;

    var newContext = seniorContext.extend({
        $child: viewModel.getModel()
    });

    return newContext;
}

// The model exporter searchs for qk attributes defined in the components custom tag, then it creates a binding with each
// attribute found, this produces that each binding be executed when the component loads, also this binding creates a custom
// context wich is at the level of the component parent, and has a property $child with the childs model and a $childContext
// with the child context.
// This $child property is used by the export binding to extract the childs model and send it to the parent.
ko.bindingHandlers.modelBinder = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelBinderAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = createModelBinderContext(context);
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelBinderAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = createModelBinderContext(context);
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.modelBinder = true;
