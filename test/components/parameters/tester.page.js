define(['quark', 'knockout', 'text!./tester.page.html'], function($$, ko, template) {
    function ParametersTesterPage(params, $scope, $imports) {
        var self = this;

        this.pageObservable = ko.observable('Page');
        this.pageNotObservable = 'Page';
        this.pageNotToSet = ko.observable('Page');

        $$.wait($imports.ready, function() {
            self.child = $imports.get('child');
        });
    }

    return $$.component(ParametersTesterPage, template)
});
