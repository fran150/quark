// Initialize validators array
// This an object containing a property for each validator that quark supports.
// Each validator is an object receiving the observable to validate and the validation config (for example min and max allowed values)
// Then the validator must define a validate method that returns true if the validation passes
// You can attach a validator to an observable by using the validation method of the observable (Extension method added by Quark).
ko.validators = {};

// Validate the observables in the specified object.
// If subscribe is true, it adds a subscription so it revalidates each field on change.
// Returns true if the object is valid or false if it has some error
ko.validate = function(object, subscribe) {
    // Initializes validation in true
    var result = true;

    // Iterate all properties in the object
    for (var propertyName in object) {
        var property = object[propertyName];

        // If the property is observable and has a validator attached, validate
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Validates the property indicating if it must subscribe the validation
                if (!property.validate(subscribe)) {
                    result = false;
                }
            }
        }
    }

    // Returns the result
    return result;
}

// Unsubscribe validation from the object.
ko.unsubscribeValidation = function(object) {
    // Iterate each property
    for (var propertyName in object) {
        var property = object[propertyName];

        // If the property is an observable and has a validator attached..
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // If it has a subscription dispose and delete it
                if (property.validationSubscription) {
                    property.validationSubscription.dispose();
                    delete property.validationSubscription;
                }
            }
        }
    }
}

// Resets errors on all the observables of the object
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
    // Indicates that the field is validatable and the name of the field on the error messages
    this.validatable = name;

    // Loads the validation configuration
    this.validationConfig = validationConfig;

    // Extends the observable with properties that indicates if the observable has an error, and the error message
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // If an error handler has been specified
    if (errorHandler) {
        this.errorHandler = errorHandler;
    }

    // Returns the observable allowing to chain validate calls on the same
    return this;
}

// Resets validation errors on the observable and clears itself from the objects errorHandler
ko.observable.fn.validationReset = function () {
    var me = this;

    // If there is a validator attached
    if (this['validatable']) {
        // Clears error flag and message
        this.hasError(false);
        this.validationMessage('');

        // If an error handler is defined use stored error key and resolve it (clearing it from the list)
        if (this.errorHandler && this.errorKey) {
            this.errorHandler.resolve(this.errorKey);
        }
    }
}

// Performs the actual validation on the observable. Its on a separate function to allow subscription
function validateValue(newValue, target) {
    // If a target is not defined assume its the observable
    if (!target) {
        target = this;
    }

    // Resets observable validations
    target.validationReset();

    // Iterate over the validation configs in the observable
    for (var name in target.validationConfig) {
        var config = target.validationConfig[name];

        // If there a validator in the ko.validators array
        if (ko.validators[name]) {
            // Get the validator passing the target observable and the validation config
            var validator = ko.validators[name](target, config);

            // Perform the actual validation of the new value
            if (!validator.validate(newValue)) {
                // If there's an error handler defined add the validation error and store the error key.
                if (target.errorHandler) {
                    target.errorKey = target.errorHandler.add(target.validationMessage(), { level: 100, type: 'validation' });
                }

                // Return false if validation fails
                return false;
            }
        }
    }

    // If validation passes return true
    return true;
};

// Validates the observable using the defined rules. Subscribe indicates if the validators must subscribe to the observable
// to reevaluate on change.
ko.observable.fn.validate = function (subscribe) {
    // If it must subscribe and there is no previous subscrption, subscribe
    if (subscribe && !this['validationSubscription']) {
        this.validationSubscription = this.subscribe(validateValue, this);
    }

    // Validate value and return the result
    return validateValue(this(), this);
}

// Sets the form group error class if the specified observable or array of observables has error.
function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
    // Get the binding value
    var value = valueAccessor();
    // Init error status
    var hasError = false;

    // If binding value is an array
    if ($$.isArray(value)) {
        // Iterate over each item and check if it has an error
        for (var i = 0; i < value.length; i++) {
            // If one of the observables has an error mark error status and break
            if (!value[i].hasError()) {
                hasError = true;
                break;
            }
        }
    } else {
        // If binding value is only one element check if it has an error
        hasError = value.hasError();
    }

    // If we are in an error state add the has error class to the element, if not remove it
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

// This binding used in an element makes the element to show only if the specified observable has an error
// and fill the element text with the observable's error message
ko.bindingHandlers.fieldError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        // Create an accessor for the text binding with the validation message of the specified observable
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        // Use the text binding
        ko.bindingHandlers.text.init(element, textAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        // Create a visible accessor checking if the observable has an error
        var visibleAccessor = function() {
            return valueAccessor().hasError;
        }

        // Create an accessor for the text binding with the validation message of the specified observable
        var textAccessor = function() {
            return valueAccessor().validationMessage;
        }

        // Use the text and visible binding
        ko.bindingHandlers.visible.update(element, visibleAccessor, allBindings, viewModel, context);
        ko.bindingHandlers.text.update(element, textAccessor, allBindings, viewModel, context);
    }
}

