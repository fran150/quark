// Generates the content binding accessor wich uses jquery to select the nodes to
// show from the componentTemplateNodes
function createContentAccesor(valueAccessor, allBindingsAccessor, context) {
    // Gets the value of the content binding
    var value = ko.unwrap(valueAccessor());
    // Check if the virtual binding is specified
    var virtual = allBindingsAccessor.get('virtual') || false;

    // Create the new accesor
    var newAccesor = function () {
        // If the virtual binding is specified we must use the content between
        // virtual tags with the specified name
        // <!-- example -->This<!-- /example -->
        if (virtual) {
            // Init the result array of nodes and the number of coincidences
            var result = [];
            var found = 0;

            // Iterate each node in the componentTemplateNodes
            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                // Get the node
                var node = context.$componentTemplateNodes[i];

                // If the node is virtual and node name and value coincides mark as a
                // found and this and next nodes will be part of the result
                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        found++;
                    }
                }

                // If an opening tag is found then this node is pushed to the result
                if (found > 0) {
                    result.push(node);

                    // If the actual node is virtual and is the closing tag, substract
                    // one coincidence
                    if (node.nodeType == 8) {
                        if (node.nodeValue.trim().toUpperCase() == "/" + value.toUpperCase()) {
                            found--;
                        }
                    }
                }
            }

            // Return the found nodes
            return { nodes: result };
        } else {
            // If a value is specified use it as a jquery filter, if not use all the nodes.
            if ($$.isDefined(value)) {
                var nodes = $(context.$componentTemplateNodes).filter(value);
                return { nodes: nodes };
            } else {
                return { nodes: context.$componentTemplateNodes };
            }
        }
    };

    // Returns the new accesor
    return newAccesor;
}

// Creates the context for the content binding. It binds at parent level and adds a property with the
// viewmodel of the contained component.
function createContentContext(context) {
    var parentContext = context.$parentContext;
    var viewModel = context.$data;

    var newContext = parentContext.extend({
        $containerContext: context,
        $container: viewModel.model
    });

    return newContext;
}

// This binding is used in the template of a component to show the custom markup passed to the component as content.
// It allows to define where in your component's template the specified content is shown.
// You can specify a jquery selector indicating wich part of the component content to show, if no selector is specified all
// content is shown
ko.bindingHandlers.content = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(valueAccessor, allBindingsAccessor, context);
        var newContext = createContentContext(context);

        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(valueAccessor, allBindingsAccessor, context);
        var newContext = createContentContext(context);

        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.content = true;

// Creates an accesor that returns true if there are elements that matches
// the specified jquery selector inside the component's content, or if virtual
// node are used, try to find a virtual node with the specified name
function createHasContentAccesor(valueAccessor, allBindings, context) {
    // Gets the value of the content binding
    var value = ko.unwrap(valueAccessor());
    // Check if the virtual binding is specified
    var virtual = allBindings.get('virtual') || false;

    // Creates the new accessor
    var newAccesor = function () {
        // If virtual node is used
        if (virtual) {
            // Iterate over all nodes
            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                var node = context.$componentTemplateNodes[i];

                // If an opening node with the specified name is found return true
                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        return true;
                    }
                }
            }

            return false;
        } else {
            // Check if the filter has any value
            return $(context.$componentTemplateNodes).filter(value).length > 0;
        }
    };

    return newAccesor;
}

// Shows and bind its content only if there are elements that
// matches the specified jquery selector in the component's content
ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, allBindingsAccessor, context);

        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

// The inverse of the hasContent binding.
ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(valueAccessor, allBindingsAccessor, context);

        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;
