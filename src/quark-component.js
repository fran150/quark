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
        $container: viewModel.getModel(),
        $containerContext: context.$parentContext
    });

    return newContext;
}
