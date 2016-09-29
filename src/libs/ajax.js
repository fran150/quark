// Is quark authorizing?
var authorizing = false;

// Default ajax config.
// Sets the content for json, async calls and no cache.
// Define a default (overriden) authorization flow.
// Quark can automatically authorize your ajax calls, if you specify that an ajax calls needs authorization quark will go trough the
// authentication flow.
// First uses the authorization.has function to determine if the user has credentials, if the function returns true quark assumes that
// has credentials and doesn't need to ask for. (for example checking session storage for an existing token)
// If authorization.has function returns false, calls authorization.authorize function to ask for credentials, passing a callback
// that must be called when a valid credential has been obtained. (for example after showing an popup to enter user and password)
// Finally, before any ajax call that requires authentication calls configAuthorization to config ajax for pass the credentials to the
// server (i.e. adding a token to the request header)
// Both configAuthorization and authorize receive an opts object with the actual ajax configuration to use in any ajax call.
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

// Executes an ajax call to the specified url
// Method is an string with the method to use, GET, PUT, POST, DELETE, etc.
// Data is an object with the data to send to the server.
// Callbacks allows to define an object with the methods:
//      onSuccess: this will be called if the ajax method returned ok, and will pass as parameter the data received.
//      onError: this will be called if the ajax method returns an error, must try to handle the error, and if it could return true,
//               if returns other than true the error will be handed to the error handlers.
//      onComplete: this will be called when ajax call finishes (ok or with error)
// If callbacks is not specified as an object but as a function it will be assumed that is the onSuccess function.
// auth is a boolean indicating if the ajax call needs authentication (triggering the authentication flow)
// Finally options allows to customize ajax options for the call.
$$.ajax = function (url, method, data, callbacks, auth, options) {
    // Default value for parameters
    var opts = options || {};
    var clbks = callbacks || {};

    // Error if target is not specified
    if (!url) {
        throw new Error('Must specify the target URL');
    }

    // Check if callbacks is defined as function or object
    var onSuccess;

    // If is function assume that it is the onSuccess, if not extract the onSuccess function.
    if ($$.isFunction(clbks)) {
        onSuccess = clbks;
    } else if ($$.isObject(clbks)) {
        onSuccess = clbks.onSuccess;
    }

    // Configure ajax options
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
                handled = clbks.onError(jqXHR, textStatus, errorThrown);
            }

            // If nobody has handled the error try to use a generic handler
            if (!handled) {
                // Call all handlers in registration order until someone handles it (must return true)
                for (var handlerName in $$.ajaxErrorHandlers) {
                    if ($$.ajaxErrorHandlers[handlerName](url, opts.source, jqXHR, textStatus, errorThrown)) {
                        // If its handled stop executing handlers
                        handled = true;
                        break;
                    }
                }
            }
        }
    }

    // Combine ajax options with the defaults
    ajaxOptions = $.extend(ajaxOptions, $$.ajaxConfig);
    // Override ajax default options with this call specifics
    ajaxOptions = $.extend(ajaxOptions, opts);

    // If we are authorizing or the ajax call doesnt need authorization we make the call directly (no authorization flow)
    // If the call needs authorization and we are not authorizing we do the authorization flow
    if (!authorizing && auth) {
        // Configures authorization and makes the ajax call
        function invoke() {
            // Configure authorization on ajax request
            ajaxOptions = ajaxOptions.authorization.configAuthorization(ajaxOptions);

            // AJAX call
            $.ajax(ajaxOptions);
        }

        // If don´t have authorization we must authorize
        if (!ajaxOptions.authorization.has()) {
            // Set the flag to true so any ajax call during authorization does not trigger the authorization flow (again)
            authorizing = true;

            // Call the function to authorize and wait for callback
            ajaxOptions.authorization.authorize(function(authorized) {
                // When authorization is obtained clear the authorizing flag
                authorizing = false;

                // Then if credentials are obtained make the ajax call
                if (authorized) {
                    invoke();
                }
            });
        } else {
            // If already have credentials invoke
            invoke();
        }
    } else {
        // If its authorizing do the ajax call directly (not doing the authorization flow again)
        $.ajax(ajaxOptions);
    }
}
