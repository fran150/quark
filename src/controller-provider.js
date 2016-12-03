
// Default controller provider
$$.controllerProvider = function(page, successCallback, errorCallback) {
    var self = this;
    // Base path of the controllers
    this.controllersBase = 'controllers';

    require([self.controllersBase + '/' + page], function(ControllerClass) {
        successCallback(ControllerClass);
    }, function(error) {
        errorCallback();
    });
}
