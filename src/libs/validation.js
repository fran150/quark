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

ko.unsubscribeValidation = function(object) {
    for (var propertyName in object) {
        var property = object[propertyName];

        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Valida el observable pasandole si debe subscribir
                if (property.validationSubscription) {
                    property.validationSubscription.dispose();
                    delete property.validationSubscription;
                }
            }
        }
    }
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
// Name is the field name to show on error messages. Validation config is an object with the configuration of validations to enfoce,
// if theres an error handler specified every validation error is added to the handler
ko.observable.fn.validation = function(name, validationConfig, errorHandler) {
    // Indica que el campo es validable, y el nombre con el cual debe aparecer en los mensajes
    this.validatable = name;

    // Carga la configuracion de validacion
    this.validationConfig = {};
    this.validationConfig = validationConfig;

    // Extiende el observable con observables que indican si el observable tiene error
    // y el mensaje
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // Si se especifico un errorHandler
    if (errorHandler) {
        this.errorHandler = errorHandler;
    }

    // Devuelve el propio observable, permitiendo encadenar la llamada en la misma llamada a ko.observable
    return this;
}

// Resets validation errors on the observable and clears itself from the objects errorHandler
ko.observable.fn.validationReset = function () {
    var me = this;
    // Si se configuraron validaciones sobre este observable
    if (this['validatable']) {
        // Saca el flag de error y limpia el mensaje
        this.hasError(false);
        this.validationMessage('');

        // Si ademas se definio un errorHandler y se cargo un error lo resuelvo utilizando la clave almacenada
        if (this.errorHandler && this.errorKey) {
            this.errorHandler.resolve(this.errorKey);
        }
    }
}

// Performs the actual validation on the observable. Its on a separate function to allow subscription
function validateValue(newValue, target) {
    if (!target) {
        target = this;
    }

    // Resetea las validaciones del observable
    target.validationReset();

    // Recorro las configuraciones de validacion del observable
    for (var name in target.validationConfig) {
        // Obtengo la configuracion del validador
        var config = target.validationConfig[name];

        // Si hay un validador configurado con el nombre especificado
        if (ko.validators[name]) {
            // Obtengo el validador ;) pasandole el observable y la configuracion
            var validator = ko.validators[name](target, config);

            // Valido utilizando el valor obtenido y el valor pasado a la funcion
            if (!validator.validate(newValue)) {
                if (target.errorHandler) {
                    target.errorKey = target.errorHandler.add(target.validationMessage(), { level: 100, type: 'validation' });
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
    if (subscribe && !this['validationSubscription']) {
        this.validationSubscription = this.subscribe(validateValue, this);
    }

    return validateValue(this(), this);
}

// Sets the form group error class if the specified observable or array of observables has error.
function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
    var value = valueAccessor();
    var hasError = false;

    if ($$.isArray(value)) {
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

ko.bindingHandlers.fieldError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        ko.bindingHandlers.text.init(element, textAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        var visibleAccessor = function() {
            return valueAccessor().hasError;
        }

        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        ko.bindingHandlers.visible.update(element, visibleAccessor, allBindings, viewModel, context);
        ko.bindingHandlers.text.update(element, textAccessor, allBindings, viewModel, context);
    }
}

