// This binding can be used on links to specify a page name as href and quark will
// automatically convert it to the url mapped.
// You can specify a page name and an additional binding with page options
ko.bindingHandlers.href = {
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        // Gets the value of the binding
        var value = ko.unwrap(valueAccessor());

        // Get the options object if defined
        var options = allBindings.get('vars');

        // Create the new accessor
        var newAccesor = function() {
            return { href: "#" + $$.routing.hash(value, options) }
        }

        // Use the attr binding to add the href to the element
        return ko.bindingHandlers.attr.update(element, newAccesor, allBindings, viewModel, context);
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function as parameters.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

// Returns the format binding accessor
function createFormatAccessor(valueAccessor, allBindings) {
    // Get the formatter configuration
    var value = valueAccessor();
    var formatter = allBindings.get('formatter');

    // Validate that is correctly invoked
    if (!$$.isString(formatter)) {
        throw "Must specify formatter name";
    }

    // If value its not an observable, create an observable and set the value inside
    if (!ko.isObservable(value)) {
        value = ko.observable(value);
    }

    // Create the interceptor that is a pure computed wich transforms the
    // specified value with the formatter.
    return interceptor = ko.pureComputed({
        read: function () {
            // If the value and formatter are defined invoke the formatter
            // and use the formatted result else use the value as is.
            if ($$.isDefined(value()) && $$.isDefined(formatter)) {
                return $$.formatters[formatter](value());
            } else {
                return value();
            }
        }
    });

}

// $$.formatters is an object in wich each property is a function
// that accepts an object and returns the value formatted as must be passed to
// the binding.
// This allows to specify an observable or item to format
// and a formatter name (must correspond to an $$.formatters property)
// and transform the value before sending it to the actual binding.
// By default this send the formatted value to the text binding. You can
// specify another binding using bindTo and the name of the binding.
// For example "format: item, formatter: 'money', bindTo: 'value'"
ko.bindingHandlers.format = {
    init: function (element, valueAccessor, allBindings) {
        // Get the format accessor
        var interceptor = createFormatAccessor(valueAccessor, allBindings);
        // Get the target binding name or use text as default
        var bindingName = allBindings.get('bindTo') || 'text';

        // Create the binding object using the specified binding
        var binding = {};
        binding[bindingName] = interceptor;

        // Apply the binding to the element with the formatted output
        ko.applyBindingsToNode(element, binding);
    }
}

// This binding is similar to the if binding, it shows and bind its content only
// when the specified dependency is ready
ko.bindingHandlers.waitReady = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        // Get binding value with the dependency name
        var value = ko.unwrap(valueAccessor());

        // Validate the binding value
        if (!$$.isString(value)) {
            throw new Error('The binding must be an string with the property name of the imported dependency');
        }

        var newAccessor = ko.observable(false);

        if (viewModel && viewModel.imports && viewModel.imports.readied) {
            viewModel.imports.readied.addOnce(function(propertyName) {
                if (propertyName == value) {
                    newAccessor(true);
                }
            });
        }

        return ko.bindingHandlers['if'].init(element, newAccessor, allBindingsAccessor, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.waitReady = true;
