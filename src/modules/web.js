define(['knockout', 'jquery', 'modules/utils', 'blockui'], function(ko, $, utils) {
    var self = this;

    function Web() {
        // Url functions

        // Redirect the browser to the specified url
        this.redirect = function(url) {
            window.location.href = url;
            return true;
        }

        // Gets value of the parameter from the URL
        this.getParam = function (parameterName) {
            var result = undefined;
            var tmp = [];

            location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                });

            return result;
        }

        // UI Functions

        // Replace the placeholder content with the html specified and bind the model to the new context
        this.replaceAndBind = function (placeholderSelector, html, model) {
            $(placeholderSelector).html(html);
            ko.cleanNode(placeholderSelector.get(0));
            ko.applyBindings(model, placeholderSelector.get(0));
        }


        // Blocks user input for the specified target showing a message. If no target specified blocks entire screen
        this.block = function (message, target) {
            if (!message)
                message = 'Loading...';

            var options = {
                message: message,
                css: {
                    border: 'none',
                    padding: '5px',
                    backgroundColor: '#000',
                    '-webkit-border-radius': '5px',
                    '-moz-border-radius': '5px',
                    opacity: .7,
                    color: '#fff'
                },
                baseZ: 5000
            }

            if (target) {
                $(target).block(options);
            } else {
                $.blockUI(options);
            }
        }

        // Unblock user input from the specified target (JQuery Selector)
        this.unblock = function (target) {
            if (target) {
                $(target).unblock();
            } else {
                $.unblockUI();
            }
        }

        // Encode the value as HTML
        this.htmlEncode = function (value) {
            if (value) {
                return $('<div />').text(value).html();
            } else {
                return '';
            }
        }

        // Decode the html to a string.
        this.htmlDecode = function (value) {
            if (value) {
                return $('<div />').html(value).text();
            } else {
                return '';
            }
        };

        // Limit the string to the specified number of chars. If the text is larger adds '...' to the end.
        this.limitText = function (value, limit) {
            if (!utils.isInt(limit)) {
                limit = 6;
            } else {
                if (limit < 6) {
                    limit = 6;
                }
            }

            if (utils.isString(value)) {
                if (value.length > limit) {
                    value = value.substr(0, limit - 3) + '...';
                }

                return value;
            } else {
                return '';
            }
        }

        // Sets the specified cookie, its value, and duration in seconds
        this.setCookie = function (name, value, duration) {
            var d = new Date();

            if (duration !== undefined) {
                d.setTime(d.getTime() + (duration * 1000));
                var expires = "expires=" + d.toUTCString();
                document.cookie = name + "=" + value + "; " + expires;
            } else {
                document.cookie = name + "=" + value + "; ";
            }
        }

        // Gets the value of the specified cookie
        this.getCookie = function (name) {
            name = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1);
                if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
            }
            return "";
        }
    }

    return new Web();
});
