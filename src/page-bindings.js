// This binding works in conjunction with the routing system.
// When configuring the routes you can define a page name and the component that must be shown when that route is matched.
// The specified component is shown inside a component that has a page binding with the matching name.
ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Page name on the route
        var value = ko.unwrap(valueAccessor());

        var current = $$.routing.current.components;

        if (!current[value]) {
            current[value] = ko.observable('empty');
        }

        ko.applyBindingsToNode(element, { 'component': { 'name': current[value] } });

/*
        // Create an accessor for the component binding
        var newAccesor = function () {
            // Return the accesor for the component binding
            return {
                name: current[name]
            }
        };

        return ko.bindingHandlers.component.init(element, newAccesor, allBindingsAccessor, viewModel, context);*/
    }
}
ko.virtualElements.allowedBindings.page = true;
