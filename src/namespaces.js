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
