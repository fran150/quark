import ko from 'knockout';
import is from './is';
import misc from './utils';

/**
  * This is an associative observable, it allows to maintain a collection
  * of key -> values. To be able to track changes, modifications must be made
  * using the provided methods
  * @param {object} initialValue The initial value for the associative
  * observable
  * @return {AssociativeObservable} Associative observable
  */
export default function AssociativeObservable(initialValue) {
  // Underlying observable (used to store the object)
  const underlying = ko.observable(initialValue);

  /**
   * Read or write values in the same way used for normal observables
   * @param {any} arguments If one argument is specified it writes its value
   * @return {any} If called without arguments it returns the current value
   */
  function Associative(...args) {
    // If called with arguments its a write, or else reads the value.
    if (args.length > 0) {
      underlying(args[0]);
      return this;
    } else {
      return underlying();
    }
  }

  /**
   * Store the element using the specified key.
   * You can use the key to retrieve the element later
   * @param {string} key The key used to store the value on the associative
   * array
   * @param {any} item Value to store in the associative array
   */
  Associative.add = function(key, item) {
    let object = underlying();

    // If object is not created initilize it
    if (!object) {
      object = {};
    }

    object[key] = item;

    underlying(object);
  };

  /**
   * Gets the item with the specified key
   * @param {string} key The key of the element to be found
   * @return {any} The value stored with the specified key
   */
  Associative.get = function(key) {
    const object = underlying();

    if (object) {
      if (is.defined(object[key])) {
        return object[key];
      } else {
        throw new Error('The specified key does not exists');
      }
    } else {
      throw new Error('The specified key does not exists');
    }
  };

  /**
   * Return true if the item with the specified key exists
   * @param {string} key The key of the element to check if its exists
   * @return {boolean} True if an item with the specified key exists
   */
  Associative.exists = function(key) {
    const object = underlying();

    if (object) {
      if (is.defined(object[key])) {
        return true;
      }
    }

    return false;
  };

  /**
   * Updates the value of the item with the specified key
   * @param {string} key Key of the item to update
   * @param {any} value New value of the item
   * @return {any} The value of the element before the update
   */
  Associative.update = function(key, value) {
    const object = underlying();

    if (object) {
      if (is.defined(object[key])) {
        // Get the original value
        const original = object[key];

        // Update to new value
        object[key] = value;

        // Rewrite the object and return the original value
        underlying(object);
        return original;
      } else {
        throw new Error('The specified key does not exists');
      }
    } else {
      throw new Error('The specified key does not exists');
    }
  };

  /**
   * Delete the item with the specified key
   * @param {string} key Key of the item to delete
   * @return {any} Value of the deleted item
   */
  Associative.remove = function(key) {
    const object = underlying();
    let original;

    if (object) {
      if (is.defined(object[key])) {
        original = object[key];
        delete object[key];

        underlying(object);
      } else {
        throw new Error('The specified key does not exists');
      }
    } else {
      throw new Error('The specified key does not exists');
    }

    return original;
  };

  /**
   * Returns a computed observable with an array containing all the values
   * @return {pureComputed} Observable with all the values in the
   */
  Associative.array = ko.pureComputed(function() {
    const object = underlying();
    const result = [];

    if (object) {
      misc.each(function(key, value) {
        result.push(value);
      });
    }

    return result;
  });

  /**
   * Invokes the callback method passing key and value of each element
   * in the array
   * @param {function} callback This function is called for each element
   * in the associative observable and receives the element's key and value
   * as parameters
   */
  Associative.each = function(callback) {
    const object = underlying();

    if (object) {
      misc.each(object, callback);
    }
  };

  /**
   * Subscribe to this observable
   * @param {function} callback Callback function to call every time
   * the observable value changes
   * @return {object} Subscription object. You must call this object
   * dispose method to free resources when the subscription is no longer needed.
   */
  Associative.subscribe = function(callback) {
    return underlying.subscribe(callback);
  };

  return Associative;
}
