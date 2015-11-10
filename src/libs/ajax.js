// Executes ajax call to the specified url
$$.ajax = function (url, method, data, callbacks, auth, options) {
    var opts = options || {};
    var clbks = callbacks || {};

    if (!url) {
        throw 'Must specify the target URL';
    }

    // If headers not defined send empty
    if (!$$.isDefined(opts.headers)) {
        opts.headers = {};
    }

    // If auth is required send the access token saved on session storage
    if (auth) {
        opts.headers['access_token'] = sessionStorage.getItem('token');
    }

    var onSuccess;

    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    $.ajax({
        url: url,
        type: method || 'GET',
        cache: opts.cache || false,
        data: data,
        async: opts.async || true,
        success: onSuccess,
        headers: opts.headers || {},
        complete: function() {
            if ($$.isDefined(clbks.onComplete)) {
                clbks.onComplete();
            }
        },
        xhrFields: {
            withCredentials: true
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // Check if some handler processed the error.
            var handled = false;

            // If there is an error handler defined in the call excute it. If has handled the error it must return true
            if ($$.isDefined(clbks.onError)) {
                handled = clbks.onError();
            }

            // If nobody has handled the error try to use a generic handler
            if (!handled) {
                // If it's a server error
                if (jqXHR.status >= 500 && jqXHR.status < 600) {
                    // Call all handlers in registration order until someone handles it (must return true)
                    for (var handlerName in $$.serverErrorHandlers) {
                        if ($$.serverErrorHandlers[handlerName](url, JSON.parse(jqXHR.responseText))) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                } else {
                    // If it's a client error
                    for (handlerName in $$.clientErrorHandlers) {
                        // Call all handlers in registration order until someone handles it (must return true)
                        if ($$.clientErrorHandlers[handlerName](url, jqXHR, textStatus, errorThrown)) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                }
            }
        }
    });
}
