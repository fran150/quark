ko.bindingHandlers.outlet = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get outlet name
        var value = ko.unwrap(valueAccessor());
        // Current controller name
        var currentController;
        // Component name to show on this outlet
        var componentName = ko.observable('empty');

        // Subscribe to name changes (routing)
        var subscription = $$.routing.current.name.subscribe(function(newValue) {
            var names = [];

            if (newValue) {
                names = newValue.split('/');
            }

            var controller;
            var fullName;

            var newComponentName;
            var newController;

            for (var i = 0; i < names.length; i++) {
                var name = names[i];
                fullName = fullName ? fullName + '/' + name : name;

                var controller = $$.routing.current.controllers[fullName];

                for (var outletName in controller.outlets) {
                    if (outletName == value) {
                        newComponentName = controller.outlets[outletName];
                        newController = controller;
                    }
                }
            }

            if (newComponentName) {
                if (newComponentName != componentName() || newController != currentController) {
                    currentController = newController;
                    componentName(newComponentName);
                }
            } else {
                $$.undefine(currentController);
                componentName('empty');
            }
        });

        // Destroy subscription on element disposal
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
            $$.undefine(currentController);
        });

        ko.applyBindingsToNode(element, { 'component': { 'name': componentName } });
    }
}
ko.virtualElements.allowedBindings.outlet = true;
