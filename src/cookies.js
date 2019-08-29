/**
 * Methods to work with cookies
 */
function Cookies() {
  const self = this;
  /**
   * Creates a cookie.
   * @param {string} name Name of the cookie
   * @param {string} value Value of the cookie
   * @param {int} duration Number of seconds that cookie should last, if
   * not specified it will use the browser default
   */
  this.setCookie = function(name, value, duration) {
    const now = new Date();

    if (duration !== undefined) {
      now.setTime(now.getTime() + (duration * 1000));
      const expires = 'expires=' + now.toUTCString();
      document.cookie = name + '=' + value + '; ' + expires;
    } else {
      document.cookie = name + '=' + value + '; ';
    }
  };

  /**
   * Gets the value of the specified cookie or undefined if not exists.
   * @param {sring} name Name of the cookie to read
   * @return {string} Value of the cookie or undefined if not exists
   */
  this.getCookie = function(name) {
    const cookieName = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }

    return undefined;
  };

  /**
   * Clears the specified cookie
   * @param {string} name Name of the cookie to delete
   */
  this.clearCookie = function(name) {
    self.setCookie(name, '', -1);
  };
}

export default new Cookies();
