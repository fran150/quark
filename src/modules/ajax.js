define(['jquery', 'utils'], function($, utils) {

    // Adds client error handlers repository
    utils.clientErrorHandlers = {};
    // Adds server error handlers repository
    utils.serverErrorHandlers = {};

    // Executes ajax call to the specified url
    utils.ajax = function (target, method, data, callbacks, options) {
        var opts = options || {};
        var clbks = callbacks || {};

        if (!target) {
            throw 'Must specify the target URL';
        }

        // If headers not defined send empty
        if (!utils.isDefined(opts.headers)) {
            opts.headers = {};
        }

        // If auth is required send the access token saved on session storage
        if (opts.auth) {
            opts.headers = {
                access_token: sessionStorage.getItem('token')
            };
        }

        var onSuccess;

        if (utils.isFunction(clbks)) {
            onSuccess = clbks;
        } else if (utils.isObject(clbks)) {
            onSuccess = clbks.onSuccess;
        }

        $.ajax({
            url: target,
            type: opts.method || 'GET',
            cache: opts.cache || false,
            data: data,
            async: opts.async || true,
            success: onSuccess,
            headers: opts.headers || {},
            error: function (jqXHR, textStatus, errorThrown) {
                var handled = false;

                // Try to
                if (utils.isDefined(clbks.onError)) {
                    handled = clbks.onError();
                }

                if (!handled) {
                    if (jqXHR.status >= 500 && jqXHR.status < 600) {
                        for (var handlerName in utils.serverErrorHandlers) {
                            if (utils.serverErrorHandlers[handlerName](target, JSON.parse(jqXHR.responseText))) {
                                handled = true;
                                break;
                            }
                        }
                    } else {
                        for (handlerName in utils.clientErrorHandlers) {
                            if (utils.clientErrorHandlers[handlerName](target, jqXHR, textStatus, errorThrown)) {
                                handled = true;
                                break;
                            }
                        }
                    }
                }
            }
        });
    }

    return utils;
});
