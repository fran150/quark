define(['knockout', 'jquery', 'utils'], function(ko, $, utls) {

    // Initialize validators array
    ko.validators = {};

    // Validates the observables in the specified object. It can subscribe to the observables so it revalidates each field on change.
    ko.validate = function(object, subscribe) {
        var result = true;

        for (var propertyName in object) {
            var property = object[propertyName];

            if (ko.isObservable(property)) {
                if (property['validatable']) {
                    // Valida el observable pasandole si debe subscribir
                    if (!property.validate(subscribe)) {
                        result = false;
                    }
                }
            }
        }

        return result;
    }

    // Resets error on all the observables of the object
    ko.validationReset = function(object) {
        for (var propertyName in object) {
            var property = object[propertyName];

            if (ko.isObservable(property)) {
                if (property['validatable']) {
                    // Resetea los errores de validacion del observable
                    property.validationReset();
                }
            }
        }
    }

    // Adds the validation function to the observables. Calling this function will activate validation on the observable.
    // Name is the field name to show on error messages. Validation config is an object with the configuration of validations to enfoce, parent
    // is the parent object in wich the observable resides, if specified it creates a property 'validationSummary' with an array showing the
    // list of validation errors in the object.
    ko.observable.fn.validation = function(name, validationConfig, parent) {
        // Indica que el campo es validable, y el nombre con el cual debe aparecer en los mensajes
        this.validatable = name;

        // Carga la configuracion de validacion
        this.validationConfig = {};
        this.validationConfig = validationConfig;

        // Extiende el observable con observables que indican si el observable tiene error
        // y el mensaje
        this.hasError = ko.observable();
        this.validationMessage = ko.observable();

        // Si se especifico un objeto padre crea una propiedad para guardarlo
        if (parent) {
            this.parent = parent;

            // Si el objeto padre no tiene un sumario de validaciones crea uno que es un
            // array observable que un elemento por cada error de validacion
            if (!parent['validationSummary']) {
                parent.validationSummary = ko.observableArray();
            }
        }

        // Devuelve el propio observable, permitiendo encadenar la llamada en la misma llamada a ko.observable
        return this;
    }

    // Resets validation errors on the observable and clears itself from the objects validation summary
    ko.observable.fn.validationReset = function () {
        var me = this;
        // Si se configuraron validaciones sobre este observable
        if (this['validatable']) {
            // Saca el flag de error y limpia el mensaje
            this.hasError(false);
            this.validationMessage('');

            // Si ademas se definio el objeto padre elimina el error del sumario de errores
            if (this['parent']) {
                this.parent.validationSummary.remove(function (item) {
                    return item.name === me.validatable;
                });
            }
        }
    }

    // Performs the actual validation on the observable. Its on a separate function
    function validateValue(newValue) {
        // Resetea las validaciones del observable
        this.validationReset();

        // Recorro las configuraciones de validacion del observable
        for (var name in this.validationConfig) {
            // Obtengo la configuracion del validador
            var config = this.validationConfig[name];

            // Si hay un validador configurado con el nombre especificado
            if (ko.validators[name]) {
                // Obtengo el validador ;) pasandole el observable y la configuracion
                var validator = ko.validators[name](this, config);

                // Valido utilizando el valor obtenido y el valor pasado a la funcion
                if (!validator.validate(newValue)) {
                    // Si se produjo un error de validacion lo cargo en el summary
                    if (this['parent']) {
                        this.parent.validationSummary.push({ name: this.validatable, message: this.validationMessage() });
                    }
                    return false;
                }
            }
        }

        return true;
    };

    // Validates the observable using the defined rules. Subscribe indicates if the validators must subscribe to the observable
    // to reevaluate on change.
    ko.observable.fn.validate = function (subscribe) {
        // Si se debe subscribir y no hay una subscripcion previa
        if (subscribe && !this['subscription']) {
            this.subscription = this.subscribe(validateValue, this);
        }

        return validateValue(this());
    }

    // Sets the form group error class if the specified observable or array of observables has error.
    function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
        var value = valueAccessor();
        var hasError = false;

        if (utils.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (!value[i].hasError()) {
                    hasError = true;
                }
            }
        } else {
            hasError = value.hasError();
        }

        if (hasError) {
            $(element).addClass('has-error');
        } else {
            $(element).removeClass('has-error');
        }
    }

    // Sets the error class to the form group if the specified observable or one of the observable in the array has
    // a validation error.
    ko.bindingHandlers.formGroupError = {
        init: function (element, valueAccessor, allBindings, viewModel, context) {
            setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
        },
        update: function (element, valueAccessor, allBindings, viewModel, context) {
            setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
        }
    };

    return ko;
});
