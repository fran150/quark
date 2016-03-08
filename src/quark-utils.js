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

function blockWithError(element, value, style) {
    if (value.length) {
        $(element).block({
            message: 'Error',
            overlayCSS: {
                backgroundColor: '#A94442',
                opacity: 0.5,
            },
            css: {
                border: 'none',
                padding: '5px',
                backgroundColor: '#000',
                '-webkit-border-radius': '5px',
                '-moz-border-radius': '5px',
                backgroundColor: '#A94442',
                opacity: 1,
                color: '#fff'
            },
            baseZ: 900
        });
    } else {
        $(element).unblock();
    }
}

function blockWithWarning(element, value, style) {
    if (value.length) {
        $(element).block({
            message: 'Hay problemas con este elemento.',
            overlayCSS: {
                backgroundColor: '#FCF8E3',
                opacity: 0.4,
            },
            css: {
                border: 'none',
                padding: '5px',
                backgroundColor: '#000',
                '-webkit-border-radius': '5px',
                '-moz-border-radius': '5px',
                backgroundColor: '#FCF8E3',
                opacity: 1,
                color: '#000'
            },
            baseZ: 900
        });
    } else {
        $(element).unblock();
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var handler = viewModel.errorHandler;
        var value = handler.getByLevel(2000, 9999);

        function validate(value) {
            if ($$.isArray(value)) {
                blockWithError(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnWarning = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var handler = viewModel.errorHandler;
        var value = handler.getByLevel(1000, 9999);

        function validate(value) {
            if ($$.isArray(value)) {
                var hasWarning = false;

                for (var index in value) {
                    var error = value[index];

                    if (error.level > 2000) {
                        blockWithError(element, value);
                        return;
                    }

                    if (error.level >= 1000 && error.level < 2000) {
                        hasWarning = true;
                    }
                }

                blockWithWarning(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

ko.bindingHandlers.blockOnErrorSource = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var source = ko.unwrap(valueAccessor());
        var handler = viewModel.errorHandler;
        var value = handler.getBySource(source);

        function validate(value) {
            if ($$.isArray(value)) {
                blockWithError(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.blockOnErrorCondition = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var condition = ko.unwrap(valueAccessor);
        var handler = viewModel.errorHandler;
        var value = handler.getBy(condition);

        function validate(value) {
            if ($$.isArray(value)) {
                blockWithError(element, value);
            }
        }

        var subscription = value.subscribe(validate);

        validate(value());

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
        });
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

ko.extenders.blockable = function(target, defaultMessage) {
    target.blocked = ko.observable('');

    target.block = function(message) {
        var msg = message || defaultMessage;
        target.blocked(msg);
    }

    target.unblock = function() {
        target.blocked('');
    }

    //return the original observable
    return target;
};

ko.tryBlock = function(observable, message) {
    if (observable.block) {
        observable.block(message);
    }
}

ko.tryUnblock = function(observable) {
    if (observable.unblock) {
        observable.unblock();
    }
}

// Blocks user input for the specified target showing a message. If no target specified blocks entire screen
$$.block = function (message, target) {
    if (!message)
        message = 'Loading...';

    var options = {
        message: message,
        css: {
            border: 'none',
            padding: '5px',
            backgroundColor: '#000',
            '-webkit-border-radius': '5px',
            '-moz-border-radius': '5px',
            opacity: .7,
            color: '#fff'
        },
        baseZ: 5000
    }

    if (target) {
        $(target).block(options);
    } else {
        $.blockUI(options);
    }
}

// Unblock user input from the specified target (JQuery Selector)
$$.unblock = function (target) {
    if (target) {
        $(target).unblock();
    } else {
        $.unblockUI();
    }
}
