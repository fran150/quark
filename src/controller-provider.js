
// Default controller provider
$$.controllerProvider = function(page, successCallback, errorCallback) {
    // Base path of the controllers
    this.controllersBase = 'controllers';

    require(page, function(ControllerClass) {
        successCallback(ControllerClass);
    }, function(error) {
        errorCallback();
    });
}
