// This binding works in conjunction with the routing system.
// When configuring the routes you can define a page name and the component that must be shown when that route is matched.
// The specified component is shown inside a component that has a page binding with the matching name.
ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Page name on the route
        var name = ko.unwrap(valueAccessor());

        // Current component and parameters
        var current = {
            component: ko.observable(),
            parameters: ko.obsservable()
        };

        // This computed observable updates the current component and parameters when route changes
        var updater = ko.computed(function() {
            // Gets the current route
            var currentRoute = $$.routing.current();

            var component;
            var params;

            if (currentRoute) {
                // If the current component is specified as an array the assume it contains the
                // component name and the parameters to pass to the component
                if ($$.isArray(currentRoute.route.components[name])) {
                    component = currentRoute.route.components[name][0];
                    var componentParams = currentRoute.route.components[name][1];

                    if ($$.isString(componentParams)) {
                        eval("params = {" + componentParams + "}");
                    }

                    if ($$.isObject(componentParams) && $$.isString(componentParams.controller)) {
                        eval("params = $$.controller." + componentParams.controller + "()");
                    }

                } else {
                    component = currentRoute.route.components[name];
                    params = currentRoute;
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
                if (current.component() != component || !persistent) {
                    current.component(component);
                    current.parameters(params);
                }
            }
        });

        // Create an accessor for the component binding
        var newAccesor = function () {
            // Return the accesor for the component binding
            return {
                name: current.component,
                params: current.parameters
            }
        };

        if (element.nodeType != 8) {
            //element.setAttribute('qk-exporttocontroller', "\'" + name + "\'");
        } else {
            //element.data += " qk-exporttocontroller=\'" + name + "\'";
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
