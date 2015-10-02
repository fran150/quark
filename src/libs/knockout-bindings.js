// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

function block(element, value) {
    if (value) {
        $$.block(value, $(element));
    } else {
        $$.unblock($(element));
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.block = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        block(element, value);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        block(element, value);
    }
}


// Applies the success style to the element if the specified condition is met. Useful highlight the selected row on a table:
// <div data-bind="rowSelect: id == $parent.idSeleccionado">
ko.bindingHandlers.rowSelect = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var options = ko.unwrap(valueAccessor());

        var selectedValueAccessor = function () {
            if ($$.isFunction(options.isSelected)) {
                return { success: options.isSelected(viewModel) };
            } else {
                return { success: options.isSelected };
            }

        };

        ko.bindingHandlers.css.update(element, selectedValueAccessor, allBindingsAccessor, viewModel, context);

        var clickValueAccessor = function () {
            return options.select;
        };

        ko.bindingHandlers.click.init(element, clickValueAccessor, allBindingsAccessor, viewModel, context);
    }
};

// Uses accounting js to show a numeric input
ko.bindingHandlers.numericValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
}

ko.bindingHandlers.moneyValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
}


// Uses accounting js to show a numeric input
ko.bindingHandlers.numericText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

ko.bindingHandlers.moneyText = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        if (!ko.isObservable(underlyingObservable)) {
            underlyingObservable = ko.observable(underlyingObservable);
        }

        var interceptor = ko.pureComputed({
            read: function () {
                if ($$.isDefined(underlyingObservable())) {
                    return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { text: interceptor });
    }
}

