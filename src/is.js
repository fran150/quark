/**
 * Functions to check the type of objects and variables
 */
function Is() {
  /**
   * Return if the specified variable is defined
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is defined
   */
  this.defined = function(variable) {
    if (typeof variable === 'undefined') {
      return false;
    };

    return true;
  };

  /**
   * Check if the specified var is a string
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a string
   */
  this.string = function(variable) {
    if (typeof variable === 'string' || variable instanceof String) {
      return true;
    }

    return false;
  };

  /**
   * Check if the specified variable is a number (integer or decimal)
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a number
   */
  this.numeric = function(variable) {
    return (typeof variable === 'number');
  };

  /**
   * Check if the specified variable is an integer
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is an integer
   */
  this.integer = function(variable) {
    return Number(variable) === variable && variable % 1 === 0;
  };

  /**
   * Check if the specified variable is a decimal number
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a decimal number
   */
  this.decimal = function(variable) {
    return variable === Number(variable) && variable % 1 !== 0;
  };

  /**
   * Check if the specified variable is an array
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is an array
   */
  this.array = function(variable) {
    return Array.isArray(variable);
  };

  /**
   * Check if the specified variable is an object
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is an object
   */
  this.object = function(variable) {
    if (variable !== null && typeof variable === 'object'
        && !(variable instanceof Array)) {
      return true;
    }

    return false;
  };

  /**
   * Check if the specified variable is a function
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a function
   */
  this.function = function(variable) {
    if (variable !== null && typeof variable === 'function') {
      return true;
    }

    return false;
  };

  /**
   * Check if the specified variable is a date
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a function
   */
  this.date = function(variable) {
    if (variable instanceof Date) {
      return true;
    }

    return false;
  };

  /**
   * Check if the specified variable is a valid date
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable is a valid date
   */
  this.validDate = function(variable) {
    if (!this.isDate(variable)) {
      return false;
    }

    if (isNaN(variable.getTime())) {
      return false;
    }

    return true;
  };
};

export default new Is();
