define(['quark', 'knockout', 'text!./tester.component.html'], function($$, ko, template) {
    function ParametersTesterComponent(params, $scope, $imports) {
        var self = this;

        // Define diferent type of parameters
        $$.parameters({
            observable: ko.observable(),
            notObservable: '',
            notReceived: ko.observable('Model'),
        }, params, [this, $scope]);

        this.receivedButNotSet = ko.observable('Model');
    }

    return $$.component(ParametersTesterComponent, template)
})
