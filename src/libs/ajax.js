var authorizing = false;

$$.ajaxConfig = {
    contentType: 'application/json',
    dataType : 'json',
    async: true,
    cache: false,
    authorization: {
        has: function() {
            return true;
        },
        configAuthorization: function(opts) {
            return opts;
        },
        authorize: function(opts, callback) {
            callback(true);
        }
    }
}

// Executes ajax call to the specified url
$$.ajax = function (url, method, data, callbacks, auth, options) {
    var opts = options || {};
    var clbks = callbacks || {};

    if (!url) {
        throw 'Must specify the target URL';
    }

    var onSuccess;

    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    var ajaxOptions = {
        url: url,
        type: method || 'GET',
        data: data,
        success: onSuccess,
        complete: function() {
            if ($$.isDefined(clbks.onComplete)) {
                clbks.onComplete();
            }
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
    }

    ajaxOptions = $.extend(ajaxOptions, $$.ajaxConfig);
    ajaxOptions = $.extend(ajaxOptions, opts);

    // If we aren´t authorizing must do the authorization flow
    // If we must authorize we must do the authorization flow otherwise call the service directly
    if (!authorizing && auth) {
        // Invoke service
        function invoke() {
            // Configure authorization on ajax request
            ajaxOptions = ajaxOptions.authorization.configAuthorization(ajaxOptions);

            // AJAX call
            $.ajax(ajaxOptions);
        }

        // If don´t have authorization we must authorize
        if (!ajaxOptions.authorization.has()) {
            // Set the flag to true so any ajax call during authorization does not trigger the authorization flow
            authorizing = true;

            // Call the function to authorize and wait for callback
            ajaxOptions.authorization.authorize(opts, function(authorized) {
                // When authorization is obtained invoke
                authorizing = false;
                if (authorized) {
                    invoke();
                }
            });
        } else {
            // If already have an authorization invoke
            invoke();
        }
    } else {
        // If its authorizing do the ajax call directly (not doing the authorization flow again)
        $.ajax(ajaxOptions);
    }
}
