import routing from './routing';

/**
 * Url handling methods
 */
function Url() {
  const self = this;
  /**
   * Redirect the browser to the specified url
   * @param {string} url Url to where to redirect the browser
   */
  this.redirect = function(url) {
    window.location.href = url;
  };

  /**
   * Redirect the browser to the specified page
   * @param {string} page Path of the page where to redirect the browser
   * @param {any} config Object where each property is the name and value
   * for a parameter of the specified page
   */
  this.redirectHash = function(page, config) {
    const hash = routing.hash(page, config);
    self.redirect('#' + hash);
  };

  /**
   * Gets value of the parameter from the URL
   * @param {string} parameterName Name of the url parameter
   * @return {string} Parameter value if found or undefined
   */
  this.getParam = function(parameterName) {
    let result = undefined;
    let tmp = [];

    location.search
        .substr(1)
        .split('&')
        .forEach(function(item) {
          tmp = item.split('=');
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });

    return result;
  };
};

export default new Url();
