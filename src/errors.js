// Function to be call in case of error.
// It can return a boolean indicating if it handled the error or not.
// Also can return an object with two properties:
// handled: indicating that the error has been handled
// stack: a function that will be called when the stack trace of the error is ready
// This is because the stack trace is processed asynchonously
$$.onError = function(msg, error) { return false; }

// This signal is dispatched whenever an error ocurrs and the stack trace
// of that error is ready
$$.errorSignal = $$.signal();

// Error object extension for binding errors
// Warning it has a reference to the node and component with the error, this
// might result in this elements not being disposed by the garbage collector
// ensure that this object is not keeped in memory (even in the console!)
function BindingError(message, component, node, error) {
    this.component = component;
    this.node = node;
    this.message = message;
    this.stack = error.stack;
}

Object.setPrototypeOf(BindingError, Error);
BindingError.prototype = Object.create(Error.prototype);
BindingError.prototype.name = "BindingError";
BindingError.prototype.message = "";
BindingError.prototype.constructor = BindingError;

// Trap all errors
window.onerror = function (msg, file, line, column, error) {
    var sendStack;
    var handled;

    // Call the error function passing the message and error
    var result = $$.onError(msg, error);

    // If result is an object try to get all expected properties
    if ($$.isObject(result)) {
        // Get the handled value
        if (result.handled) {
            handled = result.handled;
        }

        // Get the function to be called when the stack trace is processed
        if (result.stack) {
            sendStack = result.stack;
        }
    } else {
        // If the result is not an object get the result
        handled = result;
    }

    // Process the error stack, when ready dispatch the error signal
    // And call the stack function if defined
    stacktrace.fromError(error).then(function(stack) {
        $$.errorSignal.dispatch(error, stack);

        if (sendStack) {
            sendStack(stack);
        }
    });

    // Return if the error is handled (if true it doesn't show the error on
    // the console)
    return handled;
}

// If an require js error is raised rethrow it so the windows.error can
// process it
requirejs.onError = function (error) {
    throw error;
};

// If a knockout error is raised rethrow it so the windows.error can
// process it
ko.onError = function(error) {
    throw error;
};

// Custom Knockout Binding Provider that wraps the binding process inside
// a try catch block

var ErrorHandlingBindingProvider = function() {
    // Get the standard binding provider
    var original = new ko.bindingProvider();

    // Determine if an element has any bindings using the standard method
    this.nodeHasBindings = original.nodeHasBindings;

    // Return the bindings given a node and the bindingContext
    this.getBindings = function(node, bindingContext) {
        var result;

        // Process the bindings with the standard provider if it produces an
        // error throw a binding error specifying the node and component
        try {
            result = original.getBindings(node, bindingContext);
        } catch (ex) {
            var component = bindingContext.$component;
            throw new BindingError('Binding Error: ' + ex.message, component, node, ex);
        }

        return result;
    };
};
ko.bindingProvider.instance = new ErrorHandlingBindingProvider();
