
// Adds client error handlers repository
$$.clientErrorHandlers = {};
// Adds server error handlers repository
$$.serverErrorHandlers = {};

// Executes ajax call to the specified url
$$.ajax = function (target, method, data, callbacks, options) {
    var opts = options || {};
    var clbks = callbacks || {};

    if (!target) {
        throw 'Must specify the target URL';
    }

    // If headers not defined send empty
    if (!$$.isDefined(opts.headers)) {
        opts.headers = {};
    }

    // If auth is required send the access token saved on session storage
    if (opts.auth) {
        opts.headers = {
            access_token: sessionStorage.getItem('token')
        };
    }

    var onSuccess;

    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
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
                        if ($$.serverErrorHandlers[handlerName](target, JSON.parse(jqXHR.responseText))) {
                            // If its handled stop executing handlers
                            handled = true;
                            break;
                        }
                    }
                } else {
                    // If it's a client error
                    for (handlerName in $$.clientErrorHandlers) {
                        // Call all handlers in registration order until someone handles it (must return true)
                        if ($$.clientErrorHandlers[handlerName](target, jqXHR, textStatus, errorThrown)) {
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
