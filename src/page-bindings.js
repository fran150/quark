ko.bindingHandlers.page = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Page name on the route
        var value = ko.unwrap(valueAccessor());

        var current = $$.routing.current.components;

        if (!current[value]) {
            current[value] = ko.observable('empty');
        }

        ko.applyBindingsToNode(element, { 'component': { 'name': current[value] } });
    }
}
ko.virtualElements.allowedBindings.page = true;
