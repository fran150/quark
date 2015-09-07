/**
 * @function
 *
 * @description Binding que permite invocar una funcion cuando el objeto se bindea contra knockout. La funcion debe ser
 * del tipo function(element, viewModel, context). El parametro element contiene el elemento del DOM desde donde se
 * invoca la funcion, el parametro viewModel contiene el modelo contra el que se bindea dicho elemento y finalmente
 * el parametro context contiene el contexto del binding ($parent, $parents, $root, etc)
 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
};



/**
 * @function
 *
 * @description Binding que permite especificar una condicion y en caso de cumplirse aplica al elemento desde donde se invoca
 * el estilo "success" de bootstrap.
 * Esto permite especificarlo en cada fila de una tabla, comparando el valor de una variable con el correspondiente a la clave
 * primaria del registro que la fila representa con el objetivo de pintarla como seleccionada...
 *
 * @example
 * <div data-bind="rowSelect: id == $parent.idSeleccionado">
 *
 * @memberOf Extensiones Knockout.Bindings
 */
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

/**
 * @function
 *
 * @description Binding que permite el ingreso de numeros decimales formateados con separadores de miles . y de decimales ,
 * asignandolos a la propiedad value del objeto.
 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.numericValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        var interceptor = ko.pureComputed({
            read: function () {
                if (quark.isDefined(underlyingObservable())) {
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
};

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
};
