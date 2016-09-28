$$.onError = $$.signal();

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

requirejs.onError = function (error) {
    stacktrace.fromError(error).then(function(stack) {
        $$.onError.dispatch(error, stack);
    });

    throw error;
};

ko.onError = function(error) {
    stacktrace.fromError(error).then(function(stack) {
        $$.onError.dispatch(error, stack);
    });

    throw error;
};

var ErrorHandlingBindingProvider = function() {
    // Get the standard binding provider
    var original = new ko.bindingProvider();

    // Determine if an element has any bindings using the standard method
    this.nodeHasBindings = original.nodeHasBindings;

    // Return the bindings given a node and the bindingContext
    this.getBindings = function(node, bindingContext) {
        var result;
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
