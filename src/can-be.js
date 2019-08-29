/**
 * Functions to check if a variable can be of some type
 */
function CanBe() {
  /**
   * Check if the specified variable can be a number (integer or decimal)
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable can be a number
   */
  this.numeric = function(variable) {
    return Number(variable) == variable;
  };

  /**
   * Returns if the specified variable can be an integer
   * @param {any} variable The variable to check
   * @return {boolean} True if the variable can be an integer
   */
  this.integer = function(variable) {
    return Number(variable) == variable && variable % 1 === 0;
  };

  /**
   * Check if the specified variable can be a decimal number
   * @param {any} variable The variable to check
   * @return {boolean} True if the specified variable can be a decimal number
   */
  this.decimal = function(variable) {
    return variable == Number(variable) && variable % 1 !== 0;
  };
};

export default new CanBe();
