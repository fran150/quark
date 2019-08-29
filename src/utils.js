import ko from 'knockout';
import is from './is';
/**
 * Utility functions
 */
function Utils() {
  const self = this;

  /**
   * Allows to iterate over the specified object properties calling the callback
   * function for each item passing the key and value of each element.
   * @param {object} object Object to iterate
   * @param {function} callback Function to call for each item in the object
   */
  this.each = function(object, callback) {
    for (const name in object) {
      if (Object.prototype.hasOwnProperty.call(object, name)) {
        const value = object[name];
        callback(name, value);
      }
    }
  };

  /**
   * Makes the prototype of the specified class extend from the parent
   * class
   * @param {class} Class Class extending the specified parent
   * @param {class} Parent Parent to extend
   */
  this.extends = function(Class, Parent) {
    Object.setPrototypeOf(Class, Parent);
    Class.prototype = Object.create(Parent.prototype);
    Class.prototype.constructor = Class;
  };

  /**
   * Merges the source object into the target
   * @param {any} target Target object in where the source object will be
   * merged
   * @param {any} source Source object from where to obtain the properties
   */
  this.merge = function(target, source) {
    self.each(source, function(propertyName, value) {
      if (!is.object(value)) {
        target[propertyName] = value;
      } else {
        target[propertyName] = {};
        self.merge(target[propertyName], value);
      }
    });
  };

  /**
   * Limit the string to the specified number of chars.
   * If the text is larger adds '...' to the end.
   * @param {string} value Text to limit
   * @param {int} limit Max number of character including the ...
   * @return {string} Limited string
   */
  this.limitText = function(value, limit) {
    let effectiveLimit = limit;
    let result = value;

    if (!is.integer(limit)) {
      effectiveLimit = 6;
    } else {
      if (limit < 6) {
        effectiveLimit = 6;
      }
    }

    if (is.string(value)) {
      if (value.length > effectiveLimit) {
        result = value.substr(0, effectiveLimit - 3) + '...';
      }

      return result;
    } else {
      return '';
    }
  };

  /**
   * Undefine the specified object (variable or observable)
   * @param {any} object Variable or observable to undefine
   */
  this.undefine = function(object) {
    if (ko.isObservable(object)) {
      object(undefined);
    } else {
      object = undefined;
    }
  };

  /**
   * Escape the string to replace with a regexp
   * @param {string} str String to replace
   * @return {RegExp} Regular expression for the replace
   */
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  /**
   * Replaces all ocurrences of 'find' with 'replace' on the specified string
   * @param {string} str String in where to do the replacement
   * @param {string} find String to replace
   * @param {string} replace Replacement string
   * @return {string} String with all ocurrences replaced
   */
  this.replaceAll = function(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  };

  /**
   * Formats the specified string
   * Can be used in two forms.
   * The first parameter is always the string to format.
   * If only two parameters are specified and the second is an object
   * replaces {propertyName} in the specified string for the value of the
   * property with the same name in the object
   * Otherwise replaces {0}, {1}.. in the specified string for the first,
   * second..etc parameter after the string.
   * @example
   * formatString('Hello {0}, {1}', 'World', '2016');
   * formatString('Hello {place}, {year}', { place: 'World', year: 2016 })
   * @return {string} Formatted string
   */
  this.formatString = function(...args) {
    let str = args[0];

    // If the function has exactly two arguments, the first is the string
    // and the second is an object assume the first is the string and the
    // second an object
    if (args.length == 2 && is.string(args[0]) && is.object(args[1])) {
      const object = args[1];
      let string = str;

      self.each(object, function(name, value) {
        string = replaceAll(string, '{' + name + '}', value);
      });

      return string;
    } else {
      for (let i = 1; i < args.length; i++) {
        str = replaceAll(str, '{' + (i - 1) + '}', args[i]);
      }

      return str;
    }
  };
};

export default new Utils();
