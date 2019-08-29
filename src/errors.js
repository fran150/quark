import ko from 'knockout';
import Signal from 'signals';
import utils from './utils';

/**
 * Error object extension for binding errors
 * Warning it has a reference to the node and component with the error, this
 * might result in this elements not being disposed by the garbage collector
 * ensure that this object is not keeped in memory (even in the console!)
 * @param {string} message Error message
 * @param {any} component Component model that caused the error
 * @param {Element} node Node being binding when the error
 * @param {Error} error Error produced
 */
function BindingError(message, component, node, error) {
  this.component = component;
  this.node = node;
  this.message = message;
  this.stack = error.stack;
}

utils.extends(BindingError, Error);

/**
 * Custom Knockout Binding Provider that wraps the binding process inside
 * a try catch block
 */
const ErrorHandlingBindingProvider = function() {
  // Get the standard binding provider
  const original = new ko.bindingProvider();

  // Determine if an element has any bindings using the standard method
  this.nodeHasBindings = original.nodeHasBindings;

  // Return the bindings given a node and the bindingContext
  this.getBindings = function(node, bindingContext) {
    // Process the bindings with the standard provider if it produces an
    // error throw a binding error specifying the node and component
    try {
      return original.getBindings(node, bindingContext);
    } catch (ex) {
      const component = bindingContext.$component;
      throw new BindingError('Binding Error: ' + ex.message,
          component, node, ex);
    }
  };
};

ko.bindingProvider.instance = new ErrorHandlingBindingProvider();

// If a knockout error is raised rethrow it so the windows.error can
// process it
ko.onError = function(error) {
  throw error;
};

const errorSignal = new Signal();

window.onerror = function(msg, file, line, column, error) {
  return errorSignal.dispatch(error, msg, file, line, column);
};

export default errorSignal;
