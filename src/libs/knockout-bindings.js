ko.bindingHandlers.href = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var value = ko.unwrap(valueAccessor());

        var newAccesor = function() {
            if ($$.isString(value)) {
                return { href: '#' + $$.routing.hash(value) }
            } else if ($$.isObject(value)) {
                var url;

                if (value.page) {
                    url = value.page;
                }

                if (value.routeName) {
                    url += "#" + $$.routing.hash(value.routeName, value.routeConfig);
                }

                return { href: url }
            }
        }
        return ko.bindingHandlers.attr.update(element, newAccesor, allBindingsAccessor, viewModel, context);
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

ko.bindingHandlers.format = {
    init: function (element, valueAccessor) {
        var config = valueAccessor();

        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter)) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}
