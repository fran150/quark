ko.bindingHandlers.namespace = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        // Get the namespace value
        var value = valueAccessor();

        // Get the namespace alias
        var alias = allBindings.get('alias');

        // Validate data
        if (!$$.isString(value)) {
            throw new Error('Must specify namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'');
        }

        // If namespace alias is not defined throw error
        if (!$$.isString(alias)) {
            throw new Error('Must specify alias to namespace as string. The binding must be in the form: namespace: \'namespace\', alias: \'alias\'');
        }

        // Transform values to lowercase
        var namespace = value.toLowerCase();
        alias = alias.toLowerCase();

        // If theres a context defined
        if (context) {
            var extension;

            // Check if theres a namespaces object defined in the context
            if (!context.namespaces) {
                extension = { namespaces: {} };
            } else {
                extension = { namespaces: context.namespaces };
            }

            // Add the alias to the list
            extension.namespaces[alias] = namespace;

            var innerBindingContext = context.extend(extension);
            ko.applyBindingsToDescendants(innerBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        }
    }
}
ko.virtualElements.allowedBindings.namespace = true;
