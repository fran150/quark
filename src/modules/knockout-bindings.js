define(['knockout', 'modules/utils', 'accounting-js'], function(ko, utils, accounting) {
    // Applies the success style to the element if the specified condition is met. Useful highlight the selected row on a table:
    // <div data-bind="rowSelect: id == $parent.idSeleccionado">
    ko.bindingHandlers.rowSelect = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            var options = ko.unwrap(valueAccessor());

            var selectedValueAccessor = function () {
                return { success: options.isSelected(viewModel) };
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

            var interceptor = ko.pureComputed({
                read: function () {
                    if (utils.isDefined(underlyingObservable())) {
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

            var interceptor = ko.pureComputed({
                read: function () {
                    return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
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

    return ko;
});
