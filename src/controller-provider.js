
// Default controller provider
$$.controllerProvider = function(page, successCallback, errorCallback) {
    var self = this;

    // Module path
    var path = '';

    // Set the controllers base
    this.controllersBase = 'controllers';

    // Get the page config
    var pageConfig = $$.routing.getPageConfig(page);

    // If is a page module
    if (pageConfig.module) {
        path = pageConfig.module + '/' + self.controllersBase + '/' + page + '.controller';
    } else {
        path = self.controllersBase + '/' + page + '.controller';
    }

    // Base path of the controllers
    require([path], function(ControllerClass) {
        successCallback(ControllerClass);
    }, function(error) {
        errorCallback();
    });
}
