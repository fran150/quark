// Uses jquery to select the nodes to show from the componentTemplateNodes
function createContentAccesor(valueAccessor, allBindingsAccessor, context) {
    // Gets the value
    var value = ko.unwrap(valueAccessor());
    // Get the namespace alias
    var virtual = allBindingsAccessor.get('virtual') || false;

    // New Accesor
    var newAccesor = function () {
        if (virtual) {
            var result = [];
            var found = 0;

            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                var node = context.$componentTemplateNodes[i];

                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        found++;
                    }
                }

                if (found > 0) {
                    result.push(node);

                    if (node.nodeType == 8) {
                        if (node.nodeValue.trim().toUpperCase() == "/" + value.toUpperCase()) {
                            found--;
                        }
                    }
                }
            }

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
// the specified jquery selector inside the component's content
function createHasContentAccesor(valueAccessor, allBindings, context) {
    var value = ko.unwrap(valueAccessor());
    var virtual = allBindings.get('virtual') || false;

    var newAccesor = function () {
        if (virtual) {
            for (var i = 0; i < context.$componentTemplateNodes.length; i++) {
                var node = context.$componentTemplateNodes[i];

                if (node.nodeType == 8) {
                    if (node.nodeValue.trim().toUpperCase() == value.toUpperCase()) {
                        return true;
                    }
                }
            }

            return false;
        } else {
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
