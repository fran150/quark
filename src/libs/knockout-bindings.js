// This binding can be used on links to specify a route name as href and quark will
// automatically convert it to the url defined in the route.
// You can specify a route name, or an object with two properties:
//{
//  routeName: the route name,
//  routeConfig: route config
//}
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

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function as parameters.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

// $$.formatters is an object in wich each property is a function that accepts an object and returns the value formatted as
// must be shown in the page.
// The binding format allows to specify an object in the form:
// {
//  value: observable or item to format
//  formatter: name of the formatter (must correspond to an $$.formatters property)
// }
// Internally when writing this value quark will call the formatter passing the value to format as parameter
// and using the result in a normal text binding.
ko.bindingHandlers.format = {
    init: function (element, valueAccessor) {
        // Get the formatter configuration
        var config = valueAccessor();

        // Validate that is correctly invoked
        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        // If value its not an observable, create an observable and set the value inside
        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        // Create the interceptor that is a pure computed wich transforms the specified value with the formatter.
        var interceptor = ko.pureComputed({
            read: function () {
                // If the value and formatter are defined invoke the formatter and use the formatted result
                // else use the value as is.
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter)) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        // Apply the text binding to the element with the formatted output
        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

// $$.formatters is an object in wich each property is a function that accepts an object and returns the value formatted as
// must be shown in the page.
// The binding format allows to specify an object in the form:
// {
//  value: observable or item to format
//  formatter: name of the formatter (must correspond to an $$.formatters property)
// }
// Internally when writing this value quark will call the formatter passing the value to format as parameter
// and using the result in a normal value binding.
ko.bindingHandlers.formatValue = {
    init: function (element, valueAccessor) {
        // Get the formatter configuration
        var config = valueAccessor();

        // Validate that is correctly invoked
        if (!$$.isDefined(config.value) || !$$.isString(config.formatter)) {
            throw 'Must specify format configuration in the form { value: observableValue, formatter: formatterName }';
        }

        // If value its not an observable, create an observable and set the value inside
        if (!ko.isObservable(config.value)) {
            config.value = ko.observable(config.value);
        }

        // Create the interceptor that is a pure computed wich transforms the specified value with the formatter.
        var interceptor = ko.pureComputed({
            read: function () {
                // If the value and formatter are defined invoke the formatter and use the formatted result
                // else use the value as is.
                if ($$.isDefined(config.value()) && $$.isDefined(config.formatter)) {
                    return $$.formatters[config.formatter](config.value());
                } else {
                    return config.value();
                }
            }
        });

        // Apply the value binding to the element with the formatted output
        ko.applyBindingsToNode(element, { value: interceptor });
    }
}
