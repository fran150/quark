// Modules List
$$.modules = ko.associativeObservable({});

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
    }

    if (node && node.nodeName && ko.components.isRegistered(node.nodeName.toLowerCase())) {
        if (node.attributes['virtual']) {
            var params = node.attributes['params'];
            var bind = node.attributes['data-bind'];

            var comment = " ko component: { name: '" + node.nodeName.toLowerCase() + "' ";

            if (params) {
                comment += ", params: { " + params.value + " } ";
            }

            comment += " } ";

            if (bind) {
                comment += ", " + bind.value + " ";
            }

            var openTag = document.createComment(comment);
            var closeTag = document.createComment(" /ko ");

            node.parentNode.insertBefore(closeTag, node.nextSibling);
            node.parentNode.replaceChild(openTag, node);

            while (node.childNodes.length > 0) {
                openTag.parentNode.insertBefore(node.childNodes[0], closeTag);
            }

            return [openTag, closeTag];
        }
    }
}



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

function createContentContext(context) {
    var parentContext = context.$parentContext;
    var viewModel = context.$data;

    var newContext = parentContext.extend({
        $child: viewModel.model
    });

    return newContext;
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
        var newContext = createContentContext(context);
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = createContentContext(context);
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

        if (element.nodeType != 8) {
            element.setAttribute('qk-exporttocontroller', "\'" + name + "\'");
        } else {
            element.data += " qk-exporttocontroller=\'" + name + "\'";
        }


        // When disposing the page element (and this binding) dispose the computed observable
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            updater.dispose();
        });

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
