import ko from 'knockout';
import utils from './utils';

/**
 * Extends all observables adding the refresh method wich
 * Clears and refill the observable with the original value to
 * force notify update.
 */
ko.observable.fn.refresh = function() {
  // Read the actual value
  const value = this();

  // Clear the observable and refill with the original value
  utils.undefine(this);
  this(value);
};

/**
 * Return the number of elements in the observable array
 * @return {int} Length of the array
 */
ko.observable.fn.size = function() {
  if (ko.isObservableArray(this)) {
    return this().length;
  }
};


/**
 * Maps from an observable object to a plain javascript object.
 * @param {any} observableObject Observable object to convert to a plain object
 * @return {any} Object without observable properties
 */
ko.mapToJS = function(observableObject) {
  return komapping.toJS(komapping.fromJS(observableObject));
};

/**
 * Maps from a plain javascript object to an observable object
 * (where all properties are observables)
 * @param {any} object Plain object to transform to observable object
 * @return {any} Observable object
 */
ko.mapFromJS = function(object) {
  return komapping.fromJS(komapping.toJS(object));
};

const originalParseBindingsString = ko.bindingProvider.prototype
    .parseBindingsString;

const re = /^\$\{(.+)\}$/;

/**
 * Extracts the bindable object
 * @param {any} objExpr Object expression
 * @param {BindingContext} bindingContext Binding context
 * @param {Element} node Node being processed
 * @param {any} options Binding options
 * @return {function} Mapped bindable object
 */
function extractBindableObject(objExpr, bindingContext, node, options) {
  const objBindingString = '_object: ' + objExpr;
  const objGetter = originalParseBindingsString.call(null,
      objBindingString, bindingContext, node, options);
  const obj = objGetter['_object']();

  return objectMap(obj, function(value) {
    return function() {
      return value;
    };
  });
}

/**
 * Maps the specified object
 * @param {any} obj Object to map
 * @param {function} mapper Mapper function
 * @return {any} Mapper object
 */
function objectMap(obj, mapper) {
  if (!obj) return obj;

  const result = {};

  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      result[prop] = mapper(obj[prop], prop, obj);
    }
  }

  return result;
}

/**
 * Allows for using ${object} to pass an entire object as parameters on
 * the custom elements
 * @author Jeff Mercado
 * @url http://stackoverflow.com/questions/25692720/can-a-custom-element-be-passed-an-object-for-the-params-like-the-component-bindi
 * @param {string} bindingsString Binding strings
 * @param {BindingContext} bindingContext Binding context
 * @param {Element} node Binding node
 * @param {any} options Binding options
 * @return {any} Parsed binding strings
 */
ko.bindingProvider.prototype.parseBindingsString = function(bindingsString,
    bindingContext, node, options) {
  const m = bindingsString.match(re);
  if (m) {
    return extractBindableObject.call(this,
        m[1], bindingContext, node, options);
  }
  // eslint-disable-next-line prefer-rest-params
  return originalParseBindingsString.apply(this, arguments);
};
